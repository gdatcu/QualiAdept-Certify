import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  signRunnerMessage,
  verifyRunnerSignature,
  checkUnsafeRunnerPatterns,
  sanitizeExecutionLogs,
  buildDynamicFeedbackItems,
  dispatchGitHubActionsEval,
  resolvePrimarySpecFileName,
  getDynamicRunnerConfig,
} from '@/lib/dynamic-runner';

describe('dynamic-runner unit tests', () => {
  const secret = 'super-secret-hmac-key-for-tests-32chars';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    delete process.env.EVAL_RUNNER_REPO;
    delete process.env.EVAL_RUNNER_TOKEN;
    delete process.env.EVAL_CALLBACK_SECRET;
    delete process.env.EVAL_RUNNER_WORKFLOW;
    delete process.env.EVAL_RUNNER_REF;
  });

  describe('HMAC-SHA256 signing & anti-replay verification', () => {
    it('accepts a valid freshly signed payload (seconds or ms timestamp)', () => {
      const now = 1_795_000_000_000;
      const tsSec = String(Math.floor(now / 1000));
      const body = JSON.stringify({ submissionId: 'sub-123', tests: [] });
      const sig = signRunnerMessage(body, tsSec, secret);

      const res = verifyRunnerSignature({
        message: body,
        timestamp: tsSec,
        signature: `sha256=${sig}`,
        secret,
        nowMs: now,
      });

      expect(res).toEqual({ valid: true });
    });

    it('rejects tampered payloads or wrong secrets', () => {
      const now = 1_795_000_000_000;
      const ts = String(now);
      const sig = signRunnerMessage('original-body', ts, secret);

      const tampered = verifyRunnerSignature({
        message: 'tampered-body',
        timestamp: ts,
        signature: sig,
        secret,
        nowMs: now,
      });
      expect(tampered.valid).toBe(false);

      const wrongSecret = verifyRunnerSignature({
        message: 'original-body',
        timestamp: ts,
        signature: sig,
        secret: 'wrong-secret',
        nowMs: now,
      });
      expect(wrongSecret.valid).toBe(false);
    });

    it('rejects expired timestamps outside the 5-minute anti-replay window', () => {
      const now = 1_795_000_000_000;
      const oldTs = String(now - 6 * 60 * 1000);
      const sig = signRunnerMessage('body', oldTs, secret);

      const res = verifyRunnerSignature({
        message: 'body',
        timestamp: oldTs,
        signature: sig,
        secret,
        nowMs: now,
      });

      expect(res.valid).toBe(false);
      expect(res.reason).toContain('Expired');
    });
  });

  describe('Zero-Trust unsafe pattern guard', () => {
    it('allows clean Playwright spec code', () => {
      const cleanSpec = `
        import { test, expect } from '@playwright/test';
        test('works', async ({ page }) => {
          await page.goto('/');
          await expect(page.getByTestId('task-list')).toBeVisible();
        });
      `;
      expect(checkUnsafeRunnerPatterns(cleanSpec)).toEqual([]);
    });

    it('blocks child_process, fs, process.env, and eval', () => {
      const malicious = `
        import fs from 'node:fs';
        import { execSync } from 'child_process';
        const secret = process.env.EVAL_CALLBACK_SECRET;
        eval('1+1');
      `;
      const detected = checkUnsafeRunnerPatterns(malicious);
      expect(detected).toContain('fs');
      expect(detected).toContain('child_process');
      expect(detected).toContain('process.env');
      expect(detected).toContain('eval / new Function');
    });
  });

  describe('Log sanitization & Playwright feedback normalization', () => {
    it('strips ANSI escape codes and truncates oversized logs safely', () => {
      const ansiLog = '\u001b[32m✓\u001b[39m passed\r\n' + 'x'.repeat(20000);
      const cleaned = sanitizeExecutionLogs(ansiLog, 500);
      expect(cleaned).not.toContain('\u001b[');
      expect(cleaned.length).toBeLessThanOrEqual(520);
      expect(cleaned).toContain('truncated');
    });

    it('maps Playwright test outcomes to localized FeedbackItems', () => {
      const items = buildDynamicFeedbackItems(
        [
          { title: 'creates task', passed: true, durationMs: 1450 },
          { title: 'deletes task', passed: false, durationMs: 5200, error: '\u001b[31mExpected 4, received 5\u001b[39m' },
        ],
        { fileName: 'task-tracker-e2e.spec.ts', locale: 'ro' }
      );

      expect(items).toHaveLength(2);
      expect(items[0].check).toBe('[Playwright E2E] 1. creates task');
      expect(items[0].passed).toBe(true);
      expect(items[0].message).toContain('1.45s');
      expect(items[1].passed).toBe(false);
      expect(items[1].message).toBe('Expected 4, received 5');
    });

    it('fails closed when zero tests were executed', () => {
      const items = buildDynamicFeedbackItems([], { locale: 'en' });
      expect(items).toHaveLength(1);
      expect(items[0].passed).toBe(false);
      expect(items[0].message).toContain('No Playwright tests');
    });
  });

  describe('Config & GitHub Actions workflow_dispatch', () => {
    it('returns null when runner env vars are incomplete', () => {
      expect(getDynamicRunnerConfig()).toBeNull();
      process.env.EVAL_RUNNER_REPO = 'gdatcu/qualiadept-eval-runner';
      expect(getDynamicRunnerConfig()).toBeNull();
    });

    it('dispatches workflow_dispatch with only non-sensitive metadata inputs', async () => {
      const fetchMock = vi.fn().mockResolvedValue({ status: 204, ok: true });
      vi.stubGlobal('fetch', fetchMock);

      const res = await dispatchGitHubActionsEval({
        config: {
          repo: 'gdatcu/qualiadept-eval-runner',
          workflow: 'playwright-eval.yml',
          ref: 'main',
          token: 'ghp_test_token',
          callbackSecret: secret,
          callbackBaseUrl: 'https://certify.qualiadept.eu',
        },
        submissionId: 'sub-999',
        moduleNum: 10,
        fileName: 'task-tracker-e2e.spec.ts',
      });

      expect(res).toEqual({ dispatched: true });
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe(
        'https://api.github.com/repos/gdatcu/qualiadept-eval-runner/actions/workflows/playwright-eval.yml/dispatches'
      );
      const parsedBody = JSON.parse(init.body as string);
      expect(parsedBody).toEqual({
        ref: 'main',
        inputs: {
          submission_id: 'sub-999',
          module: '10',
          file_name: 'task-tracker-e2e.spec.ts',
        },
      });
    });

    it('resolves primary spec file name for Module 10 and generic modules', () => {
      expect(resolvePrimarySpecFileName(10, {})).toBe('task-tracker-e2e.spec.ts');
      expect(resolvePrimarySpecFileName(12, { 'custom.spec.ts': '' })).toBe('custom.spec.ts');
      expect(resolvePrimarySpecFileName(14, {})).toBe('module-14.spec.ts');
    });
  });
});
