import { createHmac, timingSafeEqual } from 'crypto';
import type { FeedbackItem } from './static-evaluator';

export const DEFAULT_RUNNER_WORKFLOW = 'playwright-eval.yml';
export const DEFAULT_RUNNER_REF = 'main';
export const DEFAULT_DISPATCH_TIMEOUT_MS = 7500;
export const DEFAULT_MAX_SIGNATURE_AGE_MS = 5 * 60 * 1000; // 5 minutes anti-replay window
export const STALE_PENDING_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes stale-job guard
export const MAX_EXECUTION_LOG_CHARS = 16000;

export interface DynamicRunnerConfig {
  repo: string;
  workflow: string;
  ref: string;
  token: string;
  callbackSecret: string;
  callbackBaseUrl: string;
}

export function getDynamicRunnerConfig(): DynamicRunnerConfig | null {
  const repo = process.env.EVAL_RUNNER_REPO?.trim() || '';
  const token = process.env.EVAL_RUNNER_TOKEN?.trim() || '';
  const callbackSecret = process.env.EVAL_CALLBACK_SECRET?.trim() || '';

  if (!repo || !token || !callbackSecret) {
    return null;
  }

  return {
    repo,
    workflow: process.env.EVAL_RUNNER_WORKFLOW?.trim() || DEFAULT_RUNNER_WORKFLOW,
    ref: process.env.EVAL_RUNNER_REF?.trim() || DEFAULT_RUNNER_REF,
    token,
    callbackSecret,
    callbackBaseUrl: (
      process.env.EVAL_CALLBACK_BASE_URL ||
      process.env.NEXTAUTH_URL ||
      'https://certify.qualiadept.eu'
    )
      .trim()
      .replace(/\/+$/, ''),
  };
}

export function isDynamicRunnerConfigured(): boolean {
  return getDynamicRunnerConfig() !== null;
}

/**
 * Computes an HMAC-SHA256 hex digest over `${timestamp}.${message}` for
 * authenticating Vercel <-> GitHub Actions runner requests.
 */
export function signRunnerMessage(message: string, timestamp: string, secret: string): string {
  return createHmac('sha256', secret).update(`${timestamp}.${message}`).digest('hex');
}

/**
 * Verifies an HMAC-SHA256 signature with constant-time comparison and a
 * timestamp freshness window to prevent replay attacks.
 */
export function verifyRunnerSignature({
  message,
  timestamp,
  signature,
  secret,
  nowMs = Date.now(),
  maxAgeMs = DEFAULT_MAX_SIGNATURE_AGE_MS,
}: {
  message: string;
  timestamp: string | null | undefined;
  signature: string | null | undefined;
  secret: string;
  nowMs?: number;
  maxAgeMs?: number;
}): { valid: boolean; reason?: string } {
  if (!secret) {
    return { valid: false, reason: 'Runner secret not configured' };
  }
  if (!timestamp || !signature) {
    return { valid: false, reason: 'Missing authentication headers' };
  }

  const parsedTs = Number(timestamp);
  if (!Number.isFinite(parsedTs)) {
    return { valid: false, reason: 'Invalid timestamp header' };
  }

  // Accept either Unix seconds or milliseconds
  const tsMs = parsedTs < 1e12 ? parsedTs * 1000 : parsedTs;
  if (Math.abs(nowMs - tsMs) > maxAgeMs) {
    return { valid: false, reason: 'Expired or out-of-window timestamp' };
  }

  const expected = signRunnerMessage(message, timestamp, secret);
  const actualNormalized = signature.trim().toLowerCase().replace(/^sha256=/, '');

  const expectedBuf = Buffer.from(expected, 'utf8');
  const actualBuf = Buffer.from(actualNormalized, 'utf8');

  if (expectedBuf.length !== actualBuf.length) {
    return { valid: false, reason: 'Invalid signature' };
  }

  if (!timingSafeEqual(expectedBuf, actualBuf)) {
    return { valid: false, reason: 'Invalid signature' };
  }

  return { valid: true };
}

/**
 * Defense-in-depth static pre-flight check before executing student spec code
 * on the isolated GitHub Actions runner. Rejects Node OS/FS/process escape
 * patterns that have no legitimate place inside a student Playwright spec.
 */
