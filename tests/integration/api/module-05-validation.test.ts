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

const module5Rules = JSON.stringify([
  {
    file: 'index.html',
    name: '[index.html] Elementul listă #active-tasks-list',
    name_en: '[index.html] Main list element #active-tasks-list',
    selector: '#active-tasks-list, ul#active-tasks-list, ol#active-tasks-list',
    check: 'exists',
    message:
      'Cerința eșuată: Nu am găsit lista principală în index.html (ex: <ul id="active-tasks-list"></ul>).',
    message_en:
      'Requirement failed: Main list element was not found in index.html (e.g. <ul id="active-tasks-list"></ul>).',
    successMessage: 'Lista #active-tasks-list este prezentă în index.html.',
    successMessage_en: 'The #active-tasks-list element is present in index.html.',
  },
  {
    file: 'app.js',
    name: '[app.js] Declarare Arrow Function asincronă incarcaTaskuriInitiale',
    name_en: '[app.js] Async Arrow Function declaration incarcaTaskuriInitiale',
    check: 'regex',
    pattern: '(?:const|let|var)?\\s*incarcaTaskuriInitiale\\s*=\\s*async\\s*\\(?\\s*\\)?\\s*=>',
    message:
      'Cerința 1 eșuată: Declară o Arrow Function asincronă numită incarcaTaskuriInitiale = async () => { ... }.',
    message_en:
      'Requirement 1 failed: Declare an asynchronous arrow function named incarcaTaskuriInitiale = async () => { ... }.',
    successMessage: 'Funcția asincronă incarcaTaskuriInitiale este definită corect ca Arrow Function.',
    successMessage_en: 'Asynchronous function incarcaTaskuriInitiale is correctly defined as an Arrow Function.',
  },
  {
    file: 'app.js',
    name: '[app.js] Apel Fetch API către JSONPlaceholder (_limit=5)',
    name_en: '[app.js] Fetch API call to JSONPlaceholder (_limit=5)',
    check: 'regex',
    pattern: 'await\\s+fetch\\s*\\(\\s*[\'"`]https:\\/\\/jsonplaceholder\\.typicode\\.com\\/todos\\?_limit=5[\'"`]\\s*\\)',
    message:
      'Cerința 2 eșuată: Folosește await fetch(\'https://jsonplaceholder.typicode.com/todos?_limit=5\') pentru a descărca cele 5 task-uri de test.',
    message_en:
      'Requirement 2 failed: Use await fetch(\'https://jsonplaceholder.typicode.com/todos?_limit=5\') to download the 5 test tasks.',
    successMessage: 'Apelul fetch cu limită de 5 task-uri este configurat corect cu await.',
    successMessage_en: 'Fetch call with limit=5 is correctly configured with await.',
  },
  {
    file: 'app.js',
    name: '[app.js] Despachetare răspuns JSON cu await .json()',
    name_en: '[app.js] JSON response unpacking with await .json()',
    check: 'regex',
    pattern: 'await\\s+[a-zA-Z0-9_$.]+\\.json\\s*\\(\\s*\\)',
    message:
      'Cerința 3 eșuată: Despachetează răspunsul primit apelând await response.json().',
    message_en:
      'Requirement 3 failed: Unpack received response by calling await response.json().',
    successMessage: 'Răspunsul este despachetat corect folosind await .json().',
    successMessage_en: 'Response is correctly unpacked using await .json().',
  },
  {
    file: 'app.js',
    name: '[app.js] Selectare listă #active-tasks-list din DOM',
    name_en: '[app.js] DOM selection of #active-tasks-list',
    check: 'regex',
    pattern: '(?:querySelector|getElementById)\\s*\\(\\s*[\'"`]#?active-tasks-list[\'"`]\\s*\\)',
    message:
      'Cerința 4 eșuată: Selectează lista din HTML folosind document.querySelector(\'#active-tasks-list\') sau document.getElementById(\'active-tasks-list\').',
    message_en:
      'Requirement 4 failed: Select list from HTML using document.querySelector(\'#active-tasks-list\') or document.getElementById(\'active-tasks-list\').',
    successMessage: 'Elementul #active-tasks-list este selectat corect din DOM.',
    successMessage_en: 'Element #active-tasks-list is correctly selected from DOM.',
  },
  {
    file: 'app.js',
    name: '[app.js] Parcurgere listă task-uri primite',
    name_en: '[app.js] Iterate through received tasks array',
    check: 'regex',
    pattern: '\\.(?:forEach|map)\\s*\\(|for\\s*\\(',
    message:
      'Cerința 4 eșuată: Parcurge array-ul de task-uri primit de la server folosind o buclă for sau .forEach().',
    message_en:
      'Requirement 4 failed: Iterate through the received task array using a for loop or .forEach().',
    successMessage: 'Array-ul de task-uri este parcurs corect.',
    successMessage_en: 'Task array is properly iterated.',
  },
  {
    file: 'app.js',
    name: '[app.js] Creare dinamică a elementului de listă li',
    name_en: '[app.js] Dynamic creation of li element',
    check: 'regex',
    pattern: 'document\\.createElement\\s*\\(\\s*[\'"`]li[\'"`]\\s*\\)',
    message:
      'Cerința 4 eșuată: Creează dinamic un element de listă pentru fiecare task folosind document.createElement(\'li\').',
    message_en:
      'Requirement 4 failed: Dynamically create a list item for each task using document.createElement(\'li\').',
    successMessage: 'Elementul <li> este creat dinamic folosind document.createElement(\'li\').',
    successMessage_en: 'Element <li> is dynamically created using document.createElement(\'li\').',
  },
  {
    file: 'app.js',
    name: '[app.js] Atribuire titlu task (proprietatea .title)',
    name_en: '[app.js] Set task title text (.title property)',
    check: 'regex',
    pattern: '(?=[\\s\\S]*?\\.title)(?=[\\s\\S]*?(?:\\.textContent|\\.innerText|\\.innerHTML))',
    message:
      'Cerința 4 eșuată: Setează textul elementului <li> folosind proprietatea .title a obiectului JSON primit.',
    message_en:
      'Requirement 4 failed: Set text of <li> using the .title property of the received JSON object.',
    successMessage: 'Textul elementului <li> conține proprietatea .title a task-ului.',
    successMessage_en: 'Text of <li> properly contains the .title property.',
  },
  {
    file: 'app.js',
    name: '[app.js] Inserare li în listă (appendChild / append)',
    name_en: '[app.js] Append li to active-tasks-list',
    check: 'regex',
    pattern: '[a-zA-Z0-9_$.]+\\.(?:appendChild|append)\\s*\\(\\s*(?:li|[a-zA-Z0-9_$]+)\\s*\\)',
    message:
      'Cerința 4 eșuată: Adaugă elementul <li> generat în lista #active-tasks-list folosind .appendChild(li) sau .append(li).',
    message_en:
      'Requirement 4 failed: Append the generated <li> element into #active-tasks-list using .appendChild(li) or .append(li).',
    successMessage: 'Elementul <li> este inserat în lista din DOM.',
    successMessage_en: 'Element <li> is appended into the DOM list.',
  },
  {
    file: 'app.js',
    name: '[app.js] Apelare funcție la încărcare: incarcaTaskuriInitiale()',
    name_en: '[app.js] Automatic function call: incarcaTaskuriInitiale()',
    check: 'regex',
    pattern: '(?<!function\\s+|const\\s+|let\\s+|var\\s+)incarcaTaskuriInitiale\\s*\\(\\s*\\)',
    message:
      'Cerința 5 eșuată: Apelează funcția incarcaTaskuriInitiale(); la finalul fișierului app.js pentru a o declanșa automat.',
    message_en:
      'Requirement 5 failed: Call the function incarcaTaskuriInitiale(); at the end of app.js to trigger it automatically.',
    successMessage: 'Funcția incarcaTaskuriInitiale() este apelată automat la încărcarea paginii.',
    successMessage_en: 'Function incarcaTaskuriInitiale() is called automatically on load.',
  },
]);

const validIndexHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Task Tracker</title>
</head>
<body>
  <header>
    <nav>
      <h1>Task Tracker Enterprise</h1>
    </nav>
  </header>
  <main id="task-tracker">
    <section class="add-task-section">
      <form id="add-task-form">
        <input type="text" id="task-name" placeholder="Nume task..." />
        <button type="submit" id="submit-btn">Adauga</button>
      </form>
    </section>

    <section class="active-tasks-section">
      <h2>Task-uri Active (Server)</h2>
      <ul id="active-tasks-list"></ul>
    </section>

    <section class="task-history-section">
      <table id="history-table">
        <tbody id="task-list"></tbody>
      </table>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

const completeStudentJsCode = `// ============================================================
// MODULUL 3: Business Logic
// ============================================================
const listaTaskuri = [
  { id: 1001, nume: "Configurare mediu testare", completat: true },
  { id: 1002, nume: "Scriere teste unitare", completat: false }
];

const proceseazaTaskNou = (numeTask) => {
  if (!numeTask || typeof numeTask !== 'string') return false;
  const taskNou = { id: Date.now(), nume: numeTask, completat: false };
  listaTaskuri.push(taskNou);
  return true;
};

for (let i = 0; i < listaTaskuri.length; i++) {
  console.log(listaTaskuri[i].nume);
}

// ============================================================
// MODULUL 4: DOM Manipulation
// ============================================================
const form = document.querySelector('#add-task-form');
const input = document.getElementById('task-name');
const tbody = document.querySelector('#task-list');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  const tr = document.createElement('tr');
  tr.innerHTML = '<td>#1003</td><td>' + input.value + '</td><td><button class="delete-row">Sterge</button></td>';
  tbody.appendChild(tr);
  input.value = '';
});

document.addEventListener('click', function (e) {
  if (e.target.classList.contains('delete-row')) {
    e.target.closest('tr').remove();
  }
});

// ============================================================
// MODULUL 5: JS Asincron (Fetch API & Task-uri Active)
// ============================================================
const incarcaTaskuriInitiale = async () => {
  try {
    const response = await fetch('https://jsonplaceholder.typicode.com/todos?_limit=5');
    const taskuri = await response.json();
    const activeTasksList = document.querySelector('#active-tasks-list');

    taskuri.forEach(task => {
      const li = document.createElement('li');
      li.textContent = task.title;
      activeTasksList.appendChild(li);
    });
  } catch (error) {
    console.error('Eroare la preluarea task-urilor:', error);
  }
};

incarcaTaskuriInitiale();
`;

