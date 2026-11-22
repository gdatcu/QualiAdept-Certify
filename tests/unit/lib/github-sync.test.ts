import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  syncModuleCodeToGitHub,
  getModuleFilePath,
  resolveGitHubFilePath,
  buildCommitMessage,
  REPO_NAME,
} from '@/lib/github-sync';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    account: {
      findFirst: vi.fn(),
    },
  },
}));

interface MockGitHubOptions {
  owner?: string;
  repoExists?: boolean;
  defaultBranch?: string;
  existingTreePaths?: string[];
  commitSha?: string;
  emptyRepo?: boolean;
}

function createAtomicGitHubFetchMock(options: MockGitHubOptions = {}) {
  const {
    owner = 'student_gh',
    repoExists = true,
    defaultBranch = 'main',
    existingTreePaths = [],
    commitSha = 'atomic_sha_999',
    emptyRepo = false,
  } = options;

  let repoCreated = repoExists;
  let treePayloads: Array<{ base_tree: string; tree: Array<{ path: string; content: string }> }> = [];
  let commitPayloads: Array<{ message: string; tree: string; parents: string[] }> = [];
  let refPatches: Array<{ sha: string; force: boolean }> = [];
  let contentsPuts: Array<{ path: string; message: string }> = [];

  const fetchMock = vi.fn().mockImplementation(async (url: string, opts?: RequestInit) => {
    const method = opts?.method || 'GET';

    if (url === 'https://api.github.com/user' && method === 'GET') {
      return new Response(JSON.stringify({ login: owner }), { status: 200 });
    }

    if (url === `https://api.github.com/repos/${owner}/${REPO_NAME}` && method === 'GET') {
      if (!repoCreated) {
        return new Response(JSON.stringify({ message: 'Not Found' }), { status: 404 });
      }
      return new Response(JSON.stringify({ name: REPO_NAME, default_branch: defaultBranch }), { status: 200 });
    }

    if (url === 'https://api.github.com/user/repos' && method === 'POST') {
      repoCreated = true;
      return new Response(
        JSON.stringify({ name: REPO_NAME, full_name: `${owner}/${REPO_NAME}`, default_branch: defaultBranch }),
        { status: 201 }
      );
    }

    if (url === `https://api.github.com/repos/${owner}/${REPO_NAME}/git/ref/heads/${defaultBranch}` && method === 'GET') {
      if (emptyRepo) {
        return new Response(JSON.stringify({ message: 'Git Repository is empty.' }), { status: 409 });
      }
      return new Response(JSON.stringify({ object: { sha: 'base_commit_sha_1' } }), { status: 200 });
    }

    if (url === `https://api.github.com/repos/${owner}/${REPO_NAME}/git/commits/base_commit_sha_1` && method === 'GET') {
      return new Response(JSON.stringify({ sha: 'base_commit_sha_1', tree: { sha: 'base_tree_sha_1' } }), { status: 200 });
    }

    if (url === `https://api.github.com/repos/${owner}/${REPO_NAME}/git/trees/base_tree_sha_1?recursive=1` && method === 'GET') {
      return new Response(
        JSON.stringify({
          tree: existingTreePaths.map((path) => ({ path, type: 'blob', sha: `blob_${path}` })),
        }),
        { status: 200 }
      );
    }

    if (url === `https://api.github.com/repos/${owner}/${REPO_NAME}/git/trees` && method === 'POST') {
      const body = JSON.parse(String(opts?.body || '{}'));
      treePayloads.push(body);
      return new Response(JSON.stringify({ sha: 'new_tree_sha_2' }), { status: 201 });
    }

    if (url === `https://api.github.com/repos/${owner}/${REPO_NAME}/git/commits` && method === 'POST') {
      const body = JSON.parse(String(opts?.body || '{}'));
      commitPayloads.push(body);
      return new Response(
        JSON.stringify({
          sha: commitSha,
          html_url: `https://github.com/${owner}/${REPO_NAME}/commit/${commitSha}`,
        }),
        { status: 201 }
      );
    }

    if (url === `https://api.github.com/repos/${owner}/${REPO_NAME}/git/refs/heads/${defaultBranch}` && method === 'PATCH') {
      const body = JSON.parse(String(opts?.body || '{}'));
      refPatches.push(body);
      return new Response(JSON.stringify({ object: { sha: body.sha } }), { status: 200 });
    }

    if (url.includes(`/contents/`) && method === 'PUT') {
      const matched = url.match(/\/contents\/(.*)$/);
      const body = JSON.parse(String(opts?.body || '{}'));
      if (matched) contentsPuts.push({ path: matched[1], message: body.message });
      return new Response(
        JSON.stringify({
          commit: {
            sha: 'bootstrap_sha_1',
            html_url: `https://github.com/${owner}/${REPO_NAME}/commit/bootstrap_sha_1`,
          },
        }),
        { status: 201 }
      );
    }

    return new Response(JSON.stringify({ error: `Unhandled ${method} ${url}` }), { status: 500 });
  });

  return {
    fetchMock,
    getTreePayloads: () => treePayloads,
    getCommitPayloads: () => commitPayloads,
    getRefPatches: () => refPatches,
    getContentsPuts: () => contentsPuts,
    reset: () => {
      treePayloads = [];
      commitPayloads = [];
      refPatches = [];
      contentsPuts = [];
    },
  };
}

