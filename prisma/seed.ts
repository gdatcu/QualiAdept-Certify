import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CurriculumItem {
  moduleNumber: number;
  title: string;
  description: string;
  validationType: 'STATIC' | 'DYNAMIC';
  isPublished: boolean;
  unlockDate: Date;
  validationRules: string;
}

const curriculum: CurriculumItem[] = [
  {
    moduleNumber: 0,
    title: 'Sesiunea 0: Pregătire & Practică Platformă (Sandbox)',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-08-01T00:00:00Z'),
    description:
      'Modul de acomodare cu platforma QualiAdept. Testează editorul Monaco, verifică aserțiunile automate în timp real și trimite primul tău layout HTML pentru a te familiariza cu fluxul de validare înainte de începerea cursului.',
    validationRules: JSON.stringify([
      { type: 'tag', value: 'main', message: 'Tag-ul semantic <main> este prezent.' },
      { type: 'attr', value: 'id="practice-section"', message: 'Elementul cu id="practice-section" este prezent.' },
      { type: 'attr', value: 'data-testid="submit-btn"', message: 'Butonul cu data-testid="submit-btn" este prezent.' },
    ]),
  },
  {
    moduleNumber: 1,
    title: 'Sesiunea 1: HTML & Structura DOM',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-09-17T00:00:00Z'),
    description:
      'Construiește structura HTML (Boilerplate) cu tag-uri semantice și atribute data-testid pentru Task Tracker.',
    validationRules: JSON.stringify([
      { type: 'tag', value: 'form', message: 'Form tag is missing' },
      { type: 'attr', value: 'data-testid', message: 'Test IDs are missing' },
    ]),
  },
  {
    moduleNumber: 2,
    title: 'Sesiunea 2: CSS & DOM Selectors',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-09-24T00:00:00Z'),
    description:
      'Transformă scheletul Task Tracker-ului într-o aplicație structurată cu fișier CSS extern, navbar flexibil, rânduri tabel structurate și butoane dinamice cu stare disabled.',
    validationRules: JSON.stringify([
      {
        file: 'index.html',
        name: '[index.html] Conectare style.css în <head>',
        selector: "head link[rel='stylesheet'], link[rel='stylesheet']",
        check: 'attributeRegex',
        attrName: 'href',
        pattern: '^(?:\\.\\/)?style\\.css$',
        message: 'Cerința 1 eșuată: Nu am găsit fișierul CSS extern conectat corect în <head> (ex: <link rel="stylesheet" href="style.css">).',
      },
      {
        file: 'index.html',
        name: '[index.html] Clasa navbar pe elementul <nav>',
        selector: 'header nav',
        check: 'hasClass',
        expected: 'navbar',
        message: "Cerința 2 eșuată: Tag-ul <nav> din <header> nu are clasa 'navbar'.",
      },
      {
        file: 'index.html',
        name: '[index.html] Element logo (#logo) în navbar',
        selector: 'header nav #logo, nav #logo',
        check: 'exists',
        message: "Cerința 2 eșuată: Nu am găsit un element cu id-ul 'logo' în interiorul barei de navigație.",
      },
      {
        file: 'index.html',
        name: '[index.html] Buton login cu data-testid="btn-login"',
        selector: "header nav [data-testid='btn-login'], nav [data-testid='btn-login']",
        check: 'exists',
        message: "Cerința 2 eșuată: Lipsește butonul de login cu data-testid='btn-login' din bara de navigație.",
      },
      {
        file: 'index.html',
        name: '[index.html] Buton cu clasa delete-row în rândul 3',
        selector: 'table tbody tr:nth-child(3) button',
        check: 'hasClass',
        expected: 'delete-row',
        message: "Cerința 3 eșuată: Al treilea rând din corpul tabelului nu conține un buton cu clasa 'delete-row'.",
      },
      {
        file: 'index.html',
        name: '[index.html] Buton submit cu atributul disabled',
        selector: "button[data-testid='submit-task-btn'], [data-testid='submit-task-btn']",
        check: 'hasAttribute',
        attrName: 'disabled',
        message: "Cerința 4 eșuată: Butonul de submit (data-testid='submit-task-btn') nu are atributul 'disabled' aplicat nativ.",
      },
      {
        file: 'style.css',
        name: '[style.css] Stilizare Flexbox pentru .navbar',
        check: 'regex',
        pattern: '\\.navbar\\s*\\{[^}]*display\\s*:\\s*flex',
        message: "Cerința 2 CSS eșuată: Clasa '.navbar' din style.css trebuie să folosească 'display: flex'.",
      },
      {
        file: 'style.css',
        name: '[style.css] Selector structural tr:nth-child(3)',
        check: 'regex',
        pattern: 'tr:nth-child\\(3\\)\\s*\\{[^}]*[a-zA-Z\\-]+\\s*:',
        message: "Cerința 3 CSS eșuată: În style.css trebuie definit selectorul structural 'tr:nth-child(3)' cu reguli de stilizare.",
      },
      {
        file: 'style.css',
        name: '[style.css] Stare hover pentru butoane (:hover)',
        check: 'regex',
        pattern: '(?:button:not\\(:disabled\\):hover|button:hover)\\s*\\{[^}]*[a-zA-Z\\-]+\\s*:',
        message: "Cerința 4 CSS eșuată: În style.css trebuie definită starea de hover pentru butoane (ex: button:not(:disabled):hover) cu proprietăți de stil.",
      },
      {
        file: 'style.css',
        name: '[style.css] Stare disabled pentru butoane (:disabled)',
        check: 'regex',
        pattern: '(?:button:disabled|:disabled)\\s*\\{[^}]*[a-zA-Z\\-]+\\s*:',
        message: "Cerința 4 CSS eșuată: În style.css trebuie definită starea pentru butoane dezactivate (ex: button:disabled) cu proprietăți de stil.",
      },
    ]),
  },
  {
    moduleNumber: 3,
    title: 'Sesiunea 3: JavaScript Basics',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-10-08T00:00:00Z'),
    description: 'Variabile, tipuri de date și Arrow Functions.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'const|let|=>', message: 'Folosește ES6 syntax (const/let/arrow)' },
    ]),
  },
  {
    moduleNumber: 4,
    title: 'Sesiunea 4: JS DOM Manipulation',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-10-15T00:00:00Z'),
    description: 'Ascultători de evenimente (addEventListener) și adăugarea elementelor în DOM.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'addEventListener', message: 'Trebuie să interceptezi evenimentele' },
    ]),
  },
  {
    moduleNumber: 5,
    title: 'Sesiunea 5: JS Asincron (Promises & Fetch)',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-10-22T00:00:00Z'),
    description: 'Conceptul de Event Loop. Comunicarea client-server folosind Fetch API.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'async|await|fetch', message: 'Codul asincron lipsește' },
    ]),
  },
  {
    moduleNumber: 6,
    title: 'Sesiunea 6: Kanban Workshop',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2026-10-29T00:00:00Z'),
    description:
      'Finalizează logica panoului Kanban. Această aplicație va fi subiectul testelor noastre E2E.',
    validationRules: JSON.stringify([]),
  },
  {
    moduleNumber: 7,
    title: 'Sesiunea 7: Trecerea la TypeScript',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-11-05T00:00:00Z'),
    description: 'Tipizarea statică, primitive, any, void și tsconfig.json.',
    validationRules: JSON.stringify([
      { type: 'regex', value: ':\\s*(string|number|void)', message: 'Adaugă tipuri explicite TypeScript' },
    ]),
  },
  {
    moduleNumber: 8,
    title: 'Sesiunea 8: Interfețe și Clase TS',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-11-12T00:00:00Z'),
    description: 'Structuri avansate în TS. Refactorizează codul folosind Interfețe și OOP.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'interface|class', message: 'Definește interfețele pentru Task-uri' },
    ]),
  },
  {
    moduleNumber: 9,
    title: 'Sesiunea 9: Playwright Setup & Codegen',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-11-19T00:00:00Z'),
    description: 'Configurare playwright.config.ts și generarea primului test via CLI.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'test\\(|import.*test', message: 'Structura testului Playwright lipsește' },
    ]),
  },
  {
    moduleNumber: 10,
    title: 'Sesiunea 10: Primul Test E2E Manual',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2026-11-26T00:00:00Z'),
    description: 'Scrie acțiuni de bază: page.goto, fill, click, select.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'page\\.(goto|fill|click)', message: 'Folosește metodele page' },
    ]),
  },
  {
    moduleNumber: 11,
    title: 'Sesiunea 11: Filosofia Localizatorilor',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-12-03T00:00:00Z'),
    description: 'Evită selectoarele fragile. Folosește getByRole, getByText, getByTestId.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'getByRole|getByTestId', message: 'Aplică noile strategii de localizare' },
    ]),
  },
  {
    moduleNumber: 12,
    title: 'Sesiunea 12: Web-First Assertions',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2026-12-10T00:00:00Z'),
    description:
      "Manipulează validările de stare cu funcția 'expect'. Asertări pentru vizibilitate și conținut.",
    validationRules: JSON.stringify([
      { type: 'regex', value: 'expect\\(.*\\)\\.to', message: 'Lipsesc asertările web-first' },
    ]),
  },
  {
    moduleNumber: 13,
    title: 'Sesiunea 13: Page Object Model (POM)',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2026-12-17T00:00:00Z'),
    description:
      'Structurarea framework-ului pentru scalabilitate. Creează clase de pagină în TypeScript.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'class.*Page', message: 'Trebuie să exporți o clasă pentru pagină' },
    ]),
  },
  {
    moduleNumber: 14,
    title: 'Sesiunea 14: Custom Fixtures & Data-Driven',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2027-01-07T00:00:00Z'),
    description: 'Construiește fixtures și rulează teste folosind parametri din JSON.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'test\\.extend', message: 'Extinde testele folosind fixtures' },
    ]),
  },
  {
    moduleNumber: 15,
    title: 'Sesiunea 15: Global Auth State',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2027-01-14T00:00:00Z'),
    description: 'Salvează sesiunea (storageState) pentru autentificare unică și rapidă.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'storageState', message: 'Lipseste definirea storageState' },
    ]),
  },
  {
    moduleNumber: 16,
    title: 'Sesiunea 16: API Mocking',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2027-01-21T00:00:00Z'),
    description: 'Interceptarea rețelei. Testează interfața simulând erori de backend 500.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'page\\.route', message: 'Trebuie să folosești page.route pentru mocking' },
    ]),
  },
  {
    moduleNumber: 17,
    title: 'Sesiunea 17: Reports & Debugging',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2027-01-28T00:00:00Z'),
    description: 'Configurarea Trace Viewer, video la eșec și retry-uri pentru flaky tests.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'trace:|retries:', message: 'Configurațiile pentru debug sunt incomplete' },
    ]),
  },
  {
    moduleNumber: 18,
    title: 'Sesiunea 18: Git & GitHub Actions (YAML)',
    validationType: 'STATIC',
    isPublished: true,
    unlockDate: new Date('2027-02-04T00:00:00Z'),
    description: 'Scrierea pipeline-ului CI/CD. Sintaxa YAML și declanșatori (on: push).',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'on:\\s*push|jobs:', message: 'Sintaxa fișierului workflow este incorectă' },
    ]),
  },
  {
    moduleNumber: 19,
    title: 'Sesiunea 19: CI/CD Pipeline Execution',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2027-02-11T00:00:00Z'),
    description: 'Rulează containere Ubuntu headless și validează integrarea continuă.',
    validationRules: JSON.stringify([
      { type: 'regex', value: 'runs-on:|npx playwright', message: 'Lipsește comanda de execuție a testelor' },
    ]),
  },
  {
    moduleNumber: 20,
    title: 'Sesiunea 20: Final Demo Day & Review',
    validationType: 'DYNAMIC',
    isPublished: true,
    unlockDate: new Date('2027-02-18T00:00:00Z'),
    description: 'Rularea suitei finale și obținerea scorului maxim pentru certificare.',
    validationRules: JSON.stringify([]),
  },
];

async function main() {
  console.log('🌱 Starting database seed (Deterministic Stable IDs)...');

  console.log('📚 Upserting 20-week curriculum modules into database...');

  for (const item of curriculum) {
    const assignmentId = `00000000-0000-0000-0000-${item.moduleNumber.toString().padStart(12, '0')}`;
    const upsertedAssignment = await prisma.assignment.upsert({
      where: { id: assignmentId },
      update: {
        module: item.moduleNumber,
        title: item.title,
        description: item.description,
        validationType: item.validationType,
        isPublished: item.isPublished,
        isActive: true,
        unlockDate: item.unlockDate,
        validationRules: item.validationRules,
      },
      create: {
        id: assignmentId,
        module: item.moduleNumber,
        title: item.title,
        description: item.description,
        validationType: item.validationType,
        isPublished: item.isPublished,
        isActive: true,
        unlockDate: item.unlockDate,
        validationRules: item.validationRules,
      },
    });

    console.log(
      `   [✓] Module ${upsertedAssignment.module.toString().padStart(2, ' ')}: "${upsertedAssignment.title}" (${upsertedAssignment.validationType}) - ID: ${upsertedAssignment.id}`
    );
  }

  console.log('✨ Curriculum upserted successfully: 21 Modules synchronized.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
