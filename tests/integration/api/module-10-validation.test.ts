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

const module10Rules = JSON.stringify([
  {
    file: 'task-tracker-e2e.spec.ts',
    name: '[task-tracker-e2e.spec.ts] 1. Importă test și expect din @playwright/test',
    name_en: '[task-tracker-e2e.spec.ts] 1. Import test and expect from @playwright/test',
    check: 'regex',
    pattern: String.raw`import\s*\{(?=[^}]*\btest\b)(?=[^}]*\bexpect\b)[^}]*\}\s*from\s*['"]@playwright\/test['"]`,
    message: 'Cerința 1 eșuată: Importă test și expect din @playwright/test.',
    message_en: 'Requirement 1 failed: Import test and expect from @playwright/test.',
    successMessage: 'test și expect sunt importate corect din @playwright/test.',
    successMessage_en: 'test and expect are correctly imported from @playwright/test.',
    diagnostics: [
      {
        pattern: String.raw`import\s*\{[^}]*\btest\b[^}]*\}\s*from\s*['"]@playwright\/test['"]`,
        message: "Ai importat test, dar lipsește expect din '@playwright/test' (import { test, expect } from '@playwright/test').",
        message_en: "You imported test, but expect is missing from '@playwright/test' (import { test, expect } from '@playwright/test').",
      },
    ],
  },
  {
    file: 'task-tracker-e2e.spec.ts',
    name: "[task-tracker-e2e.spec.ts] 2. Grupează testele într-un test.describe('<titlu descriptiv>', () => { ... })",
    name_en: "[task-tracker-e2e.spec.ts] 2. Group the tests in a test.describe('<descriptive title>', () => { ... })",
    check: 'regex',
    pattern: String.raw`\btest\.describe\(\s*(['"\x60])[^'"\x60]{3,}\1\s*,\s*(?:\{[^}]*\}\s*,\s*)?\(\s*\)\s*=>\s*\{`,
    message: "Cerința 2 eșuată: Grupează toate testele într-un test.describe('<titlu descriptiv>', () => { ... }) cu un titlu de minimum 3 caractere.",
    message_en: "Requirement 2 failed: Group all tests inside test.describe('<descriptive title>', () => { ... }) with a title of at least 3 characters.",
    successMessage: 'Suita este grupată corect într-un bloc test.describe cu titlu descriptiv.',
    successMessage_en: 'The suite is properly grouped inside a test.describe block with a descriptive title.',
  },
  {
    file: 'task-tracker-e2e.spec.ts',
    name: "[task-tracker-e2e.spec.ts] 3. test.beforeEach cu page.addLocatorHandler pentru close-promo-btn și await page.goto('/')",
    name_en: "[task-tracker-e2e.spec.ts] 3. test.beforeEach with page.addLocatorHandler for close-promo-btn and await page.goto('/')",
    check: 'regex',
    pattern: String.raw`test\.beforeEach\(\s*async\s*\(\s*\{[^}]*\bpage\b[^}]*\}\s*\)\s*=>\s*\{(?=(?:(?!\btest\()[\s\S])*?\baddLocatorHandler\s*\()(?=(?:(?!\btest\()[\s\S])*?getByTestId\(\s*['"]close-promo-btn['"]\s*\))(?=(?:(?!\btest\()[\s\S])*?await\s+page\.goto\(\s*['"\x60]\/['"\x60]\s*\))`,
    message: "Cerința 3 eșuată: Adaugă un test.beforeEach(async ({ page }) => { ... }) care înregistrează page.addLocatorHandler(...) pentru close-promo-btn și navighează relativ cu await page.goto('/').",
    message_en: "Requirement 3 failed: Add a test.beforeEach(async ({ page }) => { ... }) that registers page.addLocatorHandler(...) for close-promo-btn and navigates relatively with await page.goto('/').",
    successMessage: "Hook-ul test.beforeEach înregistrează addLocatorHandler pentru close-promo-btn și navighează relativ cu await page.goto('/').",
    successMessage_en: "The test.beforeEach hook registers addLocatorHandler for close-promo-btn and navigates relatively via await page.goto('/').",
    diagnostics: [
      {
        pattern: String.raw`test\.beforeEach\([\s\S]*?page\.goto\(\s*['"\x60]https?:\/\/`,
        message: "Ai folosit un URL absolut în test.beforeEach — înlocuiește-l cu navigare relativă await page.goto('/').",
        message_en: "An absolute URL was used inside test.beforeEach — replace it with relative navigation await page.goto('/').",
      },
      {
        pattern: String.raw`test\.beforeEach\(\s*async\s*\(\s*\{[^}]*\bpage\b[^}]*\}\s*\)\s*=>\s*\{(?=(?:(?!\btest\()[\s\S])*?await\s+page\.goto\(\s*['"\x60]\/['"\x60]\s*\))`,
        message: "Hook-ul test.beforeEach face await page.goto('/'), dar lipsește page.addLocatorHandler(...) pentru butonul close-promo-btn.",
        message_en: "test.beforeEach calls await page.goto('/'), but page.addLocatorHandler(...) for close-promo-btn is missing.",
      },
    ],
  },
  {
    file: 'task-tracker-e2e.spec.ts',
    name: '[task-tracker-e2e.spec.ts] 4. Verifică submit-task-btn cu toBeDisabled() înainte și toBeEnabled() după completare',
    name_en: '[task-tracker-e2e.spec.ts] 4. Check submit-task-btn with toBeDisabled() before and toBeEnabled() after filling in',
    check: 'regex',
    pattern: String.raw`^(?=[\s\S]*getByTestId\(\s*['"]submit-task-btn['"]\s*\))(?=[\s\S]*\.toBeDisabled\(\s*\))(?=[\s\S]*\.toBeEnabled\(\s*\))`,
    message: 'Cerința 4 eșuată: Verifică butonul submit-task-btn cu asertări web-first .toBeDisabled() inițial și .toBeEnabled() după completare.',
    message_en: 'Requirement 4 failed: Assert submit-task-btn with web-first assertions .toBeDisabled() initially and .toBeEnabled() after filling in.',
    successMessage: 'Stările submit-task-btn (.toBeDisabled() și .toBeEnabled()) sunt verificate corect cu web-first assertions.',
    successMessage_en: 'submit-task-btn states (.toBeDisabled() and .toBeEnabled()) are properly verified with web-first assertions.',
    diagnostics: [
      {
        pattern: String.raw`expect\(\s*await\b[\s\S]*?(?:isDisabled|isEnabled)`,
        message: 'Ai folosit expect(await ...isDisabled()/isEnabled()) în loc de web-first assertions — folosește await expect(buton).toBeDisabled() și await expect(buton).toBeEnabled().',
        message_en: 'You used expect(await ...isDisabled()/isEnabled()) instead of web-first assertions — use await expect(button).toBeDisabled() and await expect(button).toBeEnabled().',
      },
    ],
  },
  {
    file: 'task-tracker-e2e.spec.ts',
    name: "[task-tracker-e2e.spec.ts] 5. fill() pe input-task-name, selectOption('high') pe select-task-priority, click() pe submit-task-btn",
    name_en: "[task-tracker-e2e.spec.ts] 5. fill() on input-task-name, selectOption('high') on select-task-priority, click() on submit-task-btn",
    check: 'regex',
    pattern: String.raw`^(?=[\s\S]*getByTestId\(\s*['"]input-task-name['"]\s*\)[\s\S]*?\.fill\()(?=[\s\S]*getByTestId\(\s*['"]select-task-priority['"]\s*\)[\s\S]*?\.selectOption\(\s*(?:['"\x60]high['"\x60]|\{\s*(?:value\s*:\s*['"]high['"]|label\s*:\s*['"]Ridicată['"])\s*\}|['"]Ridicată['"]))(?=[\s\S]*getByTestId\(\s*['"]submit-task-btn['"]\s*\)[\s\S]*?\.click\()`,
    message: "Cerința 5 eșuată: Completează input-task-name cu .fill(...), alege prioritatea 'high' (sau eticheta 'Ridicată') din select-task-priority cu .selectOption(...) și salvează cu .click() pe submit-task-btn.",
    message_en: "Requirement 5 failed: Fill input-task-name with .fill(...), select priority 'high' (or label 'Ridicată') on select-task-priority with .selectOption(...), and click submit-task-btn.",
    successMessage: "Acțiunile .fill(), .selectOption('high') și .click() pentru crearea task-ului sunt implementate corect.",
    successMessage_en: "Task creation actions .fill(), .selectOption('high'), and .click() are properly implemented.",
    diagnostics: [
      {
        pattern: String.raw`getByTestId\(\s*['"]select-task-priority['"]\s*\)[\s\S]{0,120}?\.fill\(`,
        message: "Ai folosit .fill() pe dropdown-ul select-task-priority — pentru <select> folosește .selectOption('high') (sau { label: 'Ridicată' }).",
        message_en: "You used .fill() on the select-task-priority dropdown — for <select> elements use .selectOption('high') (or { label: 'Ridicată' }).",
      },
    ],
  },
  {
    file: 'task-tracker-e2e.spec.ts',
    name: "[task-tracker-e2e.spec.ts] 6. Verifică lista cu toContainText(...) și câmpul golit cu toHaveValue('')",
    name_en: "[task-tracker-e2e.spec.ts] 6. Check the list with toContainText(...) and the cleared field with toHaveValue('')",
    check: 'regex',
    pattern: String.raw`^(?=[\s\S]*expect\(\s*(?:page\.getByTestId\(\s*['"]task-list['"]\s*\)|\w+)\s*\)\s*\.toContainText\()(?=[\s\S]*getByTestId\(\s*['"]task-list['"]\s*\))(?=[\s\S]*getByTestId\(\s*['"]input-task-name['"]\s*\)[\s\S]*\.(?:toHaveValue\(\s*(['"\x60])\1\s*\)|toBeEmpty\(\s*\)))`,
    message: "Cerința 6 eșuată: Confirmă apariția task-ului în task-list cu .toContainText(...) și golirea câmpului input-task-name cu .toHaveValue('') (sau .toBeEmpty()).",
    message_en: "Requirement 6 failed: Verify the new task appears in task-list using .toContainText(...) and that input-task-name is cleared with .toHaveValue('') (or .toBeEmpty()).",
    successMessage: "Lista task-list (.toContainText) și resetarea câmpului input-task-name (.toHaveValue('') / .toBeEmpty()) sunt verificate corect.",
    successMessage_en: "task-list (.toContainText) and input-task-name reset (.toHaveValue('') / .toBeEmpty()) are properly verified.",
  },
  {
    file: 'task-tracker-e2e.spec.ts',
    name: '[task-tracker-e2e.spec.ts] 7. checkbox-task-1: check() + toBeChecked(), apoi uncheck() + not.toBeChecked()',
    name_en: '[task-tracker-e2e.spec.ts] 7. checkbox-task-1: check() + toBeChecked(), then uncheck() + not.toBeChecked()',
    check: 'regex',
    pattern: String.raw`^(?=[\s\S]*getByTestId\(\s*['"\x60]checkbox-task-1['"\x60]\s*\))(?=[\s\S]*\.(?:check\(\s*\)|setChecked\(\s*true\s*\)))(?=[\s\S]*\.toBeChecked\(\s*\))(?=[\s\S]*\.(?:uncheck\(\s*\)|setChecked\(\s*false\s*\)))(?=[\s\S]*(?:\.not\.toBeChecked\(\s*\)|\.toBeChecked\(\s*\{\s*checked\s*:\s*false\s*\}\s*\)))`,
    message: 'Cerința 7 eșuată: Pe checkbox-task-1 folosește .check() + .toBeChecked(), apoi .uncheck() + .not.toBeChecked() (sau setChecked(true/false)).',
    message_en: 'Requirement 7 failed: On checkbox-task-1 use .check() + .toBeChecked(), then .uncheck() + .not.toBeChecked() (or setChecked(true/false)).',
    successMessage: 'Bifarea și debifarea checkbox-task-1 cu check()/uncheck() (sau setChecked) și asertările de stare sunt implementate corect.',
    successMessage_en: 'Checking and unchecking checkbox-task-1 via check()/uncheck() (or setChecked) with state assertions are properly implemented.',
    diagnostics: [
      {
        pattern: String.raw`getByTestId\(\s*['"\x60]checkbox-task-1['"\x60]\s*\)[\s\S]{0,160}?\.click\(`,
        message: 'Ai folosit .click() pe checkbox-task-1 — folosește metodele idempotente .check() / .uncheck() (sau .setChecked(true/false)).',
        message_en: 'You used .click() on checkbox-task-1 — use the idempotent .check() / .uncheck() (or .setChecked(true/false)) methods instead.',
      },
    ],
  },
  {
    file: 'task-tracker-e2e.spec.ts',
    name: '[task-tracker-e2e.spec.ts] 8. Șterge task-ul 1 (delete-btn-1) și confirmă eliminarea',
    name_en: '[task-tracker-e2e.spec.ts] 8. Delete task 1 (delete-btn-1) and confirm its removal',
    check: 'regex',
    pattern: String.raw`^(?=[\s\S]*getByTestId\(\s*['"\x60]delete-btn-1['"\x60]\s*\)[\s\S]*?\.click\()(?=[\s\S]*(?:\.not\.toBeAttached\(|\.toBeHidden\(|\.toHaveCount\(\s*4\s*\)|\.not\.toContainText\(|\.not\.toBeVisible\())`,
    message: 'Cerința 8 eșuată: Dă click pe delete-btn-1 și confirmă eliminarea cu not.toBeAttached(), toBeHidden(), toHaveCount(4), not.toContainText(...) sau not.toBeVisible().',
    message_en: 'Requirement 8 failed: Click delete-btn-1 and verify removal with not.toBeAttached(), toBeHidden(), toHaveCount(4), not.toContainText(...), or not.toBeVisible().',
    successMessage: 'Ștergerea task-ului 1 (delete-btn-1) și asertarea eliminării sunt implementate corect.',
    successMessage_en: 'Deleting task 1 (delete-btn-1) and asserting its removal are properly implemented.',
  },
  {
    file: 'task-tracker-e2e.spec.ts',
    name: '[task-tracker-e2e.spec.ts] 9. Minimum 3 teste cu titluri descriptive și fixture-ul { page }',
    name_en: '[task-tracker-e2e.spec.ts] 9. At least 3 tests with descriptive titles and the { page } fixture',
    check: 'regex',
    pattern: String.raw`(?:[\s\S]*?\btest\(\s*(['"\x60])(?!test\1)[^'"\x60]{8,}\1\s*,\s*(?:\{[^}]*\}\s*,\s*)?async\s*\(\s*\{[^}]*\bpage\b[^}]*\}\s*\)\s*=>){3}`,
    message: "Cerința 9 eșuată: Suita trebuie să conțină cel puțin 3 teste test('...', async ({ page }) => { ... }) cu titluri descriptive de minim 8 caractere (nu 'test').",
    message_en: "Requirement 9 failed: The suite must contain at least 3 tests test('...', async ({ page }) => { ... }) with descriptive titles of at least 8 characters (not 'test').",
    successMessage: 'Suita are cel puțin 3 teste izolate cu titluri descriptive și fixture-ul { page }.',
    successMessage_en: 'The suite defines at least 3 isolated tests with descriptive titles and the { page } fixture.',
    diagnostics: [
      {
        pattern: String.raw`\btest\(\s*['"\x60]test['"\x60]`,
        message: "Titlul generic 'test' din starter trebuie înlocuit cu un titlu descriptiv (minim 8 caractere) și trebuie definite cel puțin 3 teste.",
        message_en: "The generic 'test' title from the starter must be replaced with a descriptive title (at least 8 characters) and at least 3 tests must be defined.",
      },
      {
        pattern: String.raw`(?:[\s\S]*?\btest\(\s*(['"\x60])(?!test\1)[^'"\x60]{8,}\1\s*,){2}`,
        message: 'Ai doar 2 teste cu titluri descriptive — separă scenariile în minimum 3 teste independente (creare, bifare/debifare, ștergere).',
        message_en: 'Only 2 descriptive tests found — split the scenarios into at least 3 independent tests (create, check/uncheck, delete).',
      },
    ],
  },
  {
    file: 'task-tracker-e2e.spec.ts',
    name: '[task-tracker-e2e.spec.ts] 10. Clean Code & Inspector Hygiene (fără page.pause, waitForTimeout, force: true, URL absolut, expect(await))',
    name_en: '[task-tracker-e2e.spec.ts] 10. Clean Code & Inspector Hygiene (no page.pause, waitForTimeout, force: true, absolute URL, expect(await))',
    check: 'regexInverted',
    includeComments: true,
    pattern: String.raw`\bpage\.pause\s*\(|\.pause\s*\(\s*\)|\bwaitForTimeout\s*\(|\bforce\s*:\s*true\b|\.goto\(\s*['"\x60]https?:\/\/|expect\(\s*await\b`,
    message: 'Cerința 10 eșuată (Clean Code & Inspector Hygiene): Elimină oriunde din fișier (inclusiv din comentarii) page.pause(), waitForTimeout(), { force: true }, URL-urile absolute în goto() și expect(await ...).',
    message_en: 'Requirement 10 failed (Clean Code & Inspector Hygiene): Remove everywhere in the file (including comments) page.pause(), waitForTimeout(), { force: true }, absolute URLs in goto(), and expect(await ...).',
    successMessage: 'Politica Clean Code & Inspector Hygiene este respectată integral: fără pauze de debug, așteptări fixe, click forțat, URL absolut sau expect(await).',
    successMessage_en: 'Clean Code & Inspector Hygiene Policy fully respected: no debug pauses, fixed waits, forced actions, absolute URLs, or expect(await).',
    diagnostics: [
      {
        pattern: String.raw`\bpage\.pause\s*\(|\.pause\s*\(\s*\)`,
        message: 'Inspector Hygiene încălcată: ai lăsat page.pause() / .pause() în fișier (sau într-un comentariu) — șterge-l complet înainte de Submit.',
        message_en: 'Inspector Hygiene violated: page.pause() / .pause() was left in the file (or inside a comment) — remove it completely before Submit.',
      },
      {
        pattern: String.raw`\bwaitForTimeout\s*\(`,
        message: 'Zero Hard-Wait Policy încălcată: elimină waitForTimeout() și bazează-te pe auto-waiting + web-first assertions.',
        message_en: 'Zero Hard-Wait Policy violated: remove waitForTimeout() and rely on built-in auto-waiting and web-first assertions.',
      },
      {
        pattern: String.raw`\bforce\s*:\s*true\b`,
        message: 'Zero Hard-Wait Policy încălcată: elimină { force: true } și gestionează overlay-ul promoțional cu page.addLocatorHandler().',
        message_en: 'Zero Hard-Wait Policy violated: remove { force: true } and handle the promo overlay cleanly with page.addLocatorHandler().',
      },
      {
        pattern: String.raw`\.goto\(\s*['"\x60]https?:\/\/`,
        message: "Clean Code încălcat: ai folosit un URL absolut în page.goto(...) — folosește navigare relativă await page.goto('/').",
        message_en: "Clean Code violated: absolute URL detected in page.goto(...) — use relative navigation await page.goto('/').",
      },
      {
        pattern: String.raw`expect\(\s*await\b`,
        message: 'Clean Code încălcat: evită asertările non-retrying de tip expect(await ...) — folosește web-first assertions (await expect(locator).to...).',
        message_en: 'Clean Code violated: avoid non-retrying expect(await ...) assertions — use web-first assertions (await expect(locator).to...).',
      },
    ],
  },
]);

