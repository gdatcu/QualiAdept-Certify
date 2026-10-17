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

const module4Rules = JSON.stringify([
  {
    file: 'index.html',
    name: '[index.html] Conectare app.js prin tag-ul <script>',
    name_en: '[index.html] Connect app.js via <script> tag',
    selector: "body script[src*='app.js'], script[src*='app.js'], script[src='app.js']",
    check: 'attributeRegex',
    attrName: 'src',
    pattern: '^(?:\\.?\\/)?app\\.js$',
    message: 'Cerință eșuată: Fișierul app.js nu este conectat în index.html (ex: <script src="app.js"></script> înainte de </body>).',
    message_en: 'Requirement failed: app.js is not connected in index.html (e.g. <script src="app.js"></script> before </body>).',
    successMessage: 'Fișierul app.js este conectat corect în index.html.',
    successMessage_en: 'app.js is correctly connected in index.html.',
  },
  {
    file: 'app.js',
    name: '[app.js] Selectare elemente DOM (formular și input)',
    name_en: '[app.js] DOM Element Selection (form and input)',
    check: 'regex',
    pattern: '(?=[\\s\\S]*?(?:querySelector|getElementById)\\s*\\([\'"`]#?add-task-form[\'"`])(?=[\\s\\S]*?(?:querySelector|getElementById)\\s*\\([\'"`]#?task-name[\'"`])',
    message: 'Cerința 1 eșuată: Selectează formularul (#add-task-form) și câmpul de text (#task-name) folosind document.querySelector(...) sau document.getElementById(...).',
    message_en: 'Requirement 1 failed: Select the form (#add-task-form) and text input (#task-name) using document.querySelector(...) or document.getElementById(...).',
    successMessage: 'Elementele DOM (#add-task-form și #task-name) sunt selectate corect.',
    successMessage_en: 'DOM elements (#add-task-form and #task-name) are selected correctly.',
  },
  {
    file: 'app.js',
    name: '[app.js] Ascultător pentru evenimentul submit pe formular',
    name_en: '[app.js] Submit Event Listener on form',
    check: 'regex',
    pattern: '[a-zA-Z0-9_$.]+\\.addEventListener\\s*\\(\\s*[\'"`]submit[\'"`]',
    message: 'Cerința 2 eșuată: Adaugă un ascultător de eveniment pe formular folosind addEventListener("submit", ...).',
    message_en: 'Requirement 2 failed: Add a submit event listener to the form using addEventListener("submit", ...).',
    successMessage: 'Ascultătorul pentru evenimentul "submit" este atașat formularului.',
    successMessage_en: 'Submit event listener is attached to the form.',
  },
  {
    file: 'app.js',
    name: '[app.js] Prevenirea reîncărcării paginii cu preventDefault()',
    name_en: '[app.js] Prevent page reload with preventDefault()',
    check: 'regex',
    pattern: '(?:e|event|evt)\\.preventDefault\\s*\\(\\s*\\)',
    message: 'Cerința 3 eșuată: Apelează e.preventDefault() în interiorul ascultătorului pentru a opri reîncărcarea nativă a paginii.',
    message_en: 'Requirement 3 failed: Call e.preventDefault() inside the event listener to prevent native page reload.',
    successMessage: 'e.preventDefault() este apelat pentru a opri reîncărcarea paginii.',
    successMessage_en: 'e.preventDefault() is called to prevent page reload.',
  },
  {
    file: 'app.js',
    name: '[app.js] Creare dinamică a elementului de rând tr',
    name_en: '[app.js] Dynamic creation of tr row element',
    check: 'regex',
    pattern: 'document\\.createElement\\s*\\(\\s*[\'"`]tr[\'"`]\\s*\\)',
    message: 'Cerința 4 eșuată: Creează dinamic un nou element de rând folosind document.createElement("tr").',
    message_en: 'Requirement 4 failed: Dynamically create a new row element using document.createElement("tr").',
    successMessage: 'Elementul <tr> este creat dinamic folosind document.createElement("tr").',
    successMessage_en: 'The <tr> element is created dynamically using document.createElement("tr").',
  },
  {
    file: 'app.js',
    name: '[app.js] Structură rând cu celule și buton cu clasa delete-row',
    name_en: '[app.js] Row structure with cells and delete-row button',
    check: 'regex',
    pattern: '(?=[\\s\\S]*?\\.value)(?=[\\s\\S]*?(?:class\\s*=\\s*[\'"`][^\'"`]*\\bdelete-row\\b|classList\\.add\\s*\\(\\s*[\'"`]delete-row[\'"`]|className\\s*=\\s*[\'"`][^\'"`]*\\bdelete-row\\b))',
    message: 'Cerința 5 eșuată: Asigură-te că rândul conține valoarea din input și include un buton cu clasa "delete-row" (ex: <button class="delete-row">Șterge</button>).',
    message_en: 'Requirement 5 failed: Ensure the created row contains the input value and includes a delete button with class "delete-row" (e.g. <button class="delete-row">Delete</button>).',
    successMessage: 'Structura noului rând conține valoarea task-ului și butonul .delete-row.',
    successMessage_en: 'Row structure contains task text and .delete-row button.',
  },
  {
    file: 'app.js',
    name: '[app.js] Inserare rând în corpul tabelului (appendChild / append)',
    name_en: '[app.js] Insert row into table body (appendChild / append)',
    check: 'regex',
    pattern: '[a-zA-Z0-9_$.]+\\.(?:appendChild|append)\\s*\\(',
    message: 'Cerința 6 eșuată: Adaugă noul rând generat în corpul tabelului folosind .appendChild(tr) sau .append(tr).',
    message_en: 'Requirement 6 failed: Append the newly generated row into table body using .appendChild(tr) or .append(tr).',
    successMessage: 'Rândul nou este inserat în tabel folosind appendChild() sau append().',
    successMessage_en: 'New row is appended to the table body using appendChild() or append().',
  },
  {
    file: 'app.js',
    name: '[app.js] Resetare valoare input după salvare',
    name_en: '[app.js] Reset input value after saving',
    check: 'regex',
    pattern: '[a-zA-Z0-9_$.]+\\.value\\s*=\\s*[\'"`][\'"`]|\\.reset\\s*\\(\\s*\\)',
    message: 'Cerința 7 eșuată: Resetează valoarea câmpului de input la un string gol (input.value = "") după salvarea task-ului.',
    message_en: 'Requirement 7 failed: Reset the input field to an empty string (input.value = "") after saving the task.',
    successMessage: 'Câmpul de input este resetat la string gol după salvarea task-ului.',
    successMessage_en: 'Input field is reset to an empty string after saving the task.',
  },
  {
    file: 'app.js',
    name: '[app.js] Ștergere dinamică din DOM la click folosind .remove()',
    name_en: '[app.js] Dynamic DOM removal on click using .remove()',
    check: 'regex',
    pattern: '(?=[\\s\\S]*?addEventListener\\s*\\(\\s*[\'"`]click[\'"`])(?=[\\s\\S]*?(?:closest\\([\'"`]tr[\'"`]\\)|tr|rand|row|parentElement|parentNode)\\.remove\\s*\\(\\s*\\))',
    message: 'Cerința 8 eșuată: Implementează ștergerea rândului din DOM la evenimentul de "click" apelând .remove() pe elementul părinte de tip <tr> (ex: e.target.closest("tr").remove()).',
    message_en: 'Requirement 8 failed: Implement row removal on "click" event by calling .remove() on parent <tr> element (e.g. e.target.closest("tr").remove()).',
    successMessage: 'Ștergerea dinamică din DOM cu .remove() este implementată corect pe evenimentul de click.',
    successMessage_en: 'Dynamic DOM removal using .remove() is properly implemented on the click event.',
  },
]);

