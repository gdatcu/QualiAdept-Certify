import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/github/sync/route';
import { prisma } from '@/lib/prisma';
import { getAuthSession } from '@/lib/auth';
import * as githubSync from '@/lib/github-sync';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    assignment: {
      findUnique: vi.fn(),
    },
    submission: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getAuthSession: vi.fn(),
}));

vi.mock('@/lib/github-sync', () => ({
  syncModuleCodeToGitHub: vi.fn(),
}));

describe('/api/github/sync Route Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 if user is unauthenticated', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/github/sync', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 if assignmentId is missing', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as any);

    const req = new Request('http://localhost:3000/api/github/sync', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 if assignment does not exist', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as any);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce(null);

    const req = new Request('http://localhost:3000/api/github/sync', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'non-existent' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('syncs code successfully using direct code payload', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as any);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-1',
      title: 'Sesiunea 1: HTML DOM',
      module: 1,
      validationType: 'STATIC',
    } as any);

    vi.mocked(githubSync.syncModuleCodeToGitHub).mockResolvedValueOnce({
      success: true,
      repoUrl: 'https://github.com/student/qualiadept-task-tracker',
      commitUrl: 'https://github.com/student/qualiadept-task-tracker/commit/123',
      filePath: 'index.html',
    });

    const req = new Request('http://localhost:3000/api/github/sync', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-1',
        codePayload: '<h1>Valid Code</h1>',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.repoUrl).toBe('https://github.com/student/qualiadept-task-tracker');
  });

  it('syncs multi-file payload successfully', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as any);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-2',
      title: 'Sesiunea 2: CSS',
      module: 2,
      validationType: 'STATIC',
    } as any);

    vi.mocked(githubSync.syncModuleCodeToGitHub).mockResolvedValueOnce({
      success: true,
      repoUrl: 'https://github.com/student/qualiadept-task-tracker',
      commitUrl: 'https://github.com/student/qualiadept-task-tracker/commit/mf456',
      filePath: 'index.html',
      syncedFiles: ['index.html', 'style.css'],
      commitMessage: 'feat(session-2): update index.html, style.css for Sesiunea 2: CSS (Verified 100% by QualiAdept)',
    });

    const req = new Request('http://localhost:3000/api/github/sync', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-2',
        codePayload: JSON.stringify({
          files: {
            'index.html': '<h1>Title</h1>',
            'style.css': 'body { color: blue; }',
          },
        }),
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.syncedFiles).toEqual(['index.html', 'style.css']);
    expect(json.commitMessage).toContain('update index.html, style.css');
  });

  it('syncs specific targetFile successfully when requested', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as never);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-2',
      title: 'Sesiunea 2: CSS',
      module: 2,
      validationType: 'STATIC',
    } as never);

    vi.mocked(githubSync.syncModuleCodeToGitHub).mockResolvedValueOnce({
      success: true,
      repoUrl: 'https://github.com/student/qualiadept-task-tracker',
      commitUrl: 'https://github.com/student/qualiadept-task-tracker/commit/css789',
      filePath: 'style.css',
      syncedFiles: ['style.css'],
    });

    const req = new Request('http://localhost:3000/api/github/sync', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-2',
        targetFile: 'style.css',
        codePayload: JSON.stringify({
          files: {
            'index.html': '<h1>Title</h1>',
            'style.css': 'body { color: blue; }',
          },
        }),
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.filePath).toBe('style.css');
    expect(json.syncedFiles).toEqual(['style.css']);
    expect(githubSync.syncModuleCodeToGitHub).toHaveBeenCalledWith(
      expect.objectContaining({
        moduleNum: 2,
        targetFile: 'style.css',
      })
    );
  });

  it('returns HTTP 504 when GitHub sync times out (BUG-10)', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as never);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-9',
      title: 'Sesiunea 9: Playwright',
      module: 9,
      validationType: 'STATIC',
    } as never);

    vi.mocked(githubSync.syncModuleCodeToGitHub).mockResolvedValueOnce({
      success: false,
      error: 'SYNC_TIMEOUT',
      message: 'Sincronizarea cu GitHub a depășit limita de timp (timeout). Te rugăm să reîncerci.',
    });

    const req = new Request('http://localhost:3000/api/github/sync', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-9',
        codePayload: JSON.stringify({ files: { 'playwright.config.ts': 'export default {};' } }),
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(504);

    const json = await res.json();
    expect(json.code).toBe('SYNC_TIMEOUT');
    expect(json.error).toContain('timeout');
  });

  it('returns HTTP 200 with upToDate: true when code has no changes (BUG-15)', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1' },
    } as never);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-9',
      title: 'Sesiunea 9: Playwright',
      module: 9,
      validationType: 'STATIC',
    } as never);

    vi.mocked(githubSync.syncModuleCodeToGitHub).mockResolvedValueOnce({
      success: true,
      upToDate: true,
      repoUrl: 'https://github.com/student/qualiadept-task-tracker',
      commitUrl: 'https://github.com/student/qualiadept-task-tracker/commit/head123',
      filePath: 'playwright.config.ts',
      syncedFiles: ['playwright.config.ts', 'tests/task-tracker.spec.ts'],
      message: 'Codul este deja sincronizat pe GitHub — nicio modificare nouă.',
    });

    const req = new Request('http://localhost:3000/api/github/sync', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-9',
        codePayload: JSON.stringify({ files: { 'playwright.config.ts': 'export default {};' } }),
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.upToDate).toBe(true);
    expect(json.message).toContain('deja sincronizat');
  });
});
