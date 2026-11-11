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

const module6Rules = JSON.stringify([
  {
    file: 'index.html',
    name: '[index.html] Câmpul de text cu data-testid="input-task-name"',
    name_en: '[index.html] Text input with data-testid="input-task-name"',
    selector: "input[data-testid='input-task-name'], [data-testid='input-task-name']",
    check: 'exists',
    message: 'Cerința QA eșuată: Câmpul de text nu are atributul data-testid="input-task-name".',
    message_en: 'QA requirement failed: Text input field is missing data-testid="input-task-name".',
    successMessage: 'Câmpul de input conține atributul data-testid="input-task-name".',
    successMessage_en: 'Input field correctly contains data-testid="input-task-name".',
  },
  {
    file: 'index.html',
    name: '[index.html] Buton salvare dezactivat inițial cu data-testid="submit-task-btn"',
    name_en: '[index.html] Save button initially disabled with data-testid="submit-task-btn"',
    selector: "button[data-testid='submit-task-btn'][disabled], [data-testid='submit-task-btn'][disabled]",
    check: 'exists',
    message:
      'Cerința QA eșuată: Butonul de salvare trebuie să aibă data-testid="submit-task-btn" și atributul disabled setat nativ.',
    message_en:
      'QA requirement failed: Save button must have data-testid="submit-task-btn" and disabled attribute set natively.',
    successMessage: 'Butonul de salvare are data-testid="submit-task-btn" și este dezactivat inițial.',
    successMessage_en: 'Save button has data-testid="submit-task-btn" and is disabled initially.',
  },
  {
    file: 'index.html',
    name: '[index.html] Mesaj eroare cu data-testid="error-message"',
    name_en: '[index.html] Error message with data-testid="error-message"',
    selector: "[data-testid='error-message']",
    check: 'exists',
    message: 'Cerința QA eșuată: Elementul pentru mesajul de eroare nu are atributul data-testid="error-message".',
    message_en: 'QA requirement failed: Error message element is missing data-testid="error-message".',
    successMessage: 'Elementul mesajului de eroare conține data-testid="error-message".',
    successMessage_en: 'Error message element correctly contains data-testid="error-message".',
  },
  {
    file: 'index.html',
    name: '[index.html] Lista <ul> cu data-testid="task-list"',
    name_en: '[index.html] Task list <ul> with data-testid="task-list"',
    selector: "ul[data-testid='task-list'], [data-testid='task-list']",
    check: 'exists',
    message: 'Cerința QA eșuată: Lista principală <ul> nu are atributul data-testid="task-list".',
    message_en: 'QA requirement failed: Task list <ul> is missing data-testid="task-list".',
    successMessage: 'Lista <ul> conține atributul data-testid="task-list".',
    successMessage_en: 'Task list <ul> correctly contains data-testid="task-list".',
  },
  {
    file: 'style.css',
    name: '[style.css] Stilizare pentru task finalizat (.completed cu line-through)',
    name_en: '[style.css] Completed task styling (.completed with line-through)',
    check: 'regex',
    pattern: '\\.completed\\s*\\{[^}]*text-decoration\\s*:\\s*line-through',
    message:
      'Cerința Task 2 eșuată: În style.css trebuie definită clasa .completed cu proprietatea text-decoration: line-through.',
    message_en:
      'Task 2 failed: Define .completed class with text-decoration: line-through in style.css.',
    successMessage: 'Clasa .completed este definită corect cu text-decoration: line-through.',
    successMessage_en: '.completed class is properly styled with text-decoration: line-through.',
  },
  {
    file: 'app.js',
    name: '[app.js] Aducere 5 task-uri inițiale (GET) și ascundere spinner',
    name_en: '[app.js] Initial 5 tasks retrieval (GET) and spinner hide',
    check: 'regex',
    pattern:
      '(?=[\\s\\S]*?fetch\\s*\\([\\s\\S]*?(?:_limit=5|todos))(?=[\\s\\S]*?\\.json\\s*\\()(?=[\\s\\S]*?(?:spinner|loading)[\\s\\S]{0,100}?(?:style\\.display\\s*=\\s*[\'"]none[\'"]|\\.remove\\s*\\(\\s*\\)|classList\\.(?:add|toggle)\\s*\\([\'"][^\'"]*(?:hidden|d-none)[\'"]\\)|hidden\\s*=\\s*true))',
    message:
      'Cerința Task 1 eșuată: Aplicația trebuie să aducă primele 5 task-uri prin fetch și să ascundă indicatorul de latență (spinner).',
    message_en: 'Task 1 failed: App must fetch first 5 tasks and hide the loading spinner.',
    successMessage: 'Aducerea inițială a celor 5 task-uri și ascunderea spinner-ului sunt implementate corect.',
    successMessage_en: 'Initial fetch of 5 tasks and spinner hiding are properly implemented.',
  },
  {
    file: 'app.js',
    name: '[app.js] Salvare task nou pe rețea (POST fetch)',
    name_en: '[app.js] Save new task via network (POST fetch)',
    check: 'regex',
    pattern: 'fetch\\s*\\([\\s\\S]*?method\\s*:\\s*[\'"`]POST[\'"`]',
    message:
      'Cerința Task 1 eșuată: Adăugarea unui nou task trebuie trimisă la server prin fetch cu method: "POST".',
    message_en: 'Task 1 failed: New task must be saved to server via fetch with method: "POST".',
    successMessage: 'Trimiterea pe rețea a noului task folosește metoda POST.',
    successMessage_en: 'Network submission for new task properly uses POST method.',
  },
  {
    file: 'app.js',
    name: '[app.js] Buton de ștergere dinamic cu data-testid="delete-btn-ID"',
    name_en: '[app.js] Dynamic delete button with data-testid="delete-btn-ID"',
    check: 'regex',
    pattern:
      '(?:data-testid\\s*=\\s*[\'"`]delete-btn-(?:\\$\\{[a-zA-Z0-9_$.]+\\}|[a-zA-Z0-9_$]+|\\$\\{task\\.id\\})[\'"`]|setAttribute\\s*\\(\\s*[\'"`]data-testid[\'"`]\\s*,\\s*[`\'"]delete-btn-(?:\\$\\{[a-zA-Z0-9_$.]+\\}|[a-zA-Z0-9_$]+|\\$\\{task\\.id\\}|[^`\'"]+)[`\'"]\\s*\\)|dataset\\.testid\\s*=\\s*[`\'"]delete-btn-(?:\\$\\{[a-zA-Z0-9_$.]+\\}|[a-zA-Z0-9_$]+|\\$\\{task\\.id\\}|[^`\'"]+)[`\'"])',
    message:
      'Cerința QA eșuată: Butoanele de ștergere generate dinamic trebuie să aibă atributul data-testid="delete-btn-${id}".',
    message_en:
      'QA requirement failed: Dynamically generated delete buttons must have data-testid="delete-btn-${id}".',
    successMessage: 'Atributul data-testid="delete-btn-${id}" este generat dinamic pe fiecare buton de ștergere.',
    successMessage_en: 'data-testid="delete-btn-${id}" attribute is dynamically generated on delete buttons.',
  },
  {
    file: 'app.js',
    name: '[app.js] Marcare task ca finalizat la click pe .task-title (.completed)',
    name_en: '[app.js] Mark task completed on click on .task-title (.completed)',
    check: 'regex',
    pattern:
      '(?=[\\s\\S]*?(?:classList\\.(?:toggle|add)\\s*\\(\\s*[\'"`]completed[\'"`]|className\\s*\\+?=\\s*[\'"`][^\'"`]*completed|style\\.textDecoration))(?=[\\s\\S]*?(?:task-title|\\.task-title))',
    message:
      'Cerința Task 2 eșuată: Adaugă în Event Delegation logica pentru click pe .task-title care aplică clasa .completed (ex: e.target.classList.toggle("completed")).',
    message_en:
      'Task 2 failed: Implement click on .task-title in event delegation to toggle "completed" class.',
    successMessage:
      'Funcționalitatea de marcare ca finalizat este implementată prin Event Delegation pe .task-title.',
    successMessage_en:
      'Completion toggle functionality is correctly implemented via event delegation on .task-title.',
  },
  {
    file: 'app.js',
    name: '[app.js] Ștergere pe rețea (DELETE) și eliminare rând din DOM (.remove())',
    name_en: '[app.js] Network deletion (DELETE) and DOM removal (.remove())',
    check: 'regex',
    pattern: '(?=[\\s\\S]*?fetch\\s*\\([\\s\\S]*?method\\s*:\\s*[\'"`]DELETE[\'"`])(?=[\\s\\S]*?\\.remove\\s*\\(\\s*\\))',
    message:
      'Cerința Task 1 eșuată: Ștergerea trebuie să apeleze fetch cu method: "DELETE" și să elimine rândul din DOM cu .remove().',
    message_en:
      'Task 1 failed: Deletion must trigger fetch with method: "DELETE" and remove row from DOM using .remove().',
    successMessage: 'Ștergerea trimite cererea HTTP DELETE și elimină elementul din DOM cu .remove().',
    successMessage_en: 'Deletion issues HTTP DELETE request and removes the element with .remove().',
  },
  {
    file: 'app.js',
    name: '[app.js] Modul Chaos: Pop-up promoțional cu data-testid="close-promo-btn"',
    name_en: '[app.js] Chaos Mode: Promotional pop-up with data-testid="close-promo-btn"',
    check: 'regex',
    pattern:
      '(?=[\\s\\S]*?data-testid\\s*=\\s*[\'"`]close-promo-btn[\'"`])(?=[\\s\\S]*?(?:addEventListener\\s*\\(\\s*[\'"`]click[\'"`]|onclick))',
    message:
      'Cerința QA eșuată: Butonul de închidere din pop-up-ul Chaos Mode trebuie să aibă data-testid="close-promo-btn" și să permită închiderea.',
    message_en:
      'QA requirement failed: Close button in Chaos Mode pop-up must have data-testid="close-promo-btn" and allow closing.',
    successMessage: 'Pop-up-ul Chaos Mode conține data-testid="close-promo-btn" și handler de închidere.',
    successMessage_en: 'Chaos Mode pop-up includes data-testid="close-promo-btn" and closing handler.',
  },
]);

const validIndexHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>QA Task Tracker Pro</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="navbar">
    <h1 id="logo">QA Task Tracker</h1>
    <span id="network-status" class="status-indicator online">API Online</span>
  </header>
  <main class="container">
    <section class="card input-section">
      <form id="add-task-form">
        <input type="text" id="task-name" placeholder="ex: Testare login" data-testid="input-task-name">
        <button type="submit" id="submit-task-btn" data-testid="submit-task-btn" disabled>Salvează</button>
        <small id="error-msg" data-testid="error-message" style="display: none;">Numele task-ului nu poate fi gol!</small>
      </form>
    </section>
    <section class="card list-section">
      <div id="loading-spinner" class="spinner" data-testid="loading-spinner">Se încarcă datele...</div>
      <ul id="task-list" class="task-list" data-testid="task-list"></ul>
    </section>
  </main>
  <script src="app.js"></script>
</body>
</html>`;

const validStyleCss = `
.navbar { display: flex; }
.spinner { background-color: #fcf3cf; }
.completed {
  text-decoration: line-through;
  color: #7f8c8d;
}
.overlay-modal { position: fixed; }
`;

const validAppJs = `
const form = document.querySelector('#add-task-form');
const inputNode = document.querySelector('#task-name');
const submitBtn = document.querySelector('#submit-task-btn');
const errorMsg = document.querySelector('#error-msg');
const taskList = document.querySelector('#task-list');
const spinner = document.querySelector('#loading-spinner');
const API_URL = 'https://jsonplaceholder.typicode.com/todos';

const deseneazaTaskInDOM = (id, titlu) => {
  const li = document.createElement('li');
  li.className = 'task-item';
  li.innerHTML = \`
    <span class="task-title">\${titlu}</span>
    <button class="btn-delete" data-testid="delete-btn-\${id}">Șterge</button>
  \`;
  taskList.appendChild(li);
};

const incarcaDateServer = async () => {
  try {
    const response = await fetch(\`\${API_URL}?_limit=5\`);
    const data = await response.json();
    spinner.style.display = 'none';
    data.forEach(task => deseneazaTaskInDOM(task.id, task.title));
  } catch (error) {
    console.error(error);
  }
};
incarcaDateServer();

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const taskTitle = inputNode.value.trim();
  if (!taskTitle) return;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: taskTitle, completed: false, userId: 1 })
  });

  if (response.status === 201) {
    const newTask = await response.json();
    deseneazaTaskInDOM(newTask.id, newTask.title);
    inputNode.value = '';
  }
});

inputNode.addEventListener('input', () => {
  if (inputNode.value.trim().length > 0) {
    submitBtn.disabled = false;
    errorMsg.style.display = 'none';
  } else {
    submitBtn.disabled = true;
    errorMsg.style.display = 'block';
  }
});

taskList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('task-title')) {
    e.target.classList.toggle('completed');
  }

  if (e.target.classList.contains('btn-delete')) {
    const deleteBtn = e.target;
    const randTask = deleteBtn.closest('.task-item');
    const taskId = deleteBtn.getAttribute('data-testid').split('-')[2];

    const response = await fetch(\`\${API_URL}/\${taskId}\`, {
      method: 'DELETE'
    });
    if (response.ok) {
      randTask.remove();
    }
  }
});

const initChaosMode = () => {
  setTimeout(() => {
    const modal = document.createElement('div');
    modal.className = 'overlay-modal';
    modal.innerHTML = \`
      <div class="promo-box">
        <h3>Ofertă Specială!</h3>
        <button class="btn-close-promo" data-testid="close-promo-btn">Nu, mulțumesc</button>
      </div>
    \`;
    const closeBtn = modal.querySelector('.btn-close-promo');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });
    document.body.appendChild(modal);
  }, 3000);
};
initChaosMode();
`;

describe('Module 06 (Task Tracker Capstone) Static Validation Integration Tests', () => {
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
      id: '00000000-0000-0000-0000-000000000006',
      title: 'Sesiunea 6: Livrarea Proiectului "Task Tracker" (Capstone)',
      module: 6,
      validationType: 'STATIC',
      validationRules: module6Rules,
    });

    (prisma.submission.findFirst as any).mockResolvedValue(null);
    (prisma.submission.count as any).mockResolvedValue(0);

    (prisma.submission.create as any).mockImplementation(({ data }: any) => ({
      id: 'sub-m6-test-uuid',
      ...data,
      submittedAt: new Date(),
    }));
  });

  it('TC-01: Full valid code achieves 100% PASS (11/11 checks across index.html, style.css, and app.js)', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': validAppJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback).toHaveLength(11);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
  });

  it('TC-02: Missing data-testid="input-task-name" fails check 1', async () => {
    const brokenHtml = validIndexHtml.replace('data-testid="input-task-name"', '');
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': brokenHtml,
          'style.css': validStyleCss,
          'app.js': validAppJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    expect(data.feedback[0].passed).toBe(false);
    expect(data.feedback[0].message).toContain('data-testid="input-task-name"');
  });

  it('TC-03: Missing disabled attribute on submit button fails check 2', async () => {
    const brokenHtml = validIndexHtml.replace('disabled', '');
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': brokenHtml,
          'style.css': validStyleCss,
          'app.js': validAppJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    expect(data.feedback[1].passed).toBe(false);
  });

  it('TC-04: Missing .completed class styling in style.css fails check 5', async () => {
    const brokenCss = '.navbar { display: flex; }';
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': validIndexHtml,
          'style.css': brokenCss,
          'app.js': validAppJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    expect(data.feedback[4].passed).toBe(false);
    expect(data.feedback[4].message).toContain('.completed');
  });

  it('TC-05: Missing POST fetch in app.js fails check 7', async () => {
    const brokenJs = validAppJs.replace("method: 'POST'", "method: 'PUT'");
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': brokenJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    expect(data.feedback[6].passed).toBe(false);
    expect(data.feedback[6].message).toContain('POST');
  });

  it('TC-06: Missing Task 2 toggle completed in app.js fails check 9', async () => {
    const brokenJs = validAppJs.replace("e.target.classList.toggle('completed');", '// no toggle');
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': brokenJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    expect(data.feedback[8].passed).toBe(false);
    expect(data.feedback[8].message).toContain('.completed');
  });

  it('TC-07: Missing DELETE fetch in app.js fails check 10', async () => {
    const brokenJs = validAppJs.replace("method: 'DELETE'", "method: 'GET'");
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': brokenJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    expect(data.feedback[9].passed).toBe(false);
    expect(data.feedback[9].message).toContain('DELETE');
  });

  it('TC-08: Missing Chaos Mode data-testid="close-promo-btn" fails check 11', async () => {
    const brokenJs = validAppJs.replace('data-testid="close-promo-btn"', '');
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': brokenJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    expect(data.feedback[10].passed).toBe(false);
    expect(data.feedback[10].message).toContain('close-promo-btn');
  });

  it('TC-09: Anti-Cheat: Comments mentioning code patterns do not pass validation', async () => {
    const commentOnlyJs = `
      // fetch('https://jsonplaceholder.typicode.com/todos?_limit=5').then(r => r.json()); spinner.style.display = 'none';
      // fetch(API_URL, { method: 'POST' });
      // data-testid="delete-btn-1"
      // e.target.classList.toggle('completed'); .task-title
      // fetch(API_URL, { method: 'DELETE' }); randTask.remove();
      // data-testid="close-promo-btn" closeBtn.addEventListener('click', () => {});
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': commentOnlyJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    // All JS checks must fail because comments were stripped
    expect(data.feedback[5].passed).toBe(false);
    expect(data.feedback[6].passed).toBe(false);
    expect(data.feedback[7].passed).toBe(false);
    expect(data.feedback[8].passed).toBe(false);
    expect(data.feedback[9].passed).toBe(false);
    expect(data.feedback[10].passed).toBe(false);
  });

  it('TC-10: Bilingual messages: English locale returns English check names and messages', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        locale: 'en',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': validAppJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.feedback[0].check).toBe('[index.html] Text input with data-testid="input-task-name"');
    expect(data.feedback[0].message).toContain('Input field correctly contains');
    expect(data.feedback[4].check).toBe('[style.css] Completed task styling (.completed with line-through)');
  });

  it('TC-11: setAttribute("data-testid", `delete-btn-${id}`) passes dynamic delete button assertion', async () => {
    // Replace template string delete button with setAttribute
    const imperativeDeleteJs = validAppJs.replace(
      '<button class="btn-delete" data-testid="delete-btn-${id}">Șterge</button>',
      '<button class="btn-delete">Șterge</button>'
    ).replace(
      'taskList.appendChild(li);',
      'const btn = li.querySelector(".btn-delete");\n    btn.setAttribute("data-testid", `delete-btn-${id}`);\n    taskList.appendChild(li);'
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': imperativeDeleteJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.feedback[7].passed).toBe(true);
    expect(data.feedback[7].check).toBe('[app.js] Buton de ștergere dinamic cu data-testid="delete-btn-ID"');
  });

  it('TC-12: Omitting spinner hide fails GET assertion even if task item has randTask.remove()', async () => {
    // Remove spinner hide line completely
    const noSpinnerJs = validAppJs.replace("spinner.style.display = 'none';", '// no spinner hide here');

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': noSpinnerJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    expect(data.feedback[5].passed).toBe(false);
    expect(data.feedback[5].check).toBe('[app.js] Aducere 5 task-uri inițiale (GET) și ascundere spinner');
  });

  it('TC-13: Full User Submission from Screenshots (Images 2 & 3) achieves 100% score (11/11 Passed)', async () => {
    const studentFullJs = `
      const form = document.querySelector("#add-task-form");
      const inputTask = document.querySelector("#task-name");
      const submitBtn = document.querySelector("#submit-task-btn");
      const errorMsg = document.querySelector("#error-msg");
      const spinner = document.querySelector("#loading-spinner");

      // Screenshot 2: incarcaTaskuriInitiale
      const incarcaTaskuriInitiale = async () => {
        try {
          const response = await fetch("https://jsonplaceholder.typicode.com/todos?_limit=5");
          if (!response.ok) {
            throw new Error("Eroare la incarcarea task-urilor initiale");
          }
          const data = await response.json();
          spinner.style.display = "none";

          const listaTaskuri = document.querySelector("#active-tasks-list");
          data.forEach((task) => {
            const id = task.id;
            const liNou = document.createElement("li");
            const taskTitle = document.createElement("span");
            taskTitle.classList.add("task-title");
            taskTitle.textContent = task.title;
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Sterge";
            deleteButton.setAttribute("data-testid", \`delete-btn-\${id}\`);
            liNou.appendChild(taskTitle);
            liNou.appendChild(deleteButton);
            listaTaskuri.appendChild(liNou);
          });
        } catch (error) {
          console.error("Eroare la incarcarea task-urilor initiale:", error);
        }
      };
      incarcaTaskuriInitiale();

      // Screenshot 3: form submit
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
          const inputText = inputTask.value;
          const response = await fetch("https://jsonplaceholder.typicode.com/todos", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              title: inputText,
              completed: false,
              userId: 1
            })
          });

          if (!response.ok) {
            throw new Error("Eroare la salvarea task-ului pe server");
          }

          if (response.status === 201) {
            console.log("Task adaugat cu succes pe server!");

            const newTask = await response.json();
            console.log("Task-ul adaugat:", newTask);
            const activeList = document.querySelector("#active-tasks-list");
            const li = document.createElement("li");
            const taskTitle = document.createElement("span");
            taskTitle.classList.add("task-title");
            taskTitle.textContent = newTask.title;
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Sterge";
            deleteButton.setAttribute("data-testid", \`delete-btn-\${newTask.id}\`);
            li.appendChild(taskTitle);
            li.appendChild(deleteButton);
            activeList.appendChild(li);

            inputTask.value = "";
          }
        } catch (err) {
          console.error(err);
        }
      });

      // Toggle completed on .task-title & delete on network
      document.querySelector("#active-tasks-list").addEventListener("click", async (e) => {
        if (e.target.classList.contains("task-title")) {
          e.target.classList.toggle("completed");
        }
        if (e.target.tagName === "BUTTON") {
          const id = e.target.getAttribute("data-testid").replace("delete-btn-", "");
          const res = await fetch(\`https://jsonplaceholder.typicode.com/todos/\${id}\`, {
            method: "DELETE"
          });
          if (res.ok) {
            e.target.closest("li").remove();
          }
        }
      });

      // Chaos Mode Pop-up
      const popup = document.createElement("div");
      popup.innerHTML = '<button data-testid="close-promo-btn">Close</button>';
      popup.querySelector("button").addEventListener("click", () => popup.remove());
      document.body.appendChild(popup);
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000006',
        files: {
          'index.html': validIndexHtml,
          'style.css': validStyleCss,
          'app.js': studentFullJs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
    // Specifically verify delete button assertion passed
    expect(data.feedback[7].passed).toBe(true);
    expect(data.feedback[7].check).toBe('[app.js] Buton de ștergere dinamic cu data-testid="delete-btn-ID"');
  });
});
