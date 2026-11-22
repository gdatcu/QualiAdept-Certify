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

const module9Rules = JSON.stringify([
  {
    file: 'playwright.config.ts',
    name: '[playwright.config.ts] 1. Importă defineConfig și devices din @playwright/test',
    name_en: '[playwright.config.ts] 1. Import defineConfig and devices from @playwright/test',
    check: 'regex',
    pattern: String.raw`import\s*(type\s+)?\{(?=[^}]*\bdefineConfig\b)(?=[^}]*\bdevices\b)[^}]*\}\s*from\s*['"]@playwright\/test['"]`,
    message: 'Cerința 1 eșuată: Importă defineConfig și devices din @playwright/test.',
    message_en: 'Requirement 1 failed: Import both defineConfig and devices from @playwright/test.',
    successMessage: 'defineConfig și devices sunt importate corect din @playwright/test.',
    successMessage_en: 'defineConfig and devices are correctly imported from @playwright/test.',
  },
  {
    file: 'playwright.config.ts',
    name: "[playwright.config.ts] 2. Exportă defineConfig și setează testDir: './tests'",
    name_en: "[playwright.config.ts] 2. Default export defineConfig with testDir: './tests'",
    check: 'regex',
    pattern: String.raw`export\s+default\s+defineConfig\(\s*\{[\s\S]*\btestDir\s*:\s*['"]\.\/tests\/?['"]`,
    message: "Cerința 2 eșuată: Exportă implicit defineConfig({...}) și setează testDir: './tests'.",
    message_en: "Requirement 2 failed: Default export defineConfig({...}) and set testDir: './tests'.",
    successMessage: "Exportul implicit defineConfig({...}) și testDir: './tests' sunt configurate corect.",
    successMessage_en: "Default export defineConfig({...}) and testDir: './tests' are properly configured.",
  },
  {
    file: 'playwright.config.ts',
    name: '[playwright.config.ts] 3. Timeout 30s și execuție paralelă (fullyParallel: true)',
    name_en: '[playwright.config.ts] 3. 30s test timeout and fullyParallel: true',
    check: 'regex',
    pattern: String.raw`^(?=[\s\S]*(?:^|[\s,{])timeout\s*:\s*(?:30_?000|30\s*\*\s*1_?000)\b)(?=[\s\S]*\bfullyParallel\s*:\s*true\b)`,
    message: 'Cerința 3 eșuată: Setează timeout-ul testului la 30 de secunde (30_000, 30000 sau 30 * 1000) și fullyParallel: true.',
    message_en: 'Requirement 3 failed: Set test timeout to 30 seconds (30_000, 30000, or 30 * 1000) and fullyParallel: true.',
    successMessage: 'Timeout-ul de 30s și execuția paralelă (fullyParallel: true) sunt configurate corect.',
    successMessage_en: '30s test timeout and fullyParallel: true are properly configured.',
  },
  {
    file: 'playwright.config.ts',
    name: '[playwright.config.ts] 4. Blocul use (baseURL, testIdAttribute, trace)',
    name_en: '[playwright.config.ts] 4. use block (baseURL, testIdAttribute, trace)',
    check: 'regex',
    pattern: String.raw`\buse\s*:\s*\{(?=[\s\S]*\bbaseURL\s*:\s*(?:process\.env\.\w+\s*(?:\?\?|\|\|)\s*)?['"](?:https:\/\/tasktracker\.qualiadept\.eu|http:\/\/localhost:3000)\/?['"])(?=[\s\S]*\btestIdAttribute\s*:\s*['"]data-testid['"])(?=[\s\S]*\btrace\s*:\s*['"]on-first-retry['"])`,
    message:
      "Cerința 4 eșuată: În blocul use, setează baseURL: 'https://tasktracker.qualiadept.eu' (sau 'http://localhost:3000'), testIdAttribute: 'data-testid' și trace: 'on-first-retry'.",
    message_en:
      "Requirement 4 failed: Inside the use block, set baseURL: 'https://tasktracker.qualiadept.eu' (or 'http://localhost:3000'), testIdAttribute: 'data-testid', and trace: 'on-first-retry'.",
    successMessage: "Blocul use conține baseURL, testIdAttribute: 'data-testid' și trace: 'on-first-retry'.",
    successMessage_en: "use block properly configures baseURL, testIdAttribute: 'data-testid', and trace: 'on-first-retry'.",
  },
  {
    file: 'playwright.config.ts',
    name: "[playwright.config.ts] 5. Proiectul chromium cu devices['Desktop Chrome']",
    name_en: "[playwright.config.ts] 5. chromium project using devices['Desktop Chrome']",
    check: 'regex',
    pattern: String.raw`\bprojects\s*:\s*\[[\s\S]*name\s*:\s*['"]chromium['"][\s\S]*?devices\[\s*['"]Desktop Chrome['"]\s*\]`,
    message: "Cerința 5 eșuată: Configurează în projects cel puțin proiectul chromium folosind devices['Desktop Chrome'].",
    message_en: "Requirement 5 failed: Configure at least the chromium project inside projects using devices['Desktop Chrome'].",
    successMessage: "Proiectul chromium cu devices['Desktop Chrome'] este configurat corect.",
    successMessage_en: "chromium project with devices['Desktop Chrome'] is properly configured.",
  },
  {
    file: 'task-tracker.spec.ts',
    name: '[task-tracker.spec.ts] 6. Importă test și expect din @playwright/test',
    name_en: '[task-tracker.spec.ts] 6. Import test and expect from @playwright/test',
    check: 'regex',
    pattern: String.raw`import\s*\{(?=[^}]*\btest\b)(?=[^}]*\bexpect\b)[^}]*\}\s*from\s*['"]@playwright\/test['"]`,
    message: 'Cerința 6 eșuată: Importă test și expect din @playwright/test.',
    message_en: 'Requirement 6 failed: Import test and expect from @playwright/test.',
    successMessage: 'test și expect sunt importate corect din @playwright/test.',
    successMessage_en: 'test and expect are correctly imported from @playwright/test.',
  },
  {
    file: 'task-tracker.spec.ts',
    name: '[task-tracker.spec.ts] 7. Test cu titlu descriptiv și fixture-ul { page }',
    name_en: '[task-tracker.spec.ts] 7. Descriptive test title and { page } fixture',
    check: 'regex',
    pattern: String.raw`\btest\(\s*(['"\x60])(?!test\1)[^'"\x60]{8,}\1\s*,\s*(?:\{[^}]*\}\s*,\s*)?async\s*\(\s*\{[^}]*\bpage\b[^}]*\}\s*\)\s*=>`,
    message: "Cerința 7 eșuată: Definește un test('...', async ({ page }) => { ... }) cu un titlu descriptiv (minim 8 caractere, nu 'test').",
    message_en: "Requirement 7 failed: Define test('...', async ({ page }) => { ... }) with a descriptive title (at least 8 chars, not 'test').",
    successMessage: 'Testul are titlu descriptiv și folosește fixture-ul { page }.',
    successMessage_en: 'Test has a descriptive title and uses the { page } fixture.',
    diagnostics: [
      {
        pattern: String.raw`\btest\(\s*['"\x60]test['"\x60]`,
        message: "Titlul generic 'test' generat de Codegen trebuie înlocuit cu un titlu descriptiv (minim 8 caractere).",
        message_en: "The generic 'test' title generated by Codegen must be replaced with a descriptive title (at least 8 characters).",
      },
    ],
  },
  {
    file: 'task-tracker.spec.ts',
    name: "[task-tracker.spec.ts] 8. Navigare relativă cu await page.goto('/')",
    name_en: "[task-tracker.spec.ts] 8. Relative navigation with await page.goto('/')",
    check: 'regex',
    pattern: String.raw`await\s+page\.goto\(\s*['"\x60]\/['"\x60]\s*\)`,
    message: "Cerința 8 eșuată: Navighează relativ folosind await page.goto('/') bazându-te pe baseURL din config.",
    message_en: "Requirement 8 failed: Navigate relatively using await page.goto('/') relying on baseURL from config.",
    successMessage: "Navigarea relativă await page.goto('/') este implementată corect.",
    successMessage_en: "Relative navigation await page.goto('/') is properly implemented.",
    diagnostics: [
      {
        pattern: String.raw`page\.goto\(\s*['"\x60]https?:\/\/`,
        message: "Ai folosit un URL absolut în page.goto(...) — înlocuiește-l cu navigare relativă await page.goto('/') care preia baseURL din playwright.config.ts.",
        message_en: "An absolute URL was used in page.goto(...) — replace it with relative navigation await page.goto('/') using baseURL from playwright.config.ts.",
      },
    ],
  },
  {
    file: 'task-tracker.spec.ts',
    name: '[task-tracker.spec.ts] 9. Interacțiune input-task-name (.fill) și submit-task-btn (.click)',
    name_en: '[task-tracker.spec.ts] 9. Fill input-task-name and click submit-task-btn',
    check: 'regex',
    pattern: String.raw`getByTestId\(\s*['"]input-task-name['"]\s*\)[\s\S]*?\.fill\([\s\S]*getByTestId\(\s*['"]submit-task-btn['"]\s*\)[\s\S]*?\.click\(`,
    message: 'Cerința 9 eșuată: Completează câmpul getByTestId(\'input-task-name\') cu .fill(...) și apasă getByTestId(\'submit-task-btn\') cu .click().',
    message_en: 'Requirement 9 failed: Fill getByTestId(\'input-task-name\') with .fill(...) and click getByTestId(\'submit-task-btn\') with .click().',
    successMessage: 'Interacțiunile .fill() pe input-task-name și .click() pe submit-task-btn sunt implementate corect.',
    successMessage_en: 'Interactions .fill() on input-task-name and .click() on submit-task-btn are properly implemented.',
  },
  {
    file: 'task-tracker.spec.ts',
    name: "[task-tracker.spec.ts] 10. Asertare web-first pe task-list (.toContainText)",
    name_en: "[task-tracker.spec.ts] 10. Web-first assertion on task-list (.toContainText)",
    check: 'regex',
    pattern: String.raw`(?:expect\(\s*page\.getByTestId\(\s*['"]task-list['"]\s*\)\s*\)\s*\.toContainText\(|(?:const|let|var)\s+(\w+)\s*=\s*page\.getByTestId\(\s*['"]task-list['"]\s*\)[\s\S]*?expect\(\s*\1\s*\)\s*\.toContainText\()`,
    message: "Cerința 10 eșuată: Verifică cu o asertare web-first că lista conține noul task: await expect(page.getByTestId('task-list')).toContainText(...).",
    message_en: "Requirement 10 failed: Verify with a web-first assertion that the list contains the new task: await expect(page.getByTestId('task-list')).toContainText(...).",
    successMessage: "Asertarea web-first .toContainText(...) pe task-list este implementată corect.",
    successMessage_en: "Web-first assertion .toContainText(...) on task-list is properly implemented.",
  },
  {
    file: 'task-tracker.spec.ts',
    name: '[task-tracker.spec.ts] 11. Zero Hard-Wait Policy (fără waitForTimeout, force: true, URL absolut)',
    name_en: '[task-tracker.spec.ts] 11. Zero Hard-Wait Policy (no waitForTimeout, force: true, absolute URL)',
    check: 'regexInverted',
    pattern: String.raw`\bwaitForTimeout\s*\(|\bforce\s*:\s*true\b|\.goto\(\s*['"\x60]https?:\/\/`,
    message: 'Cerința 11 eșuată (Zero Hard-Wait Policy): Elimină waitForTimeout(), opțiunea { force: true } și URL-urile absolute din page.goto().',
    message_en: 'Requirement 11 failed (Zero Hard-Wait Policy): Remove waitForTimeout(), { force: true }, and absolute URLs in page.goto().',
    successMessage: 'Politica Zero Hard-Wait este respectată: niciun waitForTimeout(), { force: true } sau URL absolut în goto().',
    successMessage_en: 'Zero Hard-Wait Policy respected: no waitForTimeout(), { force: true }, or absolute URLs in goto().',
    diagnostics: [
      {
        pattern: String.raw`(?=[\s\S]*\bwaitForTimeout\s*\()(?=[\s\S]*\bforce\s*:\s*true\b)`,
        message: 'Zero Hard-Wait Policy încălcată: elimină atât page.waitForTimeout() cât și { force: true } din test.',
        message_en: 'Zero Hard-Wait Policy violated: remove both page.waitForTimeout() and { force: true } from the test.',
      },
      {
        pattern: String.raw`(?=[\s\S]*\.goto\(\s*['"\x60]https?:\/\/)(?=[\s\S]*\bforce\s*:\s*true\b)`,
        message: "Zero Hard-Wait Policy încălcată: ai folosit URL absolut în page.goto() și { force: true } — folosește page.goto('/') și addLocatorHandler().",
        message_en: "Zero Hard-Wait Policy violated: absolute URL in page.goto() and { force: true } detected — use page.goto('/') and addLocatorHandler().",
      },
      {
        pattern: String.raw`\bwaitForTimeout\s*\(`,
        message: 'Ai folosit waitForTimeout() (hard-wait interzis) — șterge-l; Playwright folosește auto-waiting și web-first assertions.',
        message_en: 'waitForTimeout() detected (prohibited hard wait) — remove it; Playwright uses built-in auto-waiting and web-first assertions.',
      },
      {
        pattern: String.raw`\bforce\s*:\s*true\b`,
        message: 'Ai folosit { force: true } la click — elimină-l și tratează overlay-ul promoțional curat cu page.addLocatorHandler().',
        message_en: '{ force: true } detected on click — remove it and handle the promo overlay cleanly with page.addLocatorHandler().',
      },
      {
        pattern: String.raw`\.goto\(\s*['"\x60]https?:\/\/`,
        message: "Ai folosit un URL absolut în page.goto(...) — folosește navigare relativă await page.goto('/') bazată pe baseURL.",
        message_en: "Absolute URL detected in page.goto(...) — use relative navigation await page.goto('/') backed by baseURL.",
      },
    ],
  },
]);