const refSolution = `import { test, expect } from '@playwright/test';                         // Cerința 1

test.describe('Task Tracker – fluxul complet scris manual (M10)', () => { // Cerința 2
  test.beforeEach(async ({ page }) => {                                   // Cerința 3
    const promo = page.getByTestId('close-promo-btn');
    await page.addLocatorHandler(promo, async (buton) => {
      await buton.click();
    });
    await page.goto('/');
    await expect(page.getByTestId('task-list').locator('.task-item')).toHaveCount(5);
  });

  test('utilizatorul creează un task cu prioritate ridicată', async ({ page }) => { // Cerința 9
    const input = page.getByTestId('input-task-name');
    const salveaza = page.getByTestId('submit-task-btn');

    await expect(salveaza).toBeDisabled();                                // Cerința 4
    await input.fill('Testez prioritatea manual');                        // Cerința 5
    await page.getByTestId('select-task-priority').selectOption('high');  // Cerința 5
    await expect(salveaza).toBeEnabled();                                 // Cerința 4
    await salveaza.click();                                               // Cerința 5

    await expect(page.getByTestId('task-list')).toContainText('Testez prioritatea manual'); // Cerința 6
    await expect(input).toHaveValue('');                                  // Cerința 6
    await expect(page.getByTestId('task-list').locator('.task-item').last())
      .toHaveAttribute('data-priority', 'high');
  });

  test('utilizatorul bifează și debifează primul task', async ({ page }) => {
    const bifa = page.getByTestId('checkbox-task-1');
    await bifa.check();                                                   // Cerința 7
    await expect(bifa).toBeChecked();
    await expect(page.locator('.task-title').first()).toHaveClass(/completed/);
    await bifa.uncheck();
    await expect(bifa).not.toBeChecked();
  });

  test('utilizatorul șterge primul task din listă', async ({ page }) => {
    await page.getByTestId('delete-btn-1').click();                       // Cerința 8
    await expect(page.getByTestId('delete-btn-1')).not.toBeAttached();
    await expect(page.getByTestId('task-list').locator('.task-item')).toHaveCount(4);
  });
});
// Cerința 10: cod curat, fără pauze de debug, așteptări fixe, acțiuni forțate sau adrese absolute.`;

