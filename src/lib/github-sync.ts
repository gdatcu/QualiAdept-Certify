import { prisma } from './prisma';

export const REPO_NAME = 'qualiadept-task-tracker';

export interface GitHubSyncResult {
  success: boolean;
  repoUrl?: string;
  commitUrl?: string;
  filePath?: string;
  error?: string;
  message?: string;
}

/**
 * Maps curriculum module numbers to standard project file paths in the GitHub repository.
 */
export function getModuleFilePath(moduleNum: number, validationType?: string): string {
  if (moduleNum === 0) return 'sandbox.html';
  if (moduleNum === 1) return 'index.html';
  if (moduleNum === 2) return 'style.css';
  if (validationType === 'DYNAMIC') {
    return `tests/e2e/module-${moduleNum}.spec.ts`;
  }
  return 'app.js';
}

/**
 * Synchronizes student's validated homework code directly to their public GitHub repository
 * using the GitHub REST API and their OAuth access token.
 */
export async function syncModuleCodeToGitHub({
  userId,
  moduleNum,
  assignmentTitle,
  codePayload,
  validationType,
  repoName = REPO_NAME,
}: {
  userId: string;
  moduleNum: number;
  assignmentTitle?: string;
  codePayload: string;
  validationType?: string;
  repoName?: string;
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

  try {
    // 2. Get authenticated GitHub user details
    const userRes = await fetch('https://api.github.com/user', { headers });
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

    // 3. Check if target repository exists; if not, create it
    const repoCheckRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, { headers });
    
    if (repoCheckRes.status === 404) {
      // Repository does not exist, create it
      const createRepoRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
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

        // GitHub returns 404 with {"message": "Not Found"} when the OAuth token lacks public_repo/repo scope
        const isScopeIssue =
          createRepoRes.status === 404 ||
          createRepoRes.status === 401 ||
          createRepoRes.status === 403 ||
          createError.message === 'Not Found';

        return {
          success: false,
          error: isScopeIssue ? 'SCOPE_INSUFFICIENT' : 'REPO_CREATION_FAILED',
          message: isScopeIssue
            ? 'Permisiuni GitHub insuficiente pentru crearea repository-ului. Te rugăm să te reconectezi cu GitHub.'
            : createError.message || 'Nu s-a putut crea repository-ul pe GitHub.',
        };
      }

      // Wait 1.5 seconds for GitHub to finalize Git ref initialization for the new repo
      await new Promise((resolve) => setTimeout(resolve, 1500));
    } else if (!repoCheckRes.ok) {
      if (repoCheckRes.status === 401 || repoCheckRes.status === 403) {
        return {
          success: false,
          error: 'TOKEN_UNAUTHORIZED',
          message: 'Permisiuni GitHub expirate sau insuficiente. Te rugăm să te reautentifici cu GitHub.',
        };
      }
      throw new Error(`GitHub repo check failed with HTTP ${repoCheckRes.status}`);
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

    let primaryCommitUrl: string | undefined;
    let primaryFilePath: string | undefined;

    for (const [filePath, content] of Object.entries(filesToCommit)) {
      if (!content || typeof content !== 'string') continue;

      // Check if file already exists in repository to get its SHA for update
      let existingSha: string | undefined;
      const fileCheckRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
        { headers }
      );

      if (fileCheckRes.ok) {
        const fileData = (await fileCheckRes.json()) as { sha?: string };
        existingSha = fileData.sha;
      }

      // 5. Commit file directly via GitHub Contents API
      const base64Content = Buffer.from(content, 'utf-8').toString('base64');
      const commitTitle = assignmentTitle || `Sesiunea ${moduleNum}`;
      const commitMessage = `feat(session-${moduleNum}): update ${filePath} for ${commitTitle} (Verified 100% by QualiAdept)`;

      const putBody: {
        message: string;
        content: string;
        sha?: string;
      } = {
        message: commitMessage,
        content: base64Content,
      };

      if (existingSha) {
        putBody.sha = existingSha;
      }

      const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(putBody),
        }
      );

      if (!commitRes.ok) {
        const commitErr = (await commitRes.json().catch(() => ({}))) as {
          message?: string;
        };

        const isScopeIssue =
          commitRes.status === 404 ||
          commitRes.status === 401 ||
          commitRes.status === 403 ||
          commitErr.message === 'Not Found';

        return {
          success: false,
          error: isScopeIssue ? 'SCOPE_INSUFFICIENT' : 'COMMIT_FAILED',
          message: isScopeIssue
            ? 'Permisiuni GitHub insuficiente pentru salvarea fișierului. Te rugăm să te reconectezi cu GitHub.'
            : commitErr.message || `Nu s-a putut salva fișierul ${filePath} pe GitHub.`,
        };
      }

      const commitData = (await commitRes.json()) as {
        commit?: { html_url?: string };
        content?: { html_url?: string };
      };

      if (!primaryCommitUrl) {
        primaryCommitUrl = commitData.commit?.html_url || commitData.content?.html_url;
        primaryFilePath = filePath;
      }
    }

    const repoUrl = `https://github.com/${owner}/${repoName}`;
    const commitUrl =
      primaryCommitUrl ||
      `${repoUrl}/blob/main/${primaryFilePath || getModuleFilePath(moduleNum, validationType)}`;

    return {
      success: true,
      repoUrl,
      commitUrl,
      filePath: primaryFilePath || getModuleFilePath(moduleNum, validationType),
    };
  } catch (error) {
    console.error('GitHub Sync Error:', error);
    return {
      success: false,
      error: 'UNEXPECTED_ERROR',
      message: error instanceof Error ? error.message : 'Eroare neașteptată la sincronizarea cu GitHub.',
    };
  }
}