const refConfig = `import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'https://tasktracker.qualiadept.eu',
    testIdAttribute: 'data-testid',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});`;

const refSpec = `import { test, expect } from '@playwright/test';

test('utilizatorul adaugă un task nou și îl vede în listă', async ({ page }) => {
  await page.addLocatorHandler(page.getByTestId('close-promo-btn'), async (btn) => {
    await btn.click();
  });

  await page.goto('/');

  await page.getByTestId('input-task-name').fill('Primul meu test Playwright');
  await page.getByTestId('submit-task-btn').click();

  await expect(page.getByTestId('task-list')).toContainText('Primul meu test Playwright');
});`;

const starterConfig = `import { defineConfig } from '@playwright/test';

/**
 * TODO 1: importă și devices din @playwright/test
 * TODO 2: setează testDir către folderul ./tests
 * TODO 3: timeout de 30 de secunde pentru un test + fullyParallel
 * TODO 4: blocul use: baseURL, testIdAttribute, trace
 * TODO 5: proiectul chromium (Desktop Chrome)
 */
export default defineConfig({

});`;

const starterSpec = `// 🎬 Cod brut înregistrat cu Playwright Codegen pe aplicația Task Tracker.
// Misiunea ta: transformă-l într-un smoke test curat (cerințele 6–11 din material).
import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://tasktracker.qualiadept.eu/');
  await page.waitForTimeout(3000);
  await page.getByTestId('close-promo-btn').click();
  await page.getByTestId('input-task-name').click();
  await page.getByTestId('input-task-name').fill('Primul meu test');
  await page.getByTestId('submit-task-btn').click({ force: true });
});`;