const starterCode = `// Modulul 10 – Primul tău test E2E scris manual (fără Codegen!)
// Completează TODO-urile în ordine. Cerințele sunt în Capitolul 6 al materialului.
import { test, expect } from '@playwright/test';

// TODO 2: grupează toate testele într-un test.describe cu un titlu descriptiv.

// TODO 3: adaugă un test.beforeEach care:
//   - înregistrează handler-ul pentru butonul close-promo-btn;
//   - navighează relativ la pagina principală.

test('test', async ({ page }) => {
  await page.goto('/');
  await page.pause(); // TODO 10: pauza de debug trebuie ștearsă înainte de Submit

  // TODO 4: verifică faptul că submit-task-btn pornește dezactivat.
  // TODO 5: completează input-task-name și alege prioritatea high din select-task-priority.
  // TODO 4 + 6: verifică butonul activ, salvează, apoi verifică lista și câmpul golit.
});

// TODO 7: un test pentru checkbox-task-1 (bifare și debifare, cu verificarea stării).
// TODO 8: un test pentru ștergerea task-ului 1 (delete-btn-1) și dispariția lui.
// TODO 9: minimum 3 teste, fiecare cu un titlu descriptiv (nu 'test').`;

const alternativeCorrect = `import { expect, test } from "@playwright/test";

test.describe(\`Task Tracker v1.1 – regresie\`, { tag: "@regresie" }, () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.addLocatorHandler(page.getByTestId("close-promo-btn"), async (b) => {
      await b.click();
    });
  });

  test("creez un task urgent din formular", async ({ page }) => {
    const nume = page.getByTestId("input-task-name");
    const prioritate = page.getByTestId("select-task-priority");
    const buton = page.getByTestId("submit-task-btn");
    await expect(buton).toBeDisabled();
    await nume.fill("Alternativ");
    await prioritate.selectOption({ label: "Ridicată" });
    await expect(buton).toBeEnabled();
    await buton.click();
    const lista = page.getByTestId("task-list");
    await expect(lista).toContainText("Alternativ");
    await expect(nume).toBeEmpty();
  });

  test("bifez task-ul 1 prin setChecked", { tag: "@check" }, async ({ page }) => {
    const bifa = page.getByTestId("checkbox-task-1");
    await bifa.setChecked(true);
    await expect(bifa).toBeChecked();
    await bifa.setChecked(false);
    await expect(bifa).toBeChecked({ checked: false });
  });

  test("șterg primul task inițial", async ({ page }) => {
    await page.getByTestId("delete-btn-1").click();
    await expect(page.getByTestId("task-list")).not.toContainText("delectus aut autem");
  });
});`;

