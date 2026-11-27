import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as submitDynamic } from '@/app/api/validate/dynamic/route';
import { GET as fetchPayload } from '@/app/api/validate/dynamic/payload/route';
import { POST as runnerCallback } from '@/app/api/validate/dynamic/callback/route';
import { GET as pollSubmission } from '@/app/api/submissions/[id]/route';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import { sendDiscordTriumphNotification } from '@/lib/webhook';
import { signRunnerMessage } from '@/lib/dynamic-runner';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    assignment: {
      findUnique: vi.fn(),
    },
    submission: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('@/lib/webhook', () => ({
  sendDiscordTriumphNotification: vi.fn().mockResolvedValue(undefined),
}));

const RUNNER_SECRET = 'test-hmac-secret-qualiadept-2026-32bytes';

const m10MiniRules = JSON.stringify([
  {
    file: 'task-tracker-e2e.spec.ts',
    name: '[task-tracker-e2e.spec.ts] 1. Importă test și expect',
    check: 'regex',
    pattern: String.raw`import\s*\{(?=[^}]*\btest\b)(?=[^}]*\bexpect\b)[^}]*\}\s*from\s*['"]@playwright\/test['"]`,
    message: 'Importă test și expect.',
    successMessage: 'OK',
  },
  {
    file: 'task-tracker-e2e.spec.ts',
    name: '[task-tracker-e2e.spec.ts] 10. Inspector Hygiene',
    check: 'regexInverted',
    includeComments: true,
    pattern: String.raw`\bpage\.pause\s*\(`,
    message: 'Elimină page.pause().',
    successMessage: 'Curat',
  },
]);

const validSpec = `import { test, expect } from '@playwright/test';
test('creates high priority task', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('task-list')).toBeVisible();
});`;