interface FeedbackItem {
  check: string;
  passed: boolean;
  message: string;
  file?: string;
}

interface ValidationApiResponse {
  status: 'pass' | 'fail';
  score: number;
  feedback: FeedbackItem[];
  isPartial?: boolean;
  targetFile?: string;
}

async function validateFiles(
  files: Record<string, string>,
  extra: Record<string, unknown> = {}
): Promise<ValidationApiResponse> {
  const req = new NextRequest('http://localhost:3000/api/validate/static', {
    method: 'POST',
    body: JSON.stringify({
      assignmentId: '00000000-0000-0000-0000-000000000009',
      files,
      ...extra,
    }),
  });
  const res = await POST(req);
  return res.json() as Promise<ValidationApiResponse>;
}

describe('Module 9 (Playwright Setup & Codegen) - API Validation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(getAuthSession).mockResolvedValue({
      user: {
        id: 'usr-1',
        email: 'trainer@qualiadept.eu',
        name: 'George Trainer',
        role: 'TRAINER',
      },
      expires: '2099-01-01T00:00:00.000Z',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr-1',
      email: 'trainer@qualiadept.eu',
      role: 'TRAINER',
      isEnrolled: true,
    } as never);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000009',
      title: 'Sesiunea 9: Setup și Arhitectură Playwright (Codegen)',
      module: 9,
      validationType: 'STATIC',
      validationRules: module9Rules,
    } as never);

    vi.mocked(prisma.submission.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.submission.count).mockResolvedValue(0);
    vi.mocked(prisma.submission.create).mockResolvedValue({
      id: 'sub-mod9-1',
      status: 'PASS',
      score: 100,
      feedbackJSON: '[]',
    } as never);
  });

  it('TC-01: Reference solution (Cod 6.02 + Cod 6.03) passes all 11 rules with 100% score', async () => {
    const data = await validateFiles({
      'playwright.config.ts': refConfig,
      'task-tracker.spec.ts': refSpec,
    });

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback).toHaveLength(11);
    expect(data.feedback.every((f) => f.passed === true)).toBe(true);
  });

  it('TC-02: Starter code (Cod A.01 + Cod A.02) fails exactly 9 rules (only 6 and 9 pass)', async () => {
    const data = await validateFiles({
      'playwright.config.ts': starterConfig,
      'task-tracker.spec.ts': starterSpec,
    });

    expect(data.status).toBe('fail');
    const failedIndices = data.feedback
      .map((f, i) => (!f.passed ? i + 1 : null))
      .filter(Boolean);
    expect(failedIndices).toEqual([1, 2, 3, 4, 5, 7, 8, 10, 11]);
  });

  it('TC-03: Alternative valid solution (BASE_URL ??, double quotes, tags, locator variables) passes 100%', async () => {
    const altConfig = `import { devices, defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/",
  fullyParallel: true,
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  use: {
    trace: "on-first-retry",
    testIdAttribute: "data-testid",
    baseURL: process.env.BASE_URL ?? "https://tasktracker.qualiadept.eu/",
    actionTimeout: 10_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});`;

    const altSpec = `import { expect, test } from '@playwright/test';
test.describe('Task Tracker', () => {
  test('utilizatorul adaugă un task', { tag: '@smoke' }, async ({ page }) => {
    const input = page.getByTestId('input-task-name');
    await page.goto('/');
    await input.fill('abc');
    const btn = page.getByTestId('submit-task-btn');
    await btn.click();
    await expect(page.getByTestId('task-list')).toContainText('abc');
  });
});`;

    const data = await validateFiles({
      'playwright.config.ts': altConfig,
      'task-tracker.spec.ts': altSpec,
    });

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
  });

  it('TC-04: Local http://localhost:3000 baseURL passes 100%', async () => {
    const localConfig = refConfig.replace('https://tasktracker.qualiadept.eu', 'http://localhost:3000');
    const data = await validateFiles({
      'playwright.config.ts': localConfig,
      'task-tracker.spec.ts': refSpec,
    });

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
  });

  it('TC-05: Rule 10 accepts task-list locator stored in a variable (consistent with Rule 9 & Bonus Cod 6.04)', async () => {
    const specWithVarList = `import { test, expect } from '@playwright/test';

test('utilizatorul adaugă un task nou și îl vede în listă', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('input-task-name').fill('Task din variabilă');
  await page.getByTestId('submit-task-btn').click();
  const lista = page.getByTestId('task-list');
  await expect(lista).toContainText('Task din variabilă');
});`;

    const data = await validateFiles({
      'playwright.config.ts': refConfig,
      'task-tracker.spec.ts': specWithVarList,
    });

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
  });

  it('TC-06: Config baseURL with /index.html fails ONLY Rule 4', async () => {
    const badBaseUrlConfig = refConfig.replace(
      "baseURL: 'https://tasktracker.qualiadept.eu'",
      "baseURL: 'https://tasktracker.qualiadept.eu/index.html'"
    );
    const data = await validateFiles({
      'playwright.config.ts': badBaseUrlConfig,
      'task-tracker.spec.ts': refSpec,
    });

    const failedIndices = data.feedback
      .map((f, i) => (!f.passed ? i + 1 : null))
      .filter(Boolean);
    expect(failedIndices).toEqual([4]);
  });

  it('TC-07: Config using actionTimeout instead of timeout fails ONLY Rule 3', async () => {
    const badTimeoutConfig = refConfig.replace('timeout: 30_000,', 'actionTimeout: 30_000,');
    const data = await validateFiles({
      'playwright.config.ts': badTimeoutConfig,
      'task-tracker.spec.ts': refSpec,
    });

    const failedIndices = data.feedback
      .map((f, i) => (!f.passed ? i + 1 : null))
      .filter(Boolean);
    expect(failedIndices).toEqual([3]);
  });

  it('TC-08: Spec using { force: true } fails ONLY Rule 11', async () => {
    const forcedClickSpec = refSpec.replace('.click();', '.click({ force: true });');
    const data = await validateFiles({
      'playwright.config.ts': refConfig,
      'task-tracker.spec.ts': forcedClickSpec,
    });

    const failedIndices = data.feedback
      .map((f, i) => (!f.passed ? i + 1 : null))
      .filter(Boolean);
    expect(failedIndices).toEqual([11]);
  });

  it('TC-09: Spec using absolute URL in page.goto() fails Rules 8 and 11', async () => {
    const absUrlSpec = refSpec.replace(
      "await page.goto('/');",
      "await page.goto('https://tasktracker.qualiadept.eu/');"
    );
    const data = await validateFiles({
      'playwright.config.ts': refConfig,
      'task-tracker.spec.ts': absUrlSpec,
    });

    const failedIndices = data.feedback
      .map((f, i) => (!f.passed ? i + 1 : null))
      .filter(Boolean);
    expect(failedIndices).toEqual([8, 11]);
  });

  it('TC-10: Comments mentioning waitForTimeout() do not falsely fail Rule 11, and commented solution code does not falsely pass', async () => {
    const commentedPassSpec = `${refSpec}\n// Criteriul 11: fără waitForTimeout(3000) sau force: true`;
    const passData = await validateFiles({
      'playwright.config.ts': refConfig,
      'task-tracker.spec.ts': commentedPassSpec,
    });
    expect(passData.status).toBe('pass');
    expect(passData.score).toBe(100);

    const commentedOutConfig = refConfig
      .split('\n')
      .map((line) => `// ${line}`)
      .join('\n');
    const failData = await validateFiles({
      'playwright.config.ts': commentedOutConfig,
      'task-tracker.spec.ts': refSpec,
    });
    expect(failData.status).toBe('fail');
    const failedConfigRules = failData.feedback
      .filter((f) => f.file === 'playwright.config.ts')
      .every((f) => f.passed === false);
    expect(failedConfigRules).toBe(true);
  });

  it('TC-11: Partial single-file checks execute only rules for the target file (5 config, 6 spec)', async () => {
    const configOnly = await validateFiles(
      { 'playwright.config.ts': refConfig, 'task-tracker.spec.ts': starterSpec },
      { targetFile: 'playwright.config.ts' }
    );
    expect(configOnly.isPartial).toBe(true);
    expect(configOnly.targetFile).toBe('playwright.config.ts');
    expect(configOnly.status).toBe('pass');
    expect(configOnly.feedback).toHaveLength(5);
    expect(configOnly.feedback.every((f) => f.file === 'playwright.config.ts')).toBe(true);

    const specOnly = await validateFiles(
      { 'playwright.config.ts': starterConfig, 'task-tracker.spec.ts': refSpec },
      { targetFile: 'task-tracker.spec.ts' }
    );
    expect(specOnly.isPartial).toBe(true);
    expect(specOnly.targetFile).toBe('task-tracker.spec.ts');
    expect(specOnly.status).toBe('pass');
    expect(specOnly.feedback).toHaveLength(6);
    expect(specOnly.feedback.every((f) => f.file === 'task-tracker.spec.ts')).toBe(true);
  });

  it('TC-12: English locale returns English check titles and success/failure messages', async () => {
    const data = await validateFiles(
      { 'playwright.config.ts': refConfig, 'task-tracker.spec.ts': refSpec },
      { locale: 'en' }
    );

    expect(data.status).toBe('pass');
    expect(data.feedback[0].check).toBe('[playwright.config.ts] 1. Import defineConfig and devices from @playwright/test');
    expect(data.feedback[0].message).toContain('correctly imported');
    expect(data.feedback[10].check).toContain('Zero Hard-Wait Policy (no waitForTimeout');
  });

  it('TC-13: Returns specific contextual diagnostics for M09 regex and regexInverted failures in RO & EN', async () => {
    const badSpec = refSpec
      .replace("await page.goto('/');", "await page.goto('https://tasktracker.qualiadept.eu/');")
      .replace("await page.getByTestId('submit-task-btn').click();", "await page.getByTestId('submit-task-btn').click({ force: true });");

    const roData = await validateFiles(
      { 'playwright.config.ts': refConfig, 'task-tracker.spec.ts': badSpec },
      { targetFile: 'task-tracker.spec.ts', locale: 'ro' }
    );
    expect(roData.status).toBe('fail');
    // Rule 8 (index 2 in spec-only partial) -> absolute URL diagnostic
    expect(roData.feedback[2].passed).toBe(false);
    expect(roData.feedback[2].message).toContain('URL absolut în page.goto');
    // Rule 11 (index 5 in spec-only partial) -> regexInverted combined absolute URL + force: true diagnostic
    expect(roData.feedback[5].passed).toBe(false);
    expect(roData.feedback[5].message).toContain('URL absolut în page.goto() și { force: true }');

    const enData = await validateFiles(
      { 'playwright.config.ts': refConfig, 'task-tracker.spec.ts': badSpec },
      { targetFile: 'task-tracker.spec.ts', locale: 'en' }
    );
    expect(enData.feedback[2].message).toContain('An absolute URL was used in page.goto');
    expect(enData.feedback[5].message).toContain('absolute URL in page.goto() and { force: true }');
  });
});
