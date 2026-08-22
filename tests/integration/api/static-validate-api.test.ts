import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/validate/static/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    assignment: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    submission: {
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('@/lib/webhook', () => ({
  sendDiscordTriumphNotification: vi.fn().mockResolvedValue(undefined),
}));

describe('/api/validate/static Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 if request body is not valid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: 'invalid-json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON payload');
  });

  it('returns 401 if user is unauthenticated', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({ htmlCode: '<main></main>' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 if user is not enrolled and not a trainer', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-unenrolled', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-unenrolled',
      isEnrolled: false,
      role: 'STUDENT',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({ htmlCode: '<main></main>' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 429 if rate limit threshold (3s lock) is triggered', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-1',
      isEnrolled: true,
      role: 'STUDENT',
    } as any);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-1',
      title: 'Module 1 HTML',
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce({
      id: 'sub-recent',
      submittedAt: new Date(Date.now() - 1000), // 1s ago (< 3s)
    } as any);

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-1', htmlCode: '<main></main>' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain('wait a few seconds');
  });

  it('evaluates static HTML code and returns 200 PASS when all assertions pass', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1', name: 'George', email: 'george@qualiadept.eu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-1',
      isEnrolled: true,
      role: 'STUDENT',
      name: 'George',
    } as any);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-1',
      module: 1,
      title: 'Task Tracker HTML',
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    const passingHtml = `
      <main>
        <h1>Task Tracker</h1>
        <div id="add-task-section">
          <button data-testid="submit-btn">Submit</button>
        </div>
      </main>
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-1', htmlCode: passingHtml }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.length).toBe(3);
    expect(prisma.submission.create).toHaveBeenCalled();
  });
});