const UNSAFE_RUNNER_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(?:require\s*\(\s*['"](?:node:)?child_process['"]\s*\)|from\s+['"](?:node:)?child_process['"])/i, label: 'child_process' },
  { pattern: /\b(?:require\s*\(\s*['"](?:node:)?fs(?:\/promises)?['"]\s*\)|from\s+['"](?:node:)?fs(?:\/promises)?['"])/i, label: 'fs' },
  { pattern: /\b(?:require\s*\(\s*['"](?:node:)?os['"]\s*\)|from\s+['"](?:node:)?os['"])/i, label: 'os' },
  { pattern: /\bprocess\.env\b/i, label: 'process.env' },
  { pattern: /\bprocess\.exit\s*\(/i, label: 'process.exit()' },
  { pattern: /\beval\s*\(|\bnew\s+Function\s*\(/i, label: 'eval / new Function' },
];

export function checkUnsafeRunnerPatterns(code: string): string[] {
  if (!code) return [];
  const detected: string[] = [];
  for (const { pattern, label } of UNSAFE_RUNNER_PATTERNS) {
    if (pattern.test(code)) {
      detected.push(label);
    }
  }
  return detected;
}

/**
 * Strips ANSI escape sequences and trims oversized execution logs before
 * storing them in PostgreSQL (`Submission.feedbackJSON`).
 */
export function sanitizeExecutionLogs(rawLogs: string | null | undefined, maxChars = MAX_EXECUTION_LOG_CHARS): string {
  if (!rawLogs || typeof rawLogs !== 'string') return '';
  // Remove ANSI color/cursor escape codes
  const cleaned = rawLogs
    .replace(/\u001b\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\r\n/g, '\n')
    .trim();

  if (cleaned.length <= maxChars) {
    return cleaned;
  }

  const tailNotice = '\n... [log truncated for storage safety] ...\n';
  const headSize = Math.floor((maxChars - tailNotice.length) * 0.35);
  const tailSize = maxChars - tailNotice.length - headSize;
  return `${cleaned.slice(0, headSize)}${tailNotice}${cleaned.slice(-tailSize)}`;
}

export interface RunnerTestOutcome {
  title: string;
  passed: boolean;
  durationMs?: number;
  error?: string;
}

/**
 * Normalizes Playwright test execution outcomes reported by the GitHub Actions
 * runner into standardized QualiAdept `FeedbackItem[]` entries.
 */
export function buildDynamicFeedbackItems(
  tests: RunnerTestOutcome[],
  {
    fileName = 'task-tracker-e2e.spec.ts',
    locale = 'ro',
    runnerError,
  }: {
    fileName?: string;
    locale?: string;
    runnerError?: string;
  } = {}
): FeedbackItem[] {
  const isEn = locale.toLowerCase() === 'en';

  if (!Array.isArray(tests) || tests.length === 0) {
    return [
      {
        check: isEn
          ? '[Playwright E2E] Browser test execution'
          : '[Playwright E2E] Execuție teste în browser',
        passed: false,
        message:
          runnerError ||
          (isEn
            ? 'No Playwright tests were executed (check syntax/imports in your spec file).'
            : 'Nu a putut fi executat niciun test Playwright (verifică sintaxa și importurile din fișier).'),
        file: fileName,
      },
    ];
  }

  return tests.map((t, index) => {
    const durationSuffix =
      typeof t.durationMs === 'number' && Number.isFinite(t.durationMs)
        ? ` (${(t.durationMs / 1000).toFixed(2)}s)`
        : '';

    const cleanError = t.error ? sanitizeExecutionLogs(t.error, 600) : '';

    return {
      check: `[Playwright E2E] ${index + 1}. ${t.title}`,
      passed: Boolean(t.passed),
      message: t.passed
        ? isEn
          ? `Passed in real Chromium browser${durationSuffix}.`
          : `Trecut în browser Chromium real${durationSuffix}.`
        : cleanError ||
          (isEn
            ? `Test failed during Chromium execution${durationSuffix}.`
            : `Testul a eșuat în timpul execuției în Chromium${durationSuffix}.`),
      file: fileName,
    };
  });
}

export interface DispatchResult {
  dispatched: boolean;
  error?: string;
}

/**
 * Triggers the isolated GitHub Actions Playwright evaluation workflow via
 * `workflow_dispatch`. Only non-sensitive metadata (`submission_id`, `module`,
 * `file_name`) is sent in dispatch inputs — the student's code is fetched
 * securely by the trusted setup step via HMAC-authenticated GET.
 */
export async function dispatchGitHubActionsEval({
  config,
  submissionId,
  moduleNum,
  fileName,
  timeoutMs = DEFAULT_DISPATCH_TIMEOUT_MS,
}: {
  config: DynamicRunnerConfig;
  submissionId: string;
  moduleNum: number;
  fileName: string;
  timeoutMs?: number;
}): Promise<DispatchResult> {
  const controller = new AbortController();
  const handle = setTimeout(() => controller.abort(), timeoutMs);

  const url = `https://api.github.com/repos/${config.repo}/actions/workflows/${config.workflow}/dispatches`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'QualiAdeptCertify/1.0 (https://certify.qualiadept.eu)',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        ref: config.ref,
        inputs: {
          submission_id: submissionId,
          module: String(moduleNum),
          file_name: fileName,
        },
      }),
      signal: controller.signal,
    });

    if (res.status === 204 || res.ok) {
      return { dispatched: true };
    }

    const detail = await res.text().catch(() => '');
    return {
      dispatched: false,
      error: `GitHub Actions dispatch failed with HTTP ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown dispatch error';
    return {
      dispatched: false,
      error: `GitHub Actions dispatch error: ${message}`,
    };
  } finally {
    clearTimeout(handle);
  }
}

/**
 * Resolves the primary `.spec.ts` file name for a dynamic assignment module.
 */
export function resolvePrimarySpecFileName(
  moduleNum: number,
  files: Record<string, string>
): string {
  if (moduleNum === 10 || 'task-tracker-e2e.spec.ts' in files) {
    return 'task-tracker-e2e.spec.ts';
  }
  const specKey = Object.keys(files).find((name) => name.endsWith('.spec.ts'));
  if (specKey) return specKey;
  return `module-${moduleNum}.spec.ts`;
}
