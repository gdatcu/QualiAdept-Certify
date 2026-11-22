import { describe, it, expect } from 'vitest';
import {
  getModuleFiles,
  parseInitialFiles,
  getAssignmentCurriculumTask,
  getNextModuleBannerMessage,
  getWorkspaceFileIcon,
  stripFilePrefix,
  localizeFeedbackItems,
  getWorkspaceTranslations,
  CURRICULUM_TASKS,
  transpileTsForPreview,
} from '@/app/[locale]/assignment/[id]/AssignmentWorkspace';

describe('Workspace Multi-File Configuration Tests', () => {
  it('returns single HTML file for Module 0 Sandbox', () => {
    const files = getModuleFiles(0, 'STATIC');
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('index.html');
    expect(files[0].language).toBe('html');
  });

  it('returns single HTML file for Module 1 HTML Basics', () => {
    const files = getModuleFiles(1, 'STATIC');
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('index.html');
    expect(files[0].language).toBe('html');
  });

  it('returns HTML and CSS files for Module 2 CSS & DOM Selectors', () => {
    const files = getModuleFiles(2, 'STATIC');
    expect(files).toHaveLength(2);
    expect(files.map((f) => f.name)).toEqual(['index.html', 'style.css']);
    expect(files.find((f) => f.name === 'style.css')?.language).toBe('css');
  });

  it('returns HTML, CSS, and JS files for Module 3 JavaScript Basics', () => {
    const files = getModuleFiles(3, 'STATIC');
    expect(files).toHaveLength(3);
    expect(files.map((f) => f.name)).toEqual(['index.html', 'style.css', 'app.js']);
    expect(files.find((f) => f.name === 'app.js')?.language).toBe('javascript');
  });

  it('returns HTML, CSS, and TS (app.ts) files for Module 7 TypeScript Basics', () => {
    const files = getModuleFiles(7, 'STATIC');
    expect(files).toHaveLength(3);
    expect(files.map((f) => f.name)).toEqual(['index.html', 'style.css', 'app.ts']);
    expect(files.find((f) => f.name === 'app.ts')?.language).toBe('typescript');
  });

  it('returns e2e.spec.ts for DYNAMIC validation modules', () => {
    const files = getModuleFiles(6, 'DYNAMIC');
    expect(files).toHaveLength(1);
    expect(files[0].name).toBe('e2e.spec.ts');
    expect(files[0].language).toBe('typescript');
  });

  it('correctly parses multi-file JSON payload without losing files', () => {
    const payload = JSON.stringify({
      files: {
        'index.html': '<h1>Student HTML</h1>',
        'style.css': '.navbar { color: red; }',
      },
    });
    const parsed = parseInitialFiles(payload, 2, 'STATIC');
    expect(parsed['index.html']).toBe('<h1>Student HTML</h1>');
    expect(parsed['style.css']).toBe('.navbar { color: red; }');
  });

  it('self-heals index.html if it was accidentally overwritten with CSS while preserving student CSS', () => {
    const corruptedPayload = JSON.stringify({
      files: {
        'index.html': '/* Sesiunea 2: CSS */\n.navbar { display: flex; }',
        'style.css': '/* Sesiunea 2: CSS */\n.navbar { display: flex; }',
      },
    });
    const parsed = parseInitialFiles(corruptedPayload, 2, 'STATIC');
    expect(parsed['index.html']).toContain('<html');
    expect(parsed['index.html']).toContain('Task Tracker');
    expect(parsed['style.css']).toBe('/* Sesiunea 2: CSS */\n.navbar { display: flex; }');
  });

  it('correctly handles legacy single file HTML submissions', () => {
    const legacyHtml = '<main id="task-tracker">Legacy Content</main>';
    const parsed = parseInitialFiles(legacyHtml, 1, 'STATIC');
    expect(parsed['index.html']).toBe(legacyHtml);
  });

  it('inherits index.html, style.css, and app.js from Module 3 into Module 4', () => {
    const prevModule3Payload = JSON.stringify({
      files: {
        'index.html': '<html><body><script src="app.js"></script></body></html>',
        'style.css': '.navbar { display: flex; }',
        'app.js': 'const listaTaskuri = [{ id: 1001, nume: "Task 1", completat: true }];',
      },
    });

    const parsed = parseInitialFiles(null, 4, 'STATIC', null, prevModule3Payload);

    expect(parsed['index.html']).toBe('<html><body><script src="app.js"></script></body></html>');
    expect(parsed['style.css']).toBe('.navbar { display: flex; }');
    expect(parsed['app.js']).toContain('const listaTaskuri = [{ id: 1001, nume: "Task 1", completat: true }];');
    expect(parsed['app.js']).toContain('Sesiunea 4: JS DOM Manipulation');
  });

  it('restores inherited app.js if saved submission was just untouched starter scaffold', () => {
    const prevModule3Payload = JSON.stringify({
      files: {
        'index.html': '<html><body><script src="app.js"></script></body></html>',
        'style.css': '.navbar { display: flex; }',
        'app.js': 'const listaTaskuri = [{ id: 1001, nume: "Task 1", completat: true }];',
      },
    });

    // Untouched starter scaffold saved in Module 4
    const untouchedModule4Submission = JSON.stringify({
      files: {
        'index.html': '<html><body><script src="app.js"></script></body></html>',
        'style.css': '.navbar { display: flex; }',
        'app.js': `// ============================================================
// Sesiunea 4: JS DOM Manipulation (Task Tracker)
// ============================================================
// Cerințe Tehnice:
// 1. Selectare elemente DOM: formular (#add-task-form), input (#task-name), tbody.
// 2. Ascultător de eveniment 'submit' pe formular cu preventDefault().
// 3. Creare dinamică rând nou (document.createElement('tr')).
// 4. Structura rândului: celule <td> cu numele task-ului și buton cu clasa 'delete-row'.
// 5. Inserare în DOM folosind appendChild() sau append().
// 6. Resetare valoare câmp input (input.value = '').
// 7. Ștergere dinamică din DOM cu .remove() la click pe butonul 'delete-row'.
// ============================================================

// 1. Selectare elemente DOM


// 2. Ascultător eveniment 'submit' și adăugare dinamică în tabel


// 3. Ștergere dinamică din DOM (Event Delegation pe document sau click pe buton)

`,
      },
    });

    const parsed = parseInitialFiles(untouchedModule4Submission, 4, 'STATIC', null, prevModule3Payload);

    expect(parsed['app.js']).toContain('const listaTaskuri = [{ id: 1001, nume: "Task 1", completat: true }];');
    expect(parsed['app.js']).toContain('Sesiunea 4: JS DOM Manipulation');
  });

  it('inherits index.html, style.css, and app.js from Module 4 into Module 5, injecting active-tasks-list', () => {
    const prevModule4Payload = JSON.stringify({
      files: {
        'index.html':
          '<html><body><main><section class="task-history-section"><table></table></section></main><script src="app.js"></script></body></html>',
        'style.css': '.navbar { display: flex; }',
        'app.js':
          'const listaTaskuri = [{ id: 1001, nume: "Task 1", completat: true }];\nconst form = document.querySelector("#add-task-form");',
      },
    });

    const parsed = parseInitialFiles(null, 5, 'STATIC', null, prevModule4Payload);

    expect(parsed['index.html']).toContain('<ul id="active-tasks-list"></ul>');
    expect(parsed['style.css']).toBe('.navbar { display: flex; }');
    expect(parsed['app.js']).toContain('const listaTaskuri = [{ id: 1001, nume: "Task 1", completat: true }];');
    expect(parsed['app.js']).toContain('const form = document.querySelector("#add-task-form");');
    expect(parsed['app.js']).toContain('Sesiunea 5: JS Asincron (Fetch API & Task-uri Active)');
  });

  it('restores inherited app.js in Module 5 if saved submission was just untouched starter scaffold', () => {
    const prevModule4Payload = JSON.stringify({
      files: {
        'index.html': '<html><body><main><ul id="active-tasks-list"></ul></main></body></html>',
        'style.css': '.navbar { display: flex; }',
        'app.js': 'const listaTaskuri = [{ id: 1001, nume: "Task 1", completat: true }];',
      },
    });

    const untouchedModule5Submission = JSON.stringify({
      files: {
        'index.html': '<html><body><main><ul id="active-tasks-list"></ul></main></body></html>',
        'style.css': '.navbar { display: flex; }',
        'app.js': `// ============================================================
// Sesiunea 5: JS Asincron (Fetch API & Task-uri Active)
// ============================================================
// Cerințe Tehnice:
// 1. Declară o Arrow Function asincronă:
//    const incarcaTaskuriInitiale = async () => { ... };
// 2. În interiorul funcției, apelează:
//    const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
// 3. Despachetează răspunsul: const taskuri = await response.json();
// 4. Selectează lista din HTML: const activeTasksList = document.querySelector('#active-tasks-list');
// 5. Iterează prin taskuri (cu forEach sau for):
//    - Creează dinamic un element <li> (document.createElement('li')).
//    - Setează textul cu titlul task-ului (li.textContent = task.title).
//    - Adaugă elementul în listă (activeTasksList.appendChild(li)).
// 6. Apelează funcția la finalul fișierului: incarcaTaskuriInitiale();
// ============================================================

// Adaugă aici funcția asincronă incarcaTaskuriInitiale și apelarea ei:

`,
      },
    });

    const parsed = parseInitialFiles(untouchedModule5Submission, 5, 'STATIC', null, prevModule4Payload);

    expect(parsed['app.js']).toContain('const listaTaskuri = [{ id: 1001, nume: "Task 1", completat: true }];');
    expect(parsed['app.js']).toContain('Sesiunea 5: JS Asincron (Fetch API & Task-uri Active)');
  });

  it('inherits index.html, style.css, and app.js from Module 5 into Module 6', () => {
    const prevModule5Payload = JSON.stringify({
      files: {
        'index.html':
          '<html><body><main><form id="add-task-form"><input type="text" id="task-name"><button type="submit" id="submit-btn">Adauga</button></form><ul id="active-tasks-list"></ul></main><script src="app.js"></script></body></html>',
        'style.css': '.navbar { display: flex; }',
        'app.js':
          'const incarcaTaskuriInitiale = async () => { const res = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=5"); };\nincarcaTaskuriInitiale();',
      },
    });

    const parsed = parseInitialFiles(null, 6, 'STATIC', null, prevModule5Payload);

    expect(parsed['index.html']).toContain('<div id="loading-spinner" class="spinner">');
    expect(parsed['index.html']).toContain('id="task-list"');
    expect(parsed['style.css']).toContain('.navbar { display: flex; }');
    expect(parsed['app.js']).toContain('incarcaTaskuriInitiale');
    expect(parsed['app.js']).toContain('Sesiunea 6: Livrarea Proiectului "Task Tracker" (Capstone)');
  });

  it('ensures default starter files for Module 6 without inheritance do not pre-solve assertions', () => {
    const parsed = parseInitialFiles(null, 6, 'STATIC');

    // Should not have pre-solved QA test-ids in HTML
    expect(parsed['index.html']).not.toContain('data-testid="input-task-name"');
    expect(parsed['index.html']).not.toContain('data-testid="submit-task-btn"');
    expect(parsed['index.html']).not.toContain('data-testid="error-message"');
    expect(parsed['index.html']).not.toContain('data-testid="task-list"');

    // Should not have .completed CSS rule defined in style.css
    expect(parsed['style.css']).not.toContain('.completed {');
    expect(parsed['style.css']).not.toContain('text-decoration: line-through;');

    // Should not have pre-solved delete button data-testid in JS
    expect(parsed['app.js']).not.toContain('data-testid="delete-btn-');
    expect(parsed['app.js']).not.toContain('data-testid="close-promo-btn"');
  });

  describe('Dynamic Curriculum Task & Acceptance Criteria Checklist', () => {
    it('defines curriculum tasks for all core modules (0-6)', () => {
      expect(Object.keys(CURRICULUM_TASKS).length).toBeGreaterThanOrEqual(7);
      [0, 1, 2, 3, 4, 5, 6].forEach((mod) => {
        expect(CURRICULUM_TASKS[mod]).toBeDefined();
        expect(CURRICULUM_TASKS[mod].criteria.length).toBeGreaterThan(0);
      });
    });

    it('returns exact Business Task and acceptance criteria for Module 1', () => {
      const task = getAssignmentCurriculumTask({
        id: 'mod1',
        title: 'Session 1',
        description: 'Default desc',
        module: 1,
        validationType: 'STATIC',
      });

      expect(task.businessTask).toContain('Login și Înregistrare');
      expect(task.criteria.length).toBeGreaterThanOrEqual(5);
      const fileNames = task.criteria.map((c) => c.file);
      expect(fileNames.every((f) => f === 'index.html')).toBe(true);
      expect(task.criteria.some((c) => c.title.includes('login-email'))).toBe(true);
      expect(task.criteria.some((c) => c.title.includes('btn-submit-login'))).toBe(true);
    });

    it('returns multi-file criteria for Module 2 including CSS', () => {
      const task = getAssignmentCurriculumTask({
        id: 'mod2',
        title: 'Session 2',
        description: 'Default desc',
        module: 2,
        validationType: 'STATIC',
      });

      expect(task.businessTask).toContain('Task Tracker-ului');
      const cssCriteria = task.criteria.filter((c) => c.file === 'style.css');
      const htmlCriteria = task.criteria.filter((c) => c.file === 'index.html');
      expect(cssCriteria.length).toBeGreaterThanOrEqual(4);
      expect(htmlCriteria.length).toBeGreaterThanOrEqual(5);
      expect(task.criteria.some((c) => c.title.includes('tr:nth-child(3)'))).toBe(true);
      expect(task.criteria.some((c) => c.title.includes('disabled'))).toBe(true);
    });

    it('returns multi-file criteria for Module 3, 4, 5, and 6 including JS', () => {
      [3, 4, 5, 6].forEach((modNum) => {
        const task = getAssignmentCurriculumTask({
          id: `mod${modNum}`,
          title: `Session ${modNum}`,
          description: 'Default desc',
          module: modNum,
          validationType: 'STATIC',
        });

        expect(task.businessTask.length).toBeGreaterThan(20);
        const jsCriteria = task.criteria.filter((c) => c.file === 'app.js');
        expect(jsCriteria.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('falls back to parsing validationRules JSON for custom or unknown modules', () => {
      const customRules = JSON.stringify([
        {
          file: 'custom.ts',
          name: 'Custom rule check',
          message: 'Expected custom logic',
        },
      ]);

      const task = getAssignmentCurriculumTask({
        id: 'mod99',
        title: 'Session 99',
        description: 'Custom module description',
        module: 99,
        validationType: 'STATIC',
        validationRules: customRules,
      });

      expect(task.businessTask).toBe('Custom module description');
      expect(task.criteria).toHaveLength(1);
      expect(task.criteria[0].file).toBe('custom.ts');
      expect(task.criteria[0].title).toBe('Custom rule check');
      expect(task.criteria[0].detail).toBe('Expected custom logic');
    });

    it('returns exact Business Task and 11 acceptance criteria for Module 7 TypeScript', () => {
      const task = getAssignmentCurriculumTask({
        id: 'mod7',
        title: 'Session 7',
        description: 'Default desc',
        module: 7,
        validationType: 'STATIC',
      });

      expect(task.businessTask).toContain('TypeScript');
      expect(task.criteria).toHaveLength(11);
      const tsCriteria = task.criteria.filter((c) => c.file === 'app.ts');
      const htmlCriteria = task.criteria.filter((c) => c.file === 'index.html');
      expect(tsCriteria).toHaveLength(10);
      expect(htmlCriteria).toHaveLength(1);
      expect(task.criteria.some((c) => c.title.includes('Zero Any Policy'))).toBe(true);
      expect(task.criteria.some((c) => c.title.includes('TaskStatus'))).toBe(true);
      expect(task.criteria.some((c) => c.title.includes('TaskItem'))).toBe(true);
    });

    it('configures pom.ts for Module 8 without inheriting legacy Task Tracker HTML/CSS/TS files', () => {
      const files = getModuleFiles(8, 'STATIC');
      expect(files).toHaveLength(1);
      expect(files[0].name).toBe('pom.ts');
      expect(files[0].language).toBe('typescript');

      const prevModule7Payload = JSON.stringify({
        files: {
          'index.html': '<html><body><script src="app.ts"></script></body></html>',
          'style.css': '.navbar { display: flex; }',
          'app.ts': 'const apiUrl: string = "https://example.com";',
        },
      });
      const parsed = parseInitialFiles(null, 8, 'STATIC', null, prevModule7Payload);
      expect(Object.keys(parsed)).toEqual(['pom.ts']);
      expect(parsed['pom.ts']).toContain('QA-Commerce');
      expect(parsed['index.html']).toBeUndefined();
      expect(parsed['app.ts']).toBeUndefined();
    });

    it('returns exact Business Task and 9 acceptance criteria for Module 8 TS OOP POM', () => {
      const taskRo = getAssignmentCurriculumTask({
        id: 'mod8',
        title: 'Session 8',
        description: 'Default desc',
        module: 8,
        validationType: 'STATIC',
      }, 'ro');

      expect(taskRo.businessTask).toContain('QA-Commerce');
      expect(taskRo.criteria).toHaveLength(9);
      expect(taskRo.criteria.every((c) => c.file === 'pom.ts')).toBe(true);
      expect(taskRo.criteria.some((c) => c.title.includes('Omit<Produs'))).toBe(true);
      expect(taskRo.notes).toContain('extrageDateDinPagina<T>');

      const taskEn = getAssignmentCurriculumTask({
        id: 'mod8',
        title: 'Session 8',
        description: 'Default desc',
        module: 8,
        validationType: 'STATIC',
      }, 'en');
      expect(taskEn.businessTask).toContain('Page Object Model');
      expect(taskEn.criteria).toHaveLength(9);
    });

    it('configures playwright.config.ts and task-tracker.spec.ts for Module 9 without inheriting legacy web app files', () => {
      const files = getModuleFiles(9, 'STATIC');
      expect(files).toHaveLength(2);
      expect(files.map((f) => f.name)).toEqual(['playwright.config.ts', 'task-tracker.spec.ts']);
      expect(files.every((f) => f.language === 'typescript')).toBe(true);

      const prevModule8Payload = JSON.stringify({
        files: {
          'index.html': '<html><body>Legacy HTML</body></html>',
          'pom.ts': 'abstract class BasePage {}',
        },
      });
      const parsed = parseInitialFiles(null, 9, 'STATIC', null, prevModule8Payload);
      expect(Object.keys(parsed)).toEqual(['playwright.config.ts', 'task-tracker.spec.ts']);
      expect(parsed['playwright.config.ts']).toContain("import { defineConfig } from '@playwright/test'");
      expect(parsed['task-tracker.spec.ts']).toContain("await page.waitForTimeout(3000)");
      expect(parsed['index.html']).toBeUndefined();
    });

    it('returns exact Business Task and 11 acceptance criteria for Module 9 Playwright Setup & Codegen', () => {
      const taskRo = getAssignmentCurriculumTask({
        id: 'mod9',
        title: 'Session 9',
        description: 'Default desc',
        module: 9,
        validationType: 'STATIC',
      }, 'ro');

      expect(taskRo.businessTask).toContain('Playwright');
      expect(taskRo.criteria).toHaveLength(11);
      expect(taskRo.criteria.filter((c) => c.file === 'playwright.config.ts')).toHaveLength(5);
      expect(taskRo.criteria.filter((c) => c.file === 'task-tracker.spec.ts')).toHaveLength(6);
      expect(taskRo.criteria.some((c) => c.title.includes('Zero Hard-Wait Policy'))).toBe(true);

      const taskEn = getAssignmentCurriculumTask({
        id: 'mod9',
        title: 'Session 9',
        description: 'Default desc',
        module: 9,
        validationType: 'STATIC',
      }, 'en');
      expect(taskEn.businessTask).toContain('Official Playwright automation framework');
      expect(taskEn.criteria).toHaveLength(11);
    });
  });

  describe('TypeScript Preview Transpiler', () => {
    it('strips TypeScript type annotations cleanly for preview iframe execution', () => {
      const tsCode = `
const apiUrl: string = 'https://jsonplaceholder.typicode.com/todos';
const maxTasksLimit: number = 5;
type TaskStatus = 'todo' | 'in-progress' | 'completed';
type TaskItem = { id: number; title: string; };
let listaTaskuri: TaskItem[] = [];
const form = document.querySelector('#form') as HTMLFormElement | null;
const afiseazaTask = (id: number): void => {
  console.log('Task ' + id);
};
`;
      const transpiled = transpileTsForPreview(tsCode);
      expect(transpiled).not.toContain(': string');
      expect(transpiled).not.toContain(': number');
      expect(transpiled).not.toContain(': void');
      expect(transpiled).not.toContain('TaskItem[]');
      expect(transpiled).not.toContain('type TaskStatus');
      expect(transpiled).not.toContain('type TaskItem');
      expect(transpiled).not.toContain('| null');
      expect(transpiled).not.toContain('as HTMLFormElement');
      expect(transpiled).toContain('apiUrl =');
      expect(transpiled).toContain('listaTaskuri = [];');
      expect(transpiled).toContain("const form = document.querySelector('#form');");
    });
  });

  describe('Smart Next-Module Unlock Banner (BUG-02)', () => {
    const fixedNow = new Date('2026-11-22T12:00:00Z');

    it('shows scheduled unlock date for students when next module has future unlockDate', () => {
      const msgRo = getNextModuleBannerMessage(
        { module: 10, isPublished: true, unlockDate: '2026-11-26T00:00:00Z' },
        false,
        'ro',
        fixedNow
      );
      expect(msgRo).toContain('Modulul 10');
      expect(msgRo).toContain('se va debloca automat');
      expect(msgRo).toContain('2026');

      const msgEn = getNextModuleBannerMessage(
        { module: 10, isPublished: true, unlockDate: '2026-11-26T00:00:00Z' },
        false,
        'en',
        fixedNow
      );
      expect(msgEn).toContain('Module 10');
      expect(msgEn).toContain('will automatically unlock');
    });

    it('informs Trainers that next module is accessible immediately while noting student unlock date', () => {
      const msgRo = getNextModuleBannerMessage(
        { module: 10, isPublished: true, unlockDate: '2026-11-26T00:00:00Z' },
        true,
        'ro',
        fixedNow
      );
      expect(msgRo).toContain('Modulul 10 este accesibil acum');
      expect(msgRo).toContain('acces Trainer');
    });

    it('shows unlocked now message when next module unlockDate has passed', () => {
      const msgEn = getNextModuleBannerMessage(
        { module: 9, isPublished: true, unlockDate: '2026-11-19T00:00:00Z' },
        false,
        'en',
        fixedNow
      );
      expect(msgEn).toBe('Module 09 is now unlocked on your Dashboard.');
    });

    it('shows coming soon for students when next module is unpublished', () => {
      const msgRo = getNextModuleBannerMessage(
        { module: 11, isPublished: false, unlockDate: null },
        false,
        'ro',
        fixedNow
      );
      expect(msgRo).toContain('va fi disponibil în curând');
    });

    it('shows final curriculum completion message when nextModule is null', () => {
      const msgEn = getNextModuleBannerMessage(null, false, 'en', fixedNow);
      expect(msgEn).toContain('final module');
    });
  });

  describe('Workspace i18n, Dynamic Feedback Localization & UI Consistency (BUG-05, BUG-06, BUG-07, BUG-11, BUG-12)', () => {
    it('returns clean RO and EN translations with zero broken {wt.*} placeholders (BUG-05 & BUG-07)', () => {
      for (const loc of ['ro', 'en'] as const) {
        const wt = getWorkspaceTranslations(loc);
        for (const [key, value] of Object.entries(wt)) {
          if (typeof value === 'string') {
            expect(value, `Broken placeholder in wt.${key} (${loc})`).not.toContain('{wt.');
          }
        }
        expect(wt.tsOopEngine.length).toBeGreaterThan(5);
      }

      expect(getWorkspaceTranslations('ro').partialNoticeSuffix).toContain('Trimite Proiectul spre Validare');
      expect(getWorkspaceTranslations('en').partialNoticeSuffix).toContain('Submit Project for Validation');
    });

    it('dynamically re-localizes feedback items across RO <-> EN using ruleIndex and diagnosticIndex (BUG-06)', () => {
      const rulesJson = JSON.stringify([
        {
          file: 'pom.ts',
          name: '[pom.ts] 1. Interfața de date Produs (id, nume, pret, inStoc)',
          name_en: '[pom.ts] 1. Data interface Produs (id, nume, pret, inStoc)',
          message: 'Cerința 1 eșuată',
          message_en: 'Requirement 1 failed',
          successMessage: 'Interfața Produs este definită corect.',
          successMessage_en: 'Interface Produs is properly defined.',
        },
        {
          file: 'pom.ts',
          name: '[pom.ts] 7. Clasa HomePage extends BasePage (#search-bar privat + valideazaIncarcarea)',
          name_en: '[pom.ts] 7. HomePage extends BasePage (private #search-bar + valideazaIncarcarea)',
          message: 'Cerința 7 eșuată',
          message_en: 'Requirement 7 failed',
          successMessage: 'HomePage OK',
          successMessage_en: 'HomePage OK EN',
          diagnostics: [
            {
              pattern: 'public',
              message: 'Selectorul #search-bar din HomePage este declarat public — trebuie declarat private.',
              message_en: 'Selector #search-bar in HomePage is declared public — it must be declared private.',
            },
          ],
        },
      ]);

      // Submitted while on EN locale, now viewing on RO locale
      const enFeedback = [
        {
          check: '[pom.ts] 1. Data interface Produs (id, nume, pret, inStoc)',
          passed: true,
          message: 'Interface Produs is properly defined.',
          file: 'pom.ts',
          ruleIndex: 0,
        },
        {
          check: '[pom.ts] 7. HomePage extends BasePage (private #search-bar + valideazaIncarcarea)',
          passed: false,
          message: 'Selector #search-bar in HomePage is declared public — it must be declared private.',
          file: 'pom.ts',
          ruleIndex: 1,
          diagnosticIndex: 0,
        },
      ];

      const localizedToRo = localizeFeedbackItems(enFeedback, rulesJson, 'ro');
      expect(localizedToRo[0].check).toBe('[pom.ts] 1. Interfața de date Produs (id, nume, pret, inStoc)');
      expect(localizedToRo[0].message).toBe('Interfața Produs este definită corect.');
      expect(localizedToRo[1].check).toBe(
        '[pom.ts] 7. Clasa HomePage extends BasePage (#search-bar privat + valideazaIncarcarea)'
      );
      expect(localizedToRo[1].message).toBe(
        'Selectorul #search-bar din HomePage este declarat public — trebuie declarat private.'
      );

      // Legacy submission (no ruleIndex / no diagnosticIndex) switched from RO -> EN
      const legacyRoFeedback = [
        {
          check: '[pom.ts] 1. Interfața de date Produs (id, nume, pret, inStoc)',
          passed: true,
          message: 'Interfața Produs este definită corect.',
          file: 'pom.ts',
        },
        {
          check: '[pom.ts] 7. Clasa HomePage extends BasePage (#search-bar privat + valideazaIncarcarea)',
          passed: false,
          message: 'Selectorul #search-bar din HomePage este declarat public — trebuie declarat private.',
          file: 'pom.ts',
        },
      ];

      const localizedToEn = localizeFeedbackItems(legacyRoFeedback, rulesJson, 'en');
      expect(localizedToEn[0].check).toBe('[pom.ts] 1. Data interface Produs (id, nume, pret, inStoc)');
      expect(localizedToEn[0].message).toBe('Interface Produs is properly defined.');
      expect(localizedToEn[1].message).toBe(
        'Selector #search-bar in HomePage is declared public — it must be declared private.'
      );
    });

    it('returns consistent semantic file icons across editor, guide, and results (BUG-11)', () => {
      expect(getWorkspaceFileIcon('playwright.config.ts')).toBe('⚙️');
      expect(getWorkspaceFileIcon('task-tracker.spec.ts')).toBe('🎭');
      expect(getWorkspaceFileIcon('pom.ts')).toBe('🔷');
      expect(getWorkspaceFileIcon('style.css')).toBe('🎨');
      expect(getWorkspaceFileIcon('app.js')).toBe('📜');
      expect(getWorkspaceFileIcon('index.html')).toBe('🌐');
    });

    it('strips [fileName] prefix cleanly and keeps M08/M09 criteria titles aligned (BUG-12)', () => {
      expect(stripFilePrefix('[pom.ts] 4. Constructor protejat în BasePage (protected page)', 'pom.ts')).toBe(
        '4. Constructor protejat în BasePage (protected page)'
      );
      expect(stripFilePrefix('[playwright.config.ts] 1. Export defineConfig (TypeScript Config)')).toBe(
        '1. Export defineConfig (TypeScript Config)'
      );

      expect(CURRICULUM_TASKS[8].criteria).toHaveLength(9);
      expect(CURRICULUM_TASKS[8].criteria[3].title).toBe('4. Constructor protejat în BasePage (protected page)');
      expect(CURRICULUM_TASKS[9].criteria).toHaveLength(11);
      expect(CURRICULUM_TASKS[9].criteria[0].title).toBe(
        '1. Importă defineConfig și devices din @playwright/test'
      );
    });
  });
});