const validIndexHtml = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>Task Tracker</title>
</head>
<body>
  <form id="add-task-form">
    <input type="text" id="task-name">
    <button type="submit">Adauga</button>
  </form>
  <table id="history-table">
    <tbody></tbody>
  </table>
  <script src="app.js"></script>
</body>
</html>
`;

function setupAuthAndAssignmentMock() {
  vi.mocked(getAuthSession).mockResolvedValue({
    user: { id: 'u-student', name: 'George', email: 'g@qualiadept.eu', role: 'STUDENT' },
  } as any);

  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    id: 'u-student',
    isEnrolled: true,
    role: 'STUDENT',
    name: 'George',
  } as any);

  vi.mocked(prisma.assignment.findUnique).mockResolvedValue({
    id: '00000000-0000-0000-0000-000000000004',
    module: 4,
    title: 'Sesiunea 4: JS DOM Manipulation',
    validationRules: module4Rules,
  } as any);

  vi.mocked(prisma.submission.findFirst).mockResolvedValue(null);
  vi.mocked(prisma.submission.count).mockResolvedValue(0);
  vi.mocked(prisma.submission.create).mockResolvedValue({ id: 'sub-1' } as any);
}

describe('Module 04 Automated Validation Test Suite', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    setupAuthAndAssignmentMock();
  });

  it('TC-01: Standard JS implementation passes 100% (8/8 in app.js + HTML script check)', async () => {
    const jsCode = `
      const form = document.querySelector('#add-task-form');
      const input = document.getElementById('task-name');
      const tbody = document.querySelector('tbody');

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
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000004',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': jsCode,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.filter((f: any) => f.file === 'app.js')).toHaveLength(8);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
  });

  it('TC-02: Alternate implementation with tableBody.appendChild(newRow), taskForm, template strings passes 100%', async () => {
    const jsCode = `
      const taskForm = document.querySelector('#add-task-form');
      const taskInput = document.querySelector('#task-name');
      const tableBody = document.querySelector('#history-table tbody');

      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newRow = document.createElement('tr');
        newRow.innerHTML = \`
          <td>#1004</td>
          <td>\${taskInput.value}</td>
          <td><button class="delete-row">Șterge Task</button></td>
        \`;
        tableBody.appendChild(newRow);
        taskInput.value = '';
      });

      document.addEventListener('click', (e) => {
        if (e.target.closest('.delete-row')) {
          e.target.closest('tr').remove();
        }
      });
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000004',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': jsCode,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
  });

  it('TC-03: DOM method creation (createElement button, classList.add delete-row) passes 100%', async () => {
    const jsCode = `
      const form = document.getElementById('add-task-form');
      const input = document.getElementById('task-name');
      const table = document.querySelector('table tbody');

      form.addEventListener('submit', (evt) => {
        evt.preventDefault();
        const row = document.createElement('tr');
        
        const idCell = document.createElement('td');
        idCell.textContent = '#1005';
        
        const textCell = document.createElement('td');
        textCell.textContent = input.value;
        
        const actionCell = document.createElement('td');
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Șterge';
        deleteBtn.classList.add('delete-row');
        actionCell.appendChild(deleteBtn);
        
        row.appendChild(idCell);
        row.appendChild(textCell);
        row.appendChild(actionCell);
        
        table.appendChild(row);
        input.value = '';
      });

      document.addEventListener('click', (evt) => {
        if (evt.target && evt.target.classList.contains('delete-row')) {
          const parentRow = evt.target.closest('tr');
          if (parentRow) {
            parentRow.remove();
          }
        }
      });
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000004',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': jsCode,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
  });

  it('TC-04: Button with wrong class (btn-stergere instead of delete-row) FAILS Requirement 5', async () => {
    const jsCode = `
      const form = document.querySelector('#add-task-form');
      const input = document.getElementById('task-name');
      const tbody = document.querySelector('tbody');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const tr = document.createElement('tr');
        // BUG: Button has class 'btn-stergere', NOT 'delete-row'
        tr.innerHTML = '<td>#1003</td><td>' + input.value + '</td><td><button class="btn-stergere">Sterge</button></td>';
        tbody.appendChild(tr);
        input.value = '';
      });

      document.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-row')) {
          e.target.closest('tr').remove();
        }
      });
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000004',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': jsCode,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck).toBeDefined();
    expect(failedCheck.check).toContain('Structură rând');
    expect(failedCheck.message).toContain('Cerința 5 eșuată');
  });

  it('TC-05: Empty listener addEventListener("", ...) FAILS Requirement 8', async () => {
    const jsCode = `
      const form = document.querySelector('#add-task-form');
      const input = document.getElementById('task-name');
      const tbody = document.querySelector('tbody');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const tr = document.createElement('tr');
        tr.innerHTML = '<td>#1003</td><td>' + input.value + '</td><td><button class="delete-row">Sterge</button></td>';
        tbody.appendChild(tr);
        input.value = '';
      });

      // BUG: Empty string instead of 'click'
      document.addEventListener('', function (e) {
        if (e.target.classList.contains('delete-row')) {
          e.target.closest('tr').remove();
        }
      });
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000004',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': jsCode,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck).toBeDefined();
    expect(failedCheck.check).toContain('Ștergere dinamică');
    expect(failedCheck.message).toContain('Cerința 8 eșuată');
  });

  it('TC-06: Missing preventDefault() FAILS Requirement 3', async () => {
    const jsCode = `
      const form = document.querySelector('#add-task-form');
      const input = document.getElementById('task-name');
      const tbody = document.querySelector('tbody');

      form.addEventListener('submit', function (e) {
        // BUG: Forgot e.preventDefault() -> Page would reload!
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
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000004',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': jsCode,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.check).toContain('preventDefault');
    expect(failedCheck.message).toContain('Cerința 3 eșuată');
  });

  it('TC-07: Wrong element selectors (#add-task-form1, #task-name2) FAILS Requirement 1', async () => {
    const jsCode = `
      const form = document.querySelector('#add-task-form1');
      const input = document.getElementById('task-name2');
      const tbody = document.querySelector('tbody');

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
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000004',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': jsCode,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.check).toContain('Selectare elemente DOM');
    expect(failedCheck.message).toContain('Cerința 1 eșuată');
  });

  it('TC-08: Missing input reset (input.value = "") FAILS Requirement 7', async () => {
    const jsCode = `
      const form = document.querySelector('#add-task-form');
      const input = document.getElementById('task-name');
      const tbody = document.querySelector('tbody');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const tr = document.createElement('tr');
        tr.innerHTML = '<td>#1003</td><td>' + input.value + '</td><td><button class="delete-row">Sterge</button></td>';
        tbody.appendChild(tr);
        // BUG: Forgot input.value = ''
      });

      document.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-row')) {
          e.target.closest('tr').remove();
        }
      });
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000004',
        targetFile: 'app.js',
        locale: 'ro',
        files: {
          'index.html': validIndexHtml,
          'app.js': jsCode,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const failedCheck = data.feedback.find((f: any) => !f.passed);
    expect(failedCheck.check).toContain('Resetare valoare input');
    expect(failedCheck.message).toContain('Cerința 7 eșuată');
  });

  it('TC-09: Bilingual output returns English messages for locale="en" without raw regex leaks', async () => {
    const jsCode = `
      const form = document.querySelector('#add-task-form');
      const input = document.getElementById('task-name');
      const tbody = document.querySelector('tbody');

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const tr = document.createElement('tr');
        tr.innerHTML = '<td>#1003</td><td>' + input.value + '</td><td><button class="delete-row">Delete</button></td>';
        tbody.appendChild(tr);
        input.value = '';
      });

      document.addEventListener('click', function (e) {
        if (e.target.classList.contains('delete-row')) {
          e.target.closest('tr').remove();
        }
      });
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000004',
        targetFile: 'app.js',
        locale: 'en',
        files: {
          'index.html': validIndexHtml,
          'app.js': jsCode,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.feedback.every((f: any) => !f.message.includes('Matched required pattern'))).toBe(true);
    expect(data.feedback.some((f: any) => f.check.includes('DOM Element Selection'))).toBe(true);
    expect(data.feedback.some((f: any) => f.message.includes('Submit event listener is attached'))).toBe(true);
  });
});