const localCorrect = `import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:3000' });

${refSolution.replace("import { test, expect } from '@playwright/test';                         // Cerința 1\n", '')}`;

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
}

async function runM10(specCode: string, locale: 'ro' | 'en' = 'ro'): Promise<ValidationApiResponse> {
  const req = new NextRequest('http://localhost:3000/api/validate/static', {
    method: 'POST',
    body: JSON.stringify({
      assignmentId: '00000000-0000-0000-0000-000000000010',
      files: { 'task-tracker-e2e.spec.ts': specCode },
      locale,
    }),
  });
  const res = await POST(req);
  expect(res.status).toBe(200);
  return (await res.json()) as ValidationApiResponse;
}

function getFailedRuleNumbers(data: ValidationApiResponse): number[] {
  return data.feedback
    .map((f, idx) => (f.passed ? null : idx + 1))
    .filter((n): n is number => n !== null);
}

describe('Module 10 Integration Validation (Session 10: Navigation & Basic Actions)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthSession).mockResolvedValue({
      user: { id: 'student-m10', name: 'QA Student', email: 'student@qualiadept.eu', role: 'STUDENT' },
      expires: '2027-01-01',
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'student-m10',
      name: 'QA Student',
      isEnrolled: true,
      role: 'STUDENT',
    } as never);
    vi.mocked(prisma.submission.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.submission.count).mockResolvedValue(0);
    vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000010',
      module: 10,
      title: 'Sesiunea 10: Navigare și Acțiuni de Bază (Primul Test E2E Manual)',
      validationType: 'STATIC',
      validationRules: module10Rules,
    } as never);
    vi.mocked(prisma.submission.create).mockResolvedValue({ id: 'sub-m10' } as never);
  });

  // --- Correct variants (Appendix Section 6) ---
  it('TC-01: Reference solution passes all 10 rules (100% PASS)', async () => {
    const data = await runM10(refSolution);
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback).toHaveLength(10);
    expect(getFailedRuleNumbers(data)).toEqual([]);
  });

  it('TC-02: Alternative correct variant (double quotes, template literal, tags, setChecked, toBeEmpty, label) passes 100%', async () => {
    const data = await runM10(alternativeCorrect);
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(getFailedRuleNumbers(data)).toEqual([]);
  });

  it('TC-03: Local variant with test.use({ baseURL: http://localhost:3000 }) passes 100%', async () => {
    const data = await runM10(localCorrect);
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(getFailedRuleNumbers(data)).toEqual([]);
  });

  // --- Starter code ---
  it('TC-04: Starter code fails rules 2–10 (only rule 1 passes)', async () => {
    const data = await runM10(starterCode);
    expect(data.status).toBe('fail');
    expect(data.score).toBe(10);
    expect(getFailedRuleNumbers(data)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  // --- All 9 wrong variants from Appendix Section 6 ---
  it('TC-05: Forgotten page.pause() in test fails exactly rule 10 with Inspector Hygiene diagnostic', async () => {
    const code = refSolution.replace(
      "await bifa.check();",
      "await page.pause();\n    await bifa.check();"
    );
    const data = await runM10(code);
    expect(getFailedRuleNumbers(data)).toEqual([10]);
    expect(data.feedback[9].message).toContain('page.pause()');
  });

  it('TC-06: click() on checkbox-task-1 instead of check()/uncheck() fails exactly rule 7 with diagnostic', async () => {
    const code = refSolution
      .replace('await bifa.check();', 'await bifa.click();')
      .replace('await bifa.uncheck();', 'await bifa.click();');
    const data = await runM10(code);
    expect(getFailedRuleNumbers(data)).toEqual([7]);
    expect(data.feedback[6].message).toContain('.click()');
  });

  it('TC-07: expect(await ...isDisabled()) instead of toBeDisabled() fails exactly rules 4 and 10', async () => {
    const code = refSolution.replace(
      'await expect(salveaza).toBeDisabled();',
      'expect(await salveaza.isDisabled()).toBe(true);'
    );
    const data = await runM10(code);
    expect(getFailedRuleNumbers(data)).toEqual([4, 10]);
    expect(data.feedback[3].message).toContain('isDisabled');
    expect(data.feedback[9].message).toContain('expect(await');
  });

  it('TC-08: Absolute URL in page.goto(...) fails exactly rules 3 and 10', async () => {
    const code = refSolution.replace(
      "await page.goto('/');",
      "await page.goto('https://tasktracker.qualiadept.eu/');"
    );
    const data = await runM10(code);
    expect(getFailedRuleNumbers(data)).toEqual([3, 10]);
    expect(data.feedback[2].message).toContain('URL absolut');
    expect(data.feedback[9].message).toContain('URL absolut');
  });

  it('TC-09: waitForTimeout + force: true instead of addLocatorHandler fails exactly rules 3 and 10', async () => {
    const code = refSolution
      .replace(
        `    const promo = page.getByTestId('close-promo-btn');
    await page.addLocatorHandler(promo, async (buton) => {
      await buton.click();
    });`,
        '    await page.waitForTimeout(3000);'
      )
      .replace('await salveaza.click();', 'await salveaza.click({ force: true });');
    const data = await runM10(code);
    expect(getFailedRuleNumbers(data)).toEqual([3, 10]);
  });

  it('TC-10: Only 2 tests (combining check and delete) fails exactly rule 9 with diagnostic', async () => {
    const code = refSolution.replace(
      `  });

  test('utilizatorul șterge primul task din listă', async ({ page }) => {`,
      ''
    );
    const data = await runM10(code);
    expect(getFailedRuleNumbers(data)).toEqual([9]);
    expect(data.feedback[8].message).toContain('doar 2 teste');
  });

  it('TC-11: Comment containing "page.pause()" fails exactly rule 10 (includeComments: true)', async () => {
    const code = `${refSolution}\n// Note: remember to remove page.pause() before commit`;
    const data = await runM10(code);
    expect(getFailedRuleNumbers(data)).toEqual([10]);
    expect(data.feedback[9].message).toContain('comentariu');
  });

  it('TC-12: Missing test.describe fails exactly rule 2', async () => {
    const code = refSolution
      .replace("test.describe('Task Tracker – fluxul complet scris manual (M10)', () => { // Cerința 2", '')
      .replace(/\n\}\);\n\/\/ Cerința 10/, '\n// Cerința 10');
    const data = await runM10(code);
    expect(getFailedRuleNumbers(data)).toEqual([2]);
  });

  it('TC-13: fill() on select-task-priority instead of selectOption() fails exactly rule 5 with diagnostic', async () => {
    const code = refSolution.replace(
      "await page.getByTestId('select-task-priority').selectOption('high');",
      "await page.getByTestId('select-task-priority').fill('high');"
    );
    const data = await runM10(code);
    expect(getFailedRuleNumbers(data)).toEqual([5]);
    expect(data.feedback[4].message).toContain('.fill()');
  });

  it('TC-14: English locale returns localized English rule names, success messages, and diagnostics', async () => {
    const passData = await runM10(refSolution, 'en');
    expect(passData.status).toBe('pass');
    expect(passData.feedback[0].check).toContain('Import test and expect from @playwright/test');
    expect(passData.feedback[9].message).toContain('Clean Code & Inspector Hygiene Policy fully respected');

    const failData = await runM10(`${refSolution}\n// page.pause()`, 'en');
    expect(getFailedRuleNumbers(failData)).toEqual([10]);
    expect(failData.feedback[9].message).toContain('Inspector Hygiene violated');
  });
});
