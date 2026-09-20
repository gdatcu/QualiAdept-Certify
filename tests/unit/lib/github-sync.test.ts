import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncModuleCodeToGitHub, getModuleFilePath, REPO_NAME } from '@/lib/github-sync';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: {
      findFirst: vi.fn(),
    },
  },
}));

describe('github-sync Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('getModuleFilePath', () => {
    it('maps module 0 to sandbox.html', () => {
      expect(getModuleFilePath(0)).toBe('sandbox.html');
    });

    it('maps module 1 to index.html', () => {
      expect(getModuleFilePath(1)).toBe('index.html');
    });

    it('maps module 2 to style.css', () => {
      expect(getModuleFilePath(2)).toBe('style.css');
    });

    it('maps dynamic module to Playwright spec path', () => {
      expect(getModuleFilePath(7, 'DYNAMIC')).toBe('tests/e2e/module-7.spec.ts');
    });

    it('maps general module to app.js', () => {
      expect(getModuleFilePath(3)).toBe('app.js');
    });
  });

  describe('syncModuleCodeToGitHub', () => {
    it('returns error if userId or codePayload are missing', async () => {
      const res = await syncModuleCodeToGitHub({
        userId: '',
        moduleNum: 1,
        codePayload: '',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('INVALID_ARGUMENTS');
    });

    it('returns error if no OAuth token is found for user', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce(null);

      const res = await syncModuleCodeToGitHub({
        userId: 'u-123',
        moduleNum: 1,
        codePayload: '<main>Code</main>',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('NO_TOKEN');
    });

    it('creates repository if missing and commits file successfully', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        access_token: 'gho_dummy_token',
      } as any);

      // Mock GitHub API responses:
      // 1. GET /user -> { login: 'student_gh' }
      // 2. GET /repos/student_gh/qualiadept-task-tracker -> 404 (Not Found)
      // 3. POST /user/repos -> 201 (Created)
      // 4. GET /repos/student_gh/qualiadept-task-tracker/contents/index.html -> 404 (New file)
      // 5. PUT /repos/student_gh/qualiadept-task-tracker/contents/index.html -> 201 (Committed)
      const fetchMock = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
        if (url === 'https://api.github.com/user') {
          return new Response(JSON.stringify({ login: 'student_gh' }), { status: 200 });
        }
        if (url === `https://api.github.com/repos/student_gh/${REPO_NAME}` && (!opts || !opts.method || opts.method === 'GET')) {
          return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
        }
        if (url === 'https://api.github.com/user/repos' && opts?.method === 'POST') {
          return new Response(JSON.stringify({ name: REPO_NAME, full_name: `student_gh/${REPO_NAME}` }), { status: 201 });
        }
        if (url.includes(`/contents/index.html`) && opts?.method === 'GET') {
          return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
        }
        if (url.includes(`/contents/index.html`) && opts?.method === 'PUT') {
          return new Response(
            JSON.stringify({
              commit: { html_url: `https://github.com/student_gh/${REPO_NAME}/commit/abc123` },
              content: { html_url: `https://github.com/student_gh/${REPO_NAME}/blob/main/index.html` },
            }),
            { status: 201 }
          );
        }
        return new Response(JSON.stringify({ error: 'Unhandled' }), { status: 500 });
      });

      globalThis.fetch = fetchMock;

      const res = await syncModuleCodeToGitHub({
        userId: 'u-123',
        moduleNum: 1,
        assignmentTitle: 'Sesiunea 1: HTML DOM',
        codePayload: '<h1>Hello World</h1>',
      });

      expect(res.success).toBe(true);
      expect(res.repoUrl).toBe(`https://github.com/student_gh/${REPO_NAME}`);
      expect(res.commitUrl).toBe(`https://github.com/student_gh/${REPO_NAME}/commit/abc123`);
      expect(res.filePath).toBe('index.html');
      expect(fetchMock).toHaveBeenCalled();
    });

    it('handles expired / unauthorized token (401/403) gracefully', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        access_token: 'gho_expired_token',
      } as any);

      globalThis.fetch = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ message: 'Bad credentials' }), { status: 401 }));

      const res = await syncModuleCodeToGitHub({
        userId: 'u-123',
        moduleNum: 1,
        codePayload: '<h1>Hello</h1>',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('TOKEN_UNAUTHORIZED');
    });
  });
});