describe('Two-Stage GitHub Actions Dynamic Runner Flow (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.EVAL_RUNNER_REPO = 'gdatcu/qualiadept-eval-runner';
    process.env.EVAL_RUNNER_TOKEN = 'ghp_mock_runner_token';
    process.env.EVAL_CALLBACK_SECRET = RUNNER_SECRET;

    vi.mocked(getAuthSession).mockResolvedValue({
      user: { id: 'student-1', name: 'Ana QA', email: 'ana@qualiadept.eu', role: 'STUDENT' },
      expires: '2027-01-01',
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'student-1',
      name: 'Ana QA',
      isEnrolled: true,
      role: 'STUDENT',
    } as never);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
      id: 'm10-id',
      module: 10,
      title: 'Sesiunea 10: Navigare și Acțiuni de Bază',
      validationType: 'DYNAMIC',
      validationRules: m10MiniRules,
    } as never);
    vi.mocked(prisma.submission.findMany).mockResolvedValue([
      { assignment: { module: 9 } },
    ] as never);
    vi.mocked(prisma.submission.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.submission.count).mockResolvedValue(0);
  });

  afterEach(() => {
    delete process.env.EVAL_RUNNER_REPO;
    delete process.env.EVAL_RUNNER_TOKEN;
    delete process.env.EVAL_CALLBACK_SECRET;
    vi.unstubAllGlobals();
  });

  it('Stage 1 FAIL rejects immediately (200 FAIL) without calling GitHub Actions', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(prisma.submission.create).mockResolvedValue({ id: 'sub-fail-s1' } as never);

    const codeWithPause = `${validSpec}\n// await page.pause();`;
    const req = new NextRequest('http://localhost:3000/api/validate/dynamic', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'm10-id',
        files: { 'task-tracker-e2e.spec.ts': codeWithPause },
      }),
    });

    const res = await submitDynamic(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('fail');
    expect(data.stage).toBe('static');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Stage 1 blocks restricted Node APIs (child_process/fs) before touching GitHub Actions', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(prisma.submission.create).mockResolvedValue({ id: 'sub-unsafe' } as never);

    const maliciousSpec = `${validSpec}\nconst cp = require('child_process');`;
    const req = new NextRequest('http://localhost:3000/api/validate/dynamic', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'm10-id',
        files: { 'task-tracker-e2e.spec.ts': maliciousSpec },
      }),
    });

    const res = await submitDynamic(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('fail');
    expect(data.feedback.some((f: { check: string }) => f.check.includes('Sandbox'))).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('Stage 1 PASS queues PENDING submission and dispatches GitHub Actions (202 Accepted)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ status: 204, ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.mocked(prisma.submission.create).mockResolvedValue({ id: 'sub-pending-1' } as never);

    const req = new NextRequest('http://localhost:3000/api/validate/dynamic', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'm10-id',
        files: { 'task-tracker-e2e.spec.ts': validSpec },
      }),
    });

    const res = await submitDynamic(req);
    expect(res.status).toBe(202);
    const data = await res.json();
    expect(data.status).toBe('pending');
    expect(data.stage).toBe('dynamic_queued');
    expect(data.submissionId).toBe('sub-pending-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(prisma.submission.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING', score: 0 }),
      })
    );
  });

  it('GET /api/validate/dynamic/payload serves PENDING payload only with valid HMAC signature', async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue({
      id: 'sub-pending-1',
      status: 'PENDING',
      codePayload: JSON.stringify({ files: { 'task-tracker-e2e.spec.ts': validSpec } }),
      assignment: { module: 10, title: 'S10' },
    } as never);

    // Invalid signature -> 401
    const badReq = new NextRequest(
      'http://localhost:3000/api/validate/dynamic/payload?submissionId=sub-pending-1',
      { headers: { 'x-eval-timestamp': String(Date.now()), 'x-eval-signature': 'deadbeef' } }
    );
    expect((await fetchPayload(badReq)).status).toBe(401);

    // Valid signature -> 200 with code
    const ts = String(Date.now());
    const sig = signRunnerMessage('GET:sub-pending-1', ts, RUNNER_SECRET);
    const okReq = new NextRequest(
      'http://localhost:3000/api/validate/dynamic/payload?submissionId=sub-pending-1',
      { headers: { 'x-eval-timestamp': ts, 'x-eval-signature': sig } }
    );
    const res = await fetchPayload(okReq);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.fileName).toBe('task-tracker-e2e.spec.ts');
    expect(data.code).toContain('creates high priority task');
  });

  it('POST /api/validate/dynamic/callback verifies HMAC, merges Stage 1 + Stage 2, updates PASS, stores logs, and fires Discord', async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue({
      id: 'sub-pending-1',
      userId: 'student-1',
      status: 'PENDING',
      feedbackJSON: JSON.stringify({
        status: 'pending',
        locale: 'ro',
        primaryFileName: 'task-tracker-e2e.spec.ts',
        feedback: [
          { check: '1. Importă test și expect', passed: true, message: 'OK', file: 'task-tracker-e2e.spec.ts' },
        ],
      }),
      assignment: { module: 10, title: 'Sesiunea 10' },
      user: { id: 'student-1', name: 'Ana QA' },
    } as never);
    vi.mocked(prisma.submission.update).mockResolvedValue({ id: 'sub-pending-1' } as never);

    const callbackBody = JSON.stringify({
      submissionId: 'sub-pending-1',
      tests: [
        { title: 'utilizatorul creează un task', passed: true, durationMs: 1200 },
        { title: 'utilizatorul bifează și debifează', passed: true, durationMs: 900 },
        { title: 'utilizatorul șterge primul task', passed: true, durationMs: 850 },
      ],
      executionLogs: '\u001b[32m3 passed (2.9s)\u001b[39m',
      runUrl: 'https://github.com/gdatcu/qualiadept-eval-runner/actions/runs/12345',
    });

    const ts = String(Date.now());
    const sig = signRunnerMessage(callbackBody, ts, RUNNER_SECRET);

    const req = new NextRequest('http://localhost:3000/api/validate/dynamic/callback', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-eval-timestamp': ts,
        'x-eval-signature': sig,
      },
      body: callbackBody,
    });

    const res = await runnerCallback(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ ok: true, submissionId: 'sub-pending-1', status: 'pass', score: 100 });

    const updateArg = vi.mocked(prisma.submission.update).mock.calls[0][0];
    expect(updateArg.data.status).toBe('PASS');
    expect(updateArg.data.score).toBe(100);
    const savedJson = JSON.parse(updateArg.data.feedbackJSON as string);
    expect(savedJson.feedback).toHaveLength(4); // 1 Stage 1 + 3 Stage 2
    expect(savedJson.executionLogs).toBe('3 passed (2.9s)');
    expect(savedJson.runUrl).toBe('https://github.com/gdatcu/qualiadept-eval-runner/actions/runs/12345');
    expect(sendDiscordTriumphNotification).toHaveBeenCalledTimes(1);
  });

  it('POST /api/validate/dynamic/callback ignores duplicate callbacks on already finalized submissions', async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue({
      id: 'sub-done',
      userId: 'student-1',
      status: 'PASS',
      feedbackJSON: '{}',
      assignment: { module: 10, title: 'S10' },
      user: { id: 'student-1', name: 'Ana QA' },
    } as never);

    const body = JSON.stringify({ submissionId: 'sub-done', tests: [] });
    const ts = String(Date.now());
    const sig = signRunnerMessage(body, ts, RUNNER_SECRET);

    const req = new NextRequest('http://localhost:3000/api/validate/dynamic/callback', {
      method: 'POST',
      headers: { 'x-eval-timestamp': ts, 'x-eval-signature': sig },
      body,
    });

    const res = await runnerCallback(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ignored).toBe(true);
    expect(prisma.submission.update).not.toHaveBeenCalled();
  });

  it('GET /api/submissions/[id] enforces owner/trainer auth and auto-recovers stale PENDING jobs', async () => {
    // Another student -> 403
    vi.mocked(prisma.submission.findUnique).mockResolvedValueOnce({
      id: 'sub-stale',
      userId: 'other-student',
      assignmentId: 'm10-id',
      status: 'PENDING',
      score: 0,
      feedbackJSON: '{}',
      submittedAt: new Date(),
    } as never);

    const forbiddenRes = await pollSubmission(
      new NextRequest('http://localhost:3000/api/submissions/sub-stale'),
      { params: Promise.resolve({ id: 'sub-stale' }) }
    );
    expect(forbiddenRes.status).toBe(403);

    // Owner polling a >3 min stale PENDING job -> auto-recovers to FAIL
    vi.mocked(prisma.submission.findUnique).mockResolvedValueOnce({
      id: 'sub-stale',
      userId: 'student-1',
      assignmentId: 'm10-id',
      status: 'PENDING',
      score: 0,
      feedbackJSON: JSON.stringify({
        status: 'pending',
        locale: 'ro',
        feedback: [{ check: '1. Import', passed: true, message: 'OK' }],
      }),
      submittedAt: new Date(Date.now() - 4 * 60 * 1000),
    } as never);
    vi.mocked(prisma.submission.update).mockResolvedValue({ id: 'sub-stale' } as never);

    const recoveredRes = await pollSubmission(
      new NextRequest('http://localhost:3000/api/submissions/sub-stale'),
      { params: Promise.resolve({ id: 'sub-stale' }) }
    );
    expect(recoveredRes.status).toBe(200);
    const data = await recoveredRes.json();
    expect(data.status).toBe('fail');
    expect(data.feedback[1].check).toContain('Timeout');
    expect(prisma.submission.update).toHaveBeenCalled();
  });
});