describe('github-sync Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('getModuleFilePath & resolveGitHubFilePath', () => {
    it('maps module 0 to sandbox.html', () => {
      expect(getModuleFilePath(0)).toBe('sandbox.html');
    });

    it('maps module 1 to index.html', () => {
      expect(getModuleFilePath(1)).toBe('index.html');
    });

    it('maps module 2 to style.css', () => {
      expect(getModuleFilePath(2)).toBe('style.css');
    });

    it('maps module 7 to app.ts', () => {
      expect(getModuleFilePath(7)).toBe('app.ts');
    });

    it('maps module 8 to pom.ts', () => {
      expect(getModuleFilePath(8)).toBe('pom.ts');
    });

    it('maps module 9 to tests/task-tracker.spec.ts', () => {
      expect(getModuleFilePath(9)).toBe('tests/task-tracker.spec.ts');
    });

    it('maps dynamic module to Playwright spec path', () => {
      expect(getModuleFilePath(10, 'DYNAMIC')).toBe('tests/e2e/module-10.spec.ts');
    });

    it('maps general module to app.js', () => {
      expect(getModuleFilePath(3)).toBe('app.js');
    });

    it('resolves Module 9 task-tracker.spec.ts under tests/ while keeping playwright.config.ts at root', () => {
      expect(resolveGitHubFilePath('playwright.config.ts', 9)).toBe('playwright.config.ts');
      expect(resolveGitHubFilePath('task-tracker.spec.ts', 9)).toBe('tests/task-tracker.spec.ts');
    });
  });

  describe('buildCommitMessage (BUG-09)', () => {
    it('uses add verb when all synced files are new', () => {
      expect(
        buildCommitMessage({
          moduleNum: 8,
          assignmentTitle: 'Sesiunea 8: POM',
          addedFiles: ['pom.ts'],
          updatedFiles: [],
        })
      ).toBe('feat(session-8): add pom.ts for Sesiunea 8: POM (Verified 100% by QualiAdept)');
    });

    it('uses update verb when all synced files already exist', () => {
      expect(
        buildCommitMessage({
          moduleNum: 9,
          assignmentTitle: 'Sesiunea 9: Playwright',
          addedFiles: [],
          updatedFiles: ['playwright.config.ts', 'tests/task-tracker.spec.ts'],
        })
      ).toBe(
        'feat(session-9): update playwright.config.ts, tests/task-tracker.spec.ts for Sesiunea 9: Playwright (Verified 100% by QualiAdept)'
      );
    });

    it('combines add and update accurately when syncing mixed new and existing files', () => {
      expect(
        buildCommitMessage({
          moduleNum: 9,
          assignmentTitle: 'Sesiunea 9: Playwright',
          addedFiles: ['tests/task-tracker.spec.ts'],
          updatedFiles: ['playwright.config.ts'],
        })
      ).toBe(
        'feat(session-9): add tests/task-tracker.spec.ts and update playwright.config.ts for Sesiunea 9: Playwright (Verified 100% by QualiAdept)'
      );
    });
  });

  describe('syncModuleCodeToGitHub (Atomic Git Data API)', () => {
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

    it('creates repository if missing and commits new file with add verb in atomic commit', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        access_token: 'gho_dummy_token',
      } as never);

      const mock = createAtomicGitHubFetchMock({
        repoExists: false,
        existingTreePaths: ['README.md'],
        commitSha: 'abc123',
      });
      globalThis.fetch = mock.fetchMock;

      const res = await syncModuleCodeToGitHub({
        userId: 'u-123',
        moduleNum: 1,
        assignmentTitle: 'Sesiunea 1: HTML DOM',
        codePayload: '<h1>Hello World</h1>',
        repoInitRetryDelayMs: 5,
      });

      expect(res.success).toBe(true);
      expect(res.repoUrl).toBe(`https://github.com/student_gh/${REPO_NAME}`);
      expect(res.commitUrl).toBe(`https://github.com/student_gh/${REPO_NAME}/commit/abc123`);
      expect(res.filePath).toBe('index.html');
      expect(res.syncedFiles).toEqual(['index.html']);
      expect(mock.getCommitPayloads()).toHaveLength(1);
      expect(mock.getCommitPayloads()[0].message).toContain('add index.html');
      expect(mock.getRefPatches()).toEqual([{ sha: 'abc123', force: false }]);
    });

    it('handles expired / unauthorized token (401/403) gracefully', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        access_token: 'gho_expired_token',
      } as never);

      globalThis.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({ message: 'Bad credentials' }), { status: 401 })
      );

      const res = await syncModuleCodeToGitHub({
        userId: 'u-123',
        moduleNum: 1,
        codePayload: '<h1>Hello</h1>',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('TOKEN_UNAUTHORIZED');
    });

    it('syncs multiple files (index.html + style.css) in ONE single atomic commit (BUG-08)', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        access_token: 'gho_mf_token',
      } as never);

      const mock = createAtomicGitHubFetchMock({
        repoExists: true,
        existingTreePaths: ['index.html', 'style.css'],
        commitSha: 'mf123',
      });
      globalThis.fetch = mock.fetchMock;

      const multiFilePayload = JSON.stringify({
        files: {
          'index.html': '<h1>Title</h1>',
          'style.css': 'body { margin: 0; }',
        },
      });

      const res = await syncModuleCodeToGitHub({
        userId: 'u-123',
        moduleNum: 2,
        assignmentTitle: 'Sesiunea 2: CSS',
        codePayload: multiFilePayload,
      });

      expect(res.success).toBe(true);
      expect(res.syncedFiles).toEqual(['index.html', 'style.css']);
      expect(res.commitUrl).toBe(`https://github.com/student_gh/${REPO_NAME}/commit/mf123`);
      // Exactly 1 tree, 1 commit, 1 ref update for both files
      expect(mock.getTreePayloads()).toHaveLength(1);
      expect(mock.getTreePayloads()[0].tree.map((t) => t.path)).toEqual(['index.html', 'style.css']);
      expect(mock.getCommitPayloads()).toHaveLength(1);
      expect(mock.getCommitPayloads()[0].message).toContain('update index.html, style.css');
      expect(mock.getRefPatches()).toHaveLength(1);
    });

    it('syncs ONLY the specified targetFile when targetFile is provided', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        access_token: 'gho_target_token',
      } as never);

      const mock = createAtomicGitHubFetchMock({
        repoExists: true,
        existingTreePaths: ['index.html', 'style.css'],
        commitSha: 'target123',
      });
      globalThis.fetch = mock.fetchMock;

      const multiFilePayload = JSON.stringify({
        files: {
          'index.html': '<h1>Title</h1>',
          'style.css': 'body { margin: 0; }',
        },
      });

      const res = await syncModuleCodeToGitHub({
        userId: 'u-123',
        moduleNum: 2,
        assignmentTitle: 'Sesiunea 2: CSS',
        codePayload: multiFilePayload,
        targetFile: 'style.css',
      });

      expect(res.success).toBe(true);
      expect(res.syncedFiles).toEqual(['style.css']);
      expect(res.filePath).toBe('style.css');
      expect(mock.getTreePayloads()[0].tree.map((t) => t.path)).toEqual(['style.css']);
    });

    it('syncs Module 9 files atomically to playwright.config.ts and tests/task-tracker.spec.ts with mixed add/update message (BUG-08 & BUG-09)', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        access_token: 'gho_m9_token',
      } as never);

      // playwright.config.ts already exists, tests/task-tracker.spec.ts is brand new
      const mock = createAtomicGitHubFetchMock({
        repoExists: true,
        existingTreePaths: ['README.md', 'playwright.config.ts'],
        commitSha: 'm9atomic',
      });
      globalThis.fetch = mock.fetchMock;

      const res = await syncModuleCodeToGitHub({
        userId: 'u-123',
        moduleNum: 9,
        assignmentTitle: 'Sesiunea 9: Setup și Arhitectură Playwright (Codegen)',
        codePayload: JSON.stringify({
          files: {
            'playwright.config.ts': 'export default {};',
            'task-tracker.spec.ts': 'test("smoke", async () => {});',
          },
        }),
      });

      expect(res.success).toBe(true);
      expect(res.syncedFiles).toEqual(['playwright.config.ts', 'tests/task-tracker.spec.ts']);
      expect(res.commitUrl).toBe(`https://github.com/student_gh/${REPO_NAME}/commit/m9atomic`);
      expect(mock.getTreePayloads()).toHaveLength(1);
      expect(mock.getTreePayloads()[0].tree.map((t) => t.path)).toEqual([
        'playwright.config.ts',
        'tests/task-tracker.spec.ts',
      ]);
      expect(mock.getCommitPayloads()).toHaveLength(1);
      expect(mock.getCommitPayloads()[0].message).toContain(
        'add tests/task-tracker.spec.ts and update playwright.config.ts'
      );
    });

    it('returns SYNC_TIMEOUT gracefully when GitHub API exceeds deadline (BUG-10)', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        access_token: 'gho_slow_token',
      } as never);

      globalThis.fetch = vi.fn().mockImplementation(
        (_url: string, opts?: RequestInit) =>
          new Promise((_resolve, reject) => {
            opts?.signal?.addEventListener('abort', () => {
              const abortErr = new Error('The operation was aborted.');
              abortErr.name = 'AbortError';
              reject(abortErr);
            });
          })
      );

      const res = await syncModuleCodeToGitHub({
        userId: 'u-123',
        moduleNum: 9,
        codePayload: 'export default {};',
        timeoutMs: 30,
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('SYNC_TIMEOUT');
      expect(res.message).toContain('timeout');
    });

    it('bootstraps empty repository with Contents API when HEAD ref returns 409', async () => {
      vi.mocked(prisma.account.findFirst).mockResolvedValueOnce({
        access_token: 'gho_empty_repo',
      } as never);

      const mock = createAtomicGitHubFetchMock({
        repoExists: true,
        emptyRepo: true,
      });
      globalThis.fetch = mock.fetchMock;

      const res = await syncModuleCodeToGitHub({
        userId: 'u-123',
        moduleNum: 8,
        assignmentTitle: 'Sesiunea 8: POM',
        codePayload: JSON.stringify({ files: { 'pom.ts': 'interface Produs {}' } }),
      });

      expect(res.success).toBe(true);
      expect(res.syncedFiles).toEqual(['pom.ts']);
      expect(mock.getContentsPuts()).toHaveLength(1);
      expect(mock.getContentsPuts()[0].message).toContain('add pom.ts');
    });
  });
});
