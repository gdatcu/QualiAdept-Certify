import { createHash } from 'crypto';
import { prisma } from './prisma';

export const REPO_NAME = 'qualiadept-task-tracker';
export const DEFAULT_SYNC_TIMEOUT_MS = 8500;

export interface GitHubSyncResult {
  success: boolean;
  upToDate?: boolean;
  repoUrl?: string;
  commitUrl?: string;
  filePath?: string;
  syncedFiles?: string[];
  commitMessage?: string;
  error?: string;
  message?: string;
}

/**
 * Computes the exact Git blob SHA-1 hash (`sha1("blob <byteLength>\0<content>")`)
 * used by GitHub's Git Data API so we can detect unchanged files before creating
 * trees or commits (BUG-15).
 */
export function computeGitBlobSha(content: string): string {
  const buf = Buffer.from(content, 'utf-8');
  return createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
}

/**
 * Maps curriculum module numbers to standard project file paths in the GitHub repository.
 */
export function getModuleFilePath(moduleNum: number, validationType?: string): string {
  if (moduleNum === 0) return 'sandbox.html';
  if (moduleNum === 1) return 'index.html';
  if (moduleNum === 2) return 'style.css';
  if (moduleNum === 7) return 'app.ts';
  if (moduleNum === 8) return 'pom.ts';
  if (moduleNum === 9) return 'tests/task-tracker.spec.ts';
  if (moduleNum === 10) return 'tests/task-tracker-e2e.spec.ts';
  if (validationType === 'DYNAMIC') {
    return `tests/e2e/module-${moduleNum}.spec.ts`;
  }
  return 'app.js';
}

/**
 * Resolves a workspace file tab name into its target repository path in GitHub.
 * E.g., for Module 9, `task-tracker.spec.ts` maps to `tests/task-tracker.spec.ts`,
 * and for Module 10, `task-tracker-e2e.spec.ts` maps to `tests/task-tracker-e2e.spec.ts`
 * to match `testDir: './tests'` in `playwright.config.ts`.
 */
export function resolveGitHubFilePath(fileName: string, moduleNum: number): string {
  if (moduleNum === 9 && fileName === 'task-tracker.spec.ts') {
    return 'tests/task-tracker.spec.ts';
  }
  if (moduleNum === 10 && fileName === 'task-tracker-e2e.spec.ts') {
    return 'tests/task-tracker-e2e.spec.ts';
  }
  return fileName;
}

/**
 * Builds a semantically accurate Conventional Commit message distinguishing
 * newly added files (`add`) from modified existing files (`update`) (BUG-09).
 */
export function buildCommitMessage({
  moduleNum,
  assignmentTitle,
  addedFiles,
  updatedFiles,
}: {
  moduleNum: number;
  assignmentTitle?: string;
  addedFiles: string[];
  updatedFiles: string[];
}): string {
  const commitTitle = assignmentTitle || `Sesiunea ${moduleNum}`;
  const clauses: string[] = [];

  if (addedFiles.length > 0) {
    clauses.push(`add ${addedFiles.join(', ')}`);
  }
  if (updatedFiles.length > 0) {
    clauses.push(`update ${updatedFiles.join(', ')}`);
  }

  const actionSummary = clauses.length > 0 ? clauses.join(' and ') : 'sync files';
  return `feat(session-${moduleNum}): ${actionSummary} for ${commitTitle} (Verified 100% by QualiAdept)`;
}

function isAbortError(error: unknown): boolean {
  return (
    (error instanceof Error && error.name === 'AbortError') ||
    (typeof error === 'object' && error !== null && 'name' in error && (error as { name?: string }).name === 'AbortError')
  );
}

function isScopeStatus(status: number, message?: string): boolean {
  return status === 404 || status === 401 || status === 403 || message === 'Not Found';
}

/**
 * Synchronizes student's validated homework code directly to their public GitHub repository
 * as a SINGLE ATOMIC COMMIT using the GitHub Git Data API (Trees + Commits + Refs).
 *
 * Benefits over per-file Contents API loops:
 * - BUG-08: Multi-file submissions (e.g., M09 playwright.config.ts + tests/task-tracker.spec.ts)
 *   are committed together in one atomic commit so the commit URL shows the complete diff.
 * - BUG-09: Reads the base tree once to determine accurately which files are new (`add`) vs
 *   already present (`update`).
 * - BUG-10: Constant O(1) API roundtrips regardless of file count + strict AbortController
 *   timeout guard compatible with Vercel Hobby's 10s serverless execution limit.
 */