describe('Module 05 (Async JS & Fetch API) Static Validation Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (getAuthSession as any).mockResolvedValue({
      user: {
        id: 'student-user-uuid',
        name: 'Student QualiAdept',
        email: 'student@qualiadept.eu',
        role: 'STUDENT',
      },
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'student-user-uuid',
      role: 'STUDENT',
      isEnrolled: true,
      name: 'Student QualiAdept',
    });

    (prisma.assignment.findUnique as any).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000005',
      title: 'Sesiunea 5: JS Asincron (Promises & Fetch)',
      module: 5,
      validationType: 'STATIC',
      validationRules: module5Rules,
    });

    (prisma.submission.findFirst as any).mockResolvedValue(null);
    (prisma.submission.count as any).mockResolvedValue(0);

    (prisma.submission.create as any).mockImplementation(({ data }: any) => ({
      id: 'sub-m5-test-uuid',
      ...data,
      submittedAt: new Date(),
    }));
  });

  it('TC-01: Full valid code containing Module 3 + 4 + 5 achieves 100% PASS (10/10 checks across all files)', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'style.css': '.active-tasks-section { margin-bottom: 2rem; }',
          'app.js': completeStudentJsCode,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback).toHaveLength(10);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
  });

  it('TC-02: Missing #active-tasks-list in index.html FAILS Rule 1', async () => {
    const htmlWithoutList = validIndexHtml.replace(
      '<ul id="active-tasks-list"></ul>',
      '<!-- list missing -->'
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'index.html',
        locale: 'ro',
        files: {
          'index.html': htmlWithoutList,
          'app.js': completeStudentJsCode,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.file).toBe('index.html');
    expect(failedCheck.check).toContain('#active-tasks-list');
  });

  it('TC-03: Missing async Arrow Function declaration FAILS Rule 2', async () => {
    // Student used standard function instead of async Arrow Function
    const invalidJs = completeStudentJsCode.replace(
      'const incarcaTaskuriInitiale = async () =>',
      'function incarcaTaskuriInitiale()'
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': invalidJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.check).toContain('incarcaTaskuriInitiale');
    expect(failedCheck.message).toContain('Cerința 1 eșuată');
  });

  it('TC-04: Missing await on fetch FAILS Rule 3', async () => {
    const invalidJs = completeStudentJsCode.replace(
      'await fetch(\'https://jsonplaceholder.typicode.com/todos?_limit=5\')',
      'fetch(\'https://jsonplaceholder.typicode.com/todos?_limit=5\')'
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': invalidJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.check).toContain('Apel Fetch API');
    expect(failedCheck.message).toContain('Cerința 2 eșuată');
  });

  it('TC-05: Missing await .json() unpacking FAILS Rule 4', async () => {
    const invalidJs = completeStudentJsCode.replace(
      'const taskuri = await response.json();',
      'const taskuri = response.data;'
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': invalidJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.check).toContain('await .json()');
    expect(failedCheck.message).toContain('Cerința 3 eșuată');
  });

  it('TC-06: Wrong selector for list FAILS Rule 5', async () => {
    const invalidJs = completeStudentJsCode.replace(
      "document.querySelector('#active-tasks-list')",
      "document.querySelector('#wrong-list')"
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': invalidJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.check).toContain('#active-tasks-list');
    expect(failedCheck.message).toContain('Cerința 4 eșuată');
  });

  it('TC-07: Missing document.createElement("li") FAILS Rule 7', async () => {
    const invalidJs = completeStudentJsCode.replace(
      "const li = document.createElement('li');",
      "const li = document.createElement('div');"
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': invalidJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.check).toContain('Creare dinamică a elementului de listă li');
  });

  it('TC-08: Missing .title property assignment FAILS Rule 8', async () => {
    const invalidJs = completeStudentJsCode.replace(
      "li.textContent = task.title;",
      "li.textContent = task.name;"
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': invalidJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.check).toContain('Atribuire titlu task');
  });

  it('TC-09: Missing automatic call incarcaTaskuriInitiale() FAILS Rule 10', async () => {
    const invalidJs = completeStudentJsCode.replace(
      'incarcaTaskuriInitiale();',
      '// forgot to call function'
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': invalidJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.check).toContain('Apelare funcție la încărcare');
    expect(failedCheck.message).toContain('Cerința 5 eșuată');
  });

  it('TC-10: Bilingual output returns clean English messages for locale="en"', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'app.js',
        locale: 'en',
        files: {
          'index.html': validIndexHtml,
          'app.js': completeStudentJsCode,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.every((f: any) => !f.message.includes('Matched required pattern'))).toBe(true);
    expect(data.feedback.some((f: any) => f.check.includes('Async Arrow Function declaration'))).toBe(true);
    expect(data.feedback.some((f: any) => f.message.includes('Fetch call with limit=5 is correctly configured'))).toBe(true);
  });

  it('TC-11: Creative syntax with for...of, getElementById, .append(li), and double quotes passes 100%', async () => {
    const creativeJs = `
      // Prior module code
      const listaTaskuri = [{ id: 1, nume: "T1", completat: false }];
      const proceseazaTaskNou = (t) => true;

      const incarcaTaskuriInitiale = async () => {
        const res = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=5");
        const data = await res.json();
        const container = document.getElementById("active-tasks-list");

        for (const item of data) {
          const li = document.createElement("li");
          li.innerText = item.title;
          container.append(li);
        }
      };

      incarcaTaskuriInitiale();
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': creativeJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
  });

  it('TC-12: Classic for loop, innerHTML, and template literal URL passes 100%', async () => {
    const classicJs = `
      const incarcaTaskuriInitiale = async () => {
        const response = await fetch(\`https://jsonplaceholder.typicode.com/todos?_limit=5\`);
        const items = await response.json();
        const list = document.querySelector("#active-tasks-list");

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const li = document.createElement('li');
          li.innerHTML = item.title;
          list.appendChild(li);
        }
      };

      incarcaTaskuriInitiale();
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000005',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': classicJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
  });
});