export async function syncModuleCodeToGitHub({
  userId,
  moduleNum,
  assignmentTitle,
  codePayload,
  validationType,
  repoName = REPO_NAME,
  targetFile,
  timeoutMs = DEFAULT_SYNC_TIMEOUT_MS,
  repoInitRetryDelayMs = 350,
}: {
  userId: string;
  moduleNum: number;
  assignmentTitle?: string;
  codePayload: string;
  validationType?: string;
  repoName?: string;
  targetFile?: string;
  timeoutMs?: number;
  repoInitRetryDelayMs?: number;
}): Promise<GitHubSyncResult> {
  if (!userId || !codePayload) {
    return {
      success: false,
      error: 'INVALID_ARGUMENTS',
      message: 'User ID and code payload are required for GitHub sync.',
    };
  }

  // 1. Retrieve student's GitHub OAuth access token from database
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'github' },
    select: { access_token: true },
  });

  if (!account || !account.access_token) {
    return {
      success: false,
      error: 'NO_TOKEN',
      message: 'Autentificare GitHub necesară: Te rugăm să te reconectezi cu GitHub pentru a permite sincronizarea pe profil.',
    };
  }

  const token = account.access_token;
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'QualiAdeptCertify/1.0 (https://certify.qualiadept.eu)',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Enforce overall deadline below Vercel's 10s serverless function timeout
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

  const ghFetch = (url: string, init: RequestInit = {}) =>
    fetch(url, {
      ...init,
      headers: {
        ...headers,
        ...(init.headers || {}),
      },
      signal: controller.signal,
    });

  try {
    // 2. Get authenticated GitHub user details
    const userRes = await ghFetch('https://api.github.com/user');
    if (!userRes.ok) {
      if (userRes.status === 401 || userRes.status === 403) {
        return {
          success: false,
          error: 'TOKEN_UNAUTHORIZED',
          message: 'Permisiuni GitHub expirate sau insuficiente. Te rugăm să te reautentifici cu GitHub.',
        };
      }
      throw new Error(`GitHub user fetch failed with HTTP ${userRes.status}`);
    }

    const userData = (await userRes.json()) as { login: string };
    const owner = userData.login;
    let defaultBranch = 'main';
    let wasJustCreated = false;

    // 3. Check if target repository exists; if not, create it
    const repoCheckRes = await ghFetch(`https://api.github.com/repos/${owner}/${repoName}`);

    if (repoCheckRes.status === 404) {
      const createRepoRes = await ghFetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: repoName,
          description: 'Task Tracker web application & QA Automation test suite built during QualiAdept QA Academy.',
          homepage: 'https://certify.qualiadept.eu',
          private: false,
          auto_init: true,
        }),
      });

      if (!createRepoRes.ok) {
        const createError = (await createRepoRes.json().catch(() => ({}))) as {
          message?: string;
        };

        const isScopeIssue = isScopeStatus(createRepoRes.status, createError.message);
        return {
          success: false,
          error: isScopeIssue ? 'SCOPE_INSUFFICIENT' : 'REPO_CREATION_FAILED',
          message: isScopeIssue
            ? 'Permisiuni GitHub insuficiente pentru crearea repository-ului. Te rugăm să te reconectezi cu GitHub.'
            : createError.message || 'Nu s-a putut crea repository-ul pe GitHub.',
        };
      }

      const createdRepo = (await createRepoRes.json().catch(() => ({}))) as { default_branch?: string };
      if (createdRepo.default_branch) {
        defaultBranch = createdRepo.default_branch;
      }
      wasJustCreated = true;
    } else if (!repoCheckRes.ok) {
      if (repoCheckRes.status === 401 || repoCheckRes.status === 403) {
        return {
          success: false,
          error: 'TOKEN_UNAUTHORIZED',
          message: 'Permisiuni GitHub expirate sau insuficiente. Te rugăm să te reautentifici cu GitHub.',
        };
      }
      throw new Error(`GitHub repo check failed with HTTP ${repoCheckRes.status}`);
    } else {
      const existingRepo = (await repoCheckRes.json().catch(() => ({}))) as { default_branch?: string };
      if (existingRepo.default_branch) {
        defaultBranch = existingRepo.default_branch;
      }
    }

    // 4. Resolve files to commit (multi-file JSON or single file fallback)
    let filesToCommit: Record<string, string> = {};
    try {
      const parsed = JSON.parse(codePayload);
      if (parsed && typeof parsed.files === 'object' && !Array.isArray(parsed.files)) {
        filesToCommit = { ...parsed.files };
      }
    } catch {
      // Plain text payload
    }

    if (Object.keys(filesToCommit).length === 0) {
      const defaultPath = getModuleFilePath(moduleNum, validationType);
      filesToCommit[defaultPath] = codePayload;
    }

    if (targetFile && targetFile.trim().length > 0) {
      const trimmedTarget = targetFile.trim();
      if (filesToCommit[trimmedTarget]) {
        filesToCommit = { [trimmedTarget]: filesToCommit[trimmedTarget] };
      } else {
        filesToCommit = { [trimmedTarget]: codePayload };
      }
    }

    const entriesToCommit: Array<{ path: string; content: string }> = [];
    const seenPaths = new Set<string>();
    for (const [rawFilePath, content] of Object.entries(filesToCommit)) {
      if (!content || typeof content !== 'string') continue;
      const resolvedPath = resolveGitHubFilePath(rawFilePath, moduleNum);
      if (seenPaths.has(resolvedPath)) continue;
      seenPaths.add(resolvedPath);
      entriesToCommit.push({ path: resolvedPath, content });
    }

    if (entriesToCommit.length === 0) {
      return {
        success: false,
        error: 'INVALID_ARGUMENTS',
        message: 'Nu există fișiere valide de sincronizat pe GitHub.',
      };
    }

    const repoApiBase = `https://api.github.com/repos/${owner}/${repoName}`;
    const repoUrl = `https://github.com/${owner}/${repoName}`;

    // 5. Fetch HEAD ref on defaultBranch (with brief polling if repo was just initialized)
    let refRes = await ghFetch(`${repoApiBase}/git/ref/heads/${defaultBranch}`);
    if (wasJustCreated && !refRes.ok) {
      for (let attempt = 0; attempt < 4 && !refRes.ok; attempt++) {
        await new Promise((resolve) => setTimeout(resolve, repoInitRetryDelayMs));
        refRes = await ghFetch(`${repoApiBase}/git/ref/heads/${defaultBranch}`);
      }
    }

    let baseCommitSha: string | undefined;

    if (refRes.ok) {
      const refData = (await refRes.json()) as { object?: { sha?: string } };
      baseCommitSha = refData.object?.sha;
    } else if (refRes.status === 404 || refRes.status === 409) {
      // Edge case: manually created empty repository with zero commits.
      // Bootstrap initial commit on defaultBranch with Contents API, then commit any remaining files atomically.
      const firstEntry = entriesToCommit[0];
      const bootstrapMessage = buildCommitMessage({
        moduleNum,
        assignmentTitle,
        addedFiles: [firstEntry.path],
        updatedFiles: [],
      });
      const putRes = await ghFetch(`${repoApiBase}/contents/${firstEntry.path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: bootstrapMessage,
          content: Buffer.from(firstEntry.content, 'utf-8').toString('base64'),
          branch: defaultBranch,
        }),
      });

      if (!putRes.ok) {
        const putErr = (await putRes.json().catch(() => ({}))) as { message?: string };
        const isScopeIssue = isScopeStatus(putRes.status, putErr.message);
        return {
          success: false,
          error: isScopeIssue ? 'SCOPE_INSUFFICIENT' : 'COMMIT_FAILED',
          message: isScopeIssue
            ? 'Permisiuni GitHub insuficiente pentru salvarea fișierului. Te rugăm să te reconectezi cu GitHub.'
            : putErr.message || `Nu s-a putut inițializa fișierul ${firstEntry.path} pe GitHub.`,
        };
      }

      const putData = (await putRes.json()) as { commit?: { sha?: string; html_url?: string } };
      if (entriesToCommit.length === 1) {
        return {
          success: true,
          repoUrl,
          commitUrl:
            putData.commit?.html_url || `${repoUrl}/blob/${defaultBranch}/${firstEntry.path}`,
          filePath: firstEntry.path,
          syncedFiles: [firstEntry.path],
          commitMessage: bootstrapMessage,
        };
      }

      baseCommitSha = putData.commit?.sha;
      entriesToCommit.shift();
    } else {
      const refErr = (await refRes.json().catch(() => ({}))) as { message?: string };
      const isScopeIssue = isScopeStatus(refRes.status, refErr.message);
      return {
        success: false,
        error: isScopeIssue ? 'SCOPE_INSUFFICIENT' : 'COMMIT_FAILED',
        message: isScopeIssue
          ? 'Permisiuni GitHub insuficiente pentru accesarea branch-ului. Te rugăm să te reconectezi cu GitHub.'
          : refErr.message || `Nu s-a putut citi branch-ul ${defaultBranch} pe GitHub.`,
      };
    }

    if (!baseCommitSha) {
      return {
        success: false,
        error: 'COMMIT_FAILED',
        message: 'Nu s-a putut determina commit-ul curent (HEAD) din repository.',
      };
    }

    // 6. Retrieve base commit -> base tree SHA
    const baseCommitRes = await ghFetch(`${repoApiBase}/git/commits/${baseCommitSha}`);
    if (!baseCommitRes.ok) {
      throw new Error(`GitHub base commit fetch failed with HTTP ${baseCommitRes.status}`);
    }
    const baseCommitData = (await baseCommitRes.json()) as { tree?: { sha?: string } };
    const baseTreeSha = baseCommitData.tree?.sha;
    if (!baseTreeSha) {
      throw new Error('Base tree SHA missing from GitHub commit response.');
    }

    // 7. Read existing tree paths + blob SHAs in a single call (BUG-09 & BUG-15)
    const existingBlobs = new Map<string, string>();
    let treeInspectComplete = false;
    const treeInspectRes = await ghFetch(`${repoApiBase}/git/trees/${baseTreeSha}?recursive=1`);
    if (treeInspectRes.ok) {
      const treeInspectData = (await treeInspectRes.json()) as {
        tree?: Array<{ path?: string; type?: string; sha?: string }>;
        truncated?: boolean;
      };
      treeInspectComplete = !treeInspectData.truncated;
      for (const node of treeInspectData.tree || []) {
        if (node.path && node.type === 'blob') {
          existingBlobs.set(node.path, node.sha || '');
        }
      }
    }

    const addedFiles: string[] = [];
    const updatedFiles: string[] = [];
    const changedEntries: Array<{ path: string; content: string }> = [];

    for (const entry of entriesToCommit) {
      const existingSha = existingBlobs.get(entry.path);
      if (existingSha === undefined) {
        addedFiles.push(entry.path);
        changedEntries.push(entry);
      } else {
        const localBlobSha = computeGitBlobSha(entry.content);
        if (existingSha && existingSha === localBlobSha) {
          // Exact byte-for-byte match with HEAD -> unchanged
          continue;
        }
        updatedFiles.push(entry.path);
        changedEntries.push(entry);
      }
    }

    // Layer 1 idempotency check (BUG-15): skip write calls completely when all files match HEAD
    if (treeInspectComplete && changedEntries.length === 0) {
      const allPaths = entriesToCommit.map((e) => e.path);
      return {
        success: true,
        upToDate: true,
        repoUrl,
        commitUrl: `${repoUrl}/commit/${baseCommitSha}`,
        filePath: allPaths[0],
        syncedFiles: allPaths,
        message: 'Codul este deja sincronizat pe GitHub — nicio modificare nouă.',
      };
    }

    const entriesForTree = changedEntries.length > 0 ? changedEntries : entriesToCommit;
    const commitMessage = buildCommitMessage({
      moduleNum,
      assignmentTitle,
      addedFiles,
      updatedFiles,
    });

    // 8. Create a single new Git Tree containing ALL changed files atomically (BUG-08 & BUG-10)
    const createTreeRes = await ghFetch(`${repoApiBase}/git/trees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: entriesForTree.map((entry) => ({
          path: entry.path,
          mode: '100644',
          type: 'blob',
          content: entry.content,
        })),
      }),
    });

    if (!createTreeRes.ok) {
      const treeErr = (await createTreeRes.json().catch(() => ({}))) as { message?: string };
      const isScopeIssue = isScopeStatus(createTreeRes.status, treeErr.message);
      return {
        success: false,
        error: isScopeIssue ? 'SCOPE_INSUFFICIENT' : 'COMMIT_FAILED',
        message: isScopeIssue
          ? 'Permisiuni GitHub insuficiente pentru salvarea fișierelor. Te rugăm să te reconectezi cu GitHub.'
          : treeErr.message || 'Nu s-a putut crea arborele Git pe GitHub.',
      };
    }

    const newTreeData = (await createTreeRes.json()) as { sha?: string };
    if (!newTreeData.sha) {
      throw new Error('New tree SHA missing from GitHub response.');
    }

    // Layer 2 idempotency guard (BUG-15): never create an empty commit if GitHub returns the exact same tree SHA
    if (newTreeData.sha === baseTreeSha) {
      const allPaths = entriesToCommit.map((e) => e.path);
      return {
        success: true,
        upToDate: true,
        repoUrl,
        commitUrl: `${repoUrl}/commit/${baseCommitSha}`,
        filePath: allPaths[0],
        syncedFiles: allPaths,
        message: 'Codul este deja sincronizat pe GitHub — nicio modificare nouă.',
      };
    }

    // 9. Create the single atomic commit pointing to the new tree
    const createCommitRes = await ghFetch(`${repoApiBase}/git/commits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeData.sha,
        parents: [baseCommitSha],
      }),
    });

    if (!createCommitRes.ok) {
      const commitErr = (await createCommitRes.json().catch(() => ({}))) as { message?: string };
      const isScopeIssue = isScopeStatus(createCommitRes.status, commitErr.message);
      return {
        success: false,
        error: isScopeIssue ? 'SCOPE_INSUFFICIENT' : 'COMMIT_FAILED',
        message: isScopeIssue
          ? 'Permisiuni GitHub insuficiente pentru crearea commit-ului. Te rugăm să te reconectezi cu GitHub.'
          : commitErr.message || 'Nu s-a putut crea commit-ul pe GitHub.',
      };
    }

    const newCommitData = (await createCommitRes.json()) as { sha?: string; html_url?: string };
    const newCommitSha = newCommitData.sha;
    if (!newCommitSha) {
      throw new Error('New commit SHA missing from GitHub response.');
    }

    // 10. Fast-forward the default branch ref to the new atomic commit
    const updateRefRes = await ghFetch(`${repoApiBase}/git/refs/heads/${defaultBranch}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    });

    if (!updateRefRes.ok) {
      const refUpdateErr = (await updateRefRes.json().catch(() => ({}))) as { message?: string };
      const isScopeIssue = isScopeStatus(updateRefRes.status, refUpdateErr.message);
      return {
        success: false,
        error: isScopeIssue ? 'SCOPE_INSUFFICIENT' : 'COMMIT_FAILED',
        message: isScopeIssue
          ? 'Permisiuni GitHub insuficiente pentru actualizarea branch-ului. Te rugăm să te reconectezi cu GitHub.'
          : refUpdateErr.message || `Nu s-a putut actualiza branch-ul ${defaultBranch} pe GitHub.`,
      };
    }

    const syncedFiles = entriesForTree.map((e) => e.path);
    const commitUrl = newCommitData.html_url || `${repoUrl}/commit/${newCommitSha}`;

    return {
      success: true,
      upToDate: false,
      repoUrl,
      commitUrl,
      filePath: syncedFiles[0],
      syncedFiles,
      commitMessage,
    };
  } catch (error) {
    if (isAbortError(error)) {
      return {
        success: false,
        error: 'SYNC_TIMEOUT',
        message: 'Sincronizarea cu GitHub a depășit limita de timp (timeout). Te rugăm să reîncerci.',
      };
    }
    console.error('GitHub Sync Error:', error);
    return {
      success: false,
      error: 'UNEXPECTED_ERROR',
      message: error instanceof Error ? error.message : 'Eroare neașteptată la sincronizarea cu GitHub.',
    };
  } finally {
    clearTimeout(timeoutHandle);
  }
}
