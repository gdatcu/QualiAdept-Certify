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

describe('/api/validate/static Integration Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('returns 400 if request body is not valid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: 'invalid-json',
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid JSON payload');
  });

  it('returns 401 if user is unauthenticated', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce(null);

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({ htmlCode: '<main></main>' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 if user is not enrolled and not a trainer', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-unenrolled', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-unenrolled',
      isEnrolled: false,
      role: 'STUDENT',
    } as any);

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({ htmlCode: '<main></main>' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 429 if rate limit threshold (3s lock) is triggered', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-1',
      isEnrolled: true,
      role: 'STUDENT',
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce({
      id: 'sub-recent',
      submittedAt: new Date(Date.now() - 1000), // 1s ago (< 3s)
    } as any);

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-1', htmlCode: '<main></main>' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain('wait a few seconds');
  });

  it('evaluates static HTML code and returns 200 PASS when all assertions pass', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-1', name: 'George', email: 'george@qualiadept.eu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-1',
      isEnrolled: true,
      role: 'STUDENT',
      name: 'George',
    } as any);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-1',
      module: 1,
      title: 'Task Tracker HTML',
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    const passingHtml = `
      <main>
        <h1>Task Tracker</h1>
        <div id="add-task-section">
          <button data-testid="submit-btn">Submit</button>
        </div>
      </main>
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-1', htmlCode: passingHtml }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.length).toBe(3);
    expect(prisma.submission.create).toHaveBeenCalled();
  });

  it('evaluates Session 2 complex rules and returns 100 PASS for compliant homework', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-s2', name: 'George Student', email: 'student@qualiadept.eu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-s2',
      isEnrolled: true,
      role: 'STUDENT',
      name: 'George Student',
    } as any);

    const session2Rules = JSON.stringify([
      {
        selector: "head link[rel='stylesheet'], link[rel='stylesheet']",
        check: 'attributeRegex',
        attrName: 'href',
        pattern: '^(?:\\.\\/)?style\\.css$',
        message: 'Cerința 1 eșuată',
      },
      {
        selector: 'header nav',
        check: 'hasClass',
        expected: 'navbar',
        message: 'Cerința 2 eșuată',
      },
      {
        selector: 'header nav #logo, nav #logo',
        check: 'exists',
        message: 'Cerința 2 eșuată (logo)',
      },
      {
        selector: "header nav [data-testid='btn-login'], nav [data-testid='btn-login']",
        check: 'exists',
        message: 'Cerința 2 eșuată (login)',
      },
      {
        selector: 'table tbody tr:nth-child(3) button',
        check: 'hasClass',
        expected: 'delete-row',
        message: 'Cerința 3 eșuată',
      },
      {
        selector: "button[data-testid='submit-task-btn'], [data-testid='submit-task-btn']",
        check: 'hasAttribute',
        attrName: 'disabled',
        message: 'Cerința 4 eșuată',
      },
    ]);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-session2',
      module: 2,
      title: 'Sesiunea 2: CSS & DOM Selectors',
      validationRules: session2Rules,
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    const compliantSession2Html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Task Tracker</title>
        <link rel="stylesheet" href="./style.css">
      </head>
      <body>
        <header>
          <nav class="navbar main-nav">
            <h1 id="logo">QualiAdept</h1>
            <button data-testid="btn-login" class="btn">Login</button>
          </nav>
        </header>
        <main>
          <form>
            <button type="submit" data-testid="submit-task-btn" disabled>Submit</button>
          </form>
          <table>
            <thead>
              <tr><th>#</th><th>Task</th><th>Action</th></tr>
            </thead>
            <tbody>
              <tr><td>1</td><td>A</td><td><button class="delete-row">Del</button></td></tr>
              <tr><td>2</td><td>B</td><td><button class="delete-row">Del</button></td></tr>
              <tr><td>3</td><td>C</td><td><button class="btn delete-row">Del</button></td></tr>
            </tbody>
          </table>
        </main>
      </body>
      </html>
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-session2', htmlCode: compliantSession2Html }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
    expect(data.feedback.length).toBe(6);
  });

  it('evaluates Session 2 rules and returns FAIL if requirements are missing', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-s2', name: 'Student', email: 'student@qualiadept.eu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-s2',
      isEnrolled: true,
      role: 'STUDENT',
      name: 'Student',
    } as any);

    const session2Rules = JSON.stringify([
      {
        selector: "head link[rel='stylesheet'], link[rel='stylesheet']",
        check: 'attributeRegex',
        attrName: 'href',
        pattern: '^(?:\\.\\/)?style\\.css$',
        message: 'Cerința 1 eșuată',
      },
      {
        selector: 'header nav',
        check: 'hasClass',
        expected: 'navbar',
        message: 'Cerința 2 eșuată (navbar class)',
      },
      {
        selector: "button[data-testid='submit-task-btn'], [data-testid='submit-task-btn']",
        check: 'hasAttribute',
        attrName: 'disabled',
        message: 'Cerința 4 eșuată (disabled)',
      },
    ]);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-session2',
      module: 2,
      title: 'Sesiunea 2',
      validationRules: session2Rules,
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    // HTML missing disabled attribute and navbar class
    const failingHtml = `
      <html>
      <head><link rel="stylesheet" href="style.css"></head>
      <body>
        <header><nav class="menu"></nav></header>
        <button data-testid="submit-task-btn">Submit</button>
      </body>
      </html>
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({ assignmentId: 'a-session2', htmlCode: failingHtml }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('fail');
    expect(data.score).toBe(33); // 1 passed out of 3
    expect(data.feedback.find((f: any) => f.check.includes('link') || f.passed)?.passed).toBe(true);
    expect(data.feedback.find((f: any) => f.message.includes('navbar class'))?.passed).toBe(false);
    expect(data.feedback.find((f: any) => f.message.includes('disabled'))?.passed).toBe(false);
  });

  it('handles multi-file payload (index.html + style.css) correctly', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-mf', name: 'MultiFile Student', email: 'mf@qualiadept.eu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-mf',
      isEnrolled: true,
      role: 'STUDENT',
      name: 'MultiFile Student',
    } as any);

    const session2Rules = JSON.stringify([
      {
        selector: "head link[rel='stylesheet']",
        check: 'attributeRegex',
        attrName: 'href',
        pattern: 'style\\.css',
        message: 'External CSS linked',
      },
      {
        type: 'regex',
        file: 'style.css',
        pattern: 'button:disabled',
        message: 'CSS disabled button styling exists',
      },
    ]);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-mf',
      module: 2,
      title: 'Sesiunea 2: CSS',
      validationRules: session2Rules,
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    const multiFileBody = {
      assignmentId: 'a-mf',
      files: {
        'index.html': '<html><head><link rel="stylesheet" href="style.css"></head><body><button disabled>Btn</button></body></html>',
        'style.css': 'button:disabled { opacity: 0.5; background: gray; }',
      },
    };

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify(multiFileBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback.length).toBe(2);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
    expect(prisma.submission.create).toHaveBeenCalled();
  });

  it('does NOT count patterns inside CSS/JS/HTML comments as passed', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u1', name: 'Student', email: 's@test.com' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u1',
      isEnrolled: true,
      role: 'STUDENT',
    } as any);

    const session2Rules = JSON.stringify([
      {
        type: 'regex',
        file: 'style.css',
        pattern: 'button:disabled\\s*\\{[^}]*[a-zA-Z\\-]+\\s*:',
        message: 'CSS disabled button styling exists',
      },
    ]);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-mf-comments',
      module: 2,
      title: 'Sesiunea 2: CSS',
      validationRules: session2Rules,
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    // style.css ONLY has the pattern in comments, no actual CSS declaration
    const multiFileBody = {
      assignmentId: 'a-mf-comments',
      files: {
        'index.html': '<html><head></head><body></body></html>',
        'style.css': '/* button:disabled { opacity: 0.5; } */\n/* Scrie regulile CSS aici: */',
      },
    };

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify(multiFileBody),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('fail');
    expect(data.score).toBe(0);
    expect(data.feedback[0].passed).toBe(false);
  });

  it('filters assertions and does not create database submission when targetFile is provided (Option 1 partial check)', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u1', name: 'Student', email: 's@test.com' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u1',
      isEnrolled: true,
      role: 'STUDENT',
    } as any);

    const multiRules = JSON.stringify([
      {
        type: 'selector',
        file: 'index.html',
        selector: 'nav.navbar',
        message: 'Navbar exists in HTML',
      },
      {
        type: 'regex',
        file: 'style.css',
        pattern: '\\.navbar\\s*\\{[^}]*display\\s*:\\s*flex',
        message: 'Navbar flex in CSS',
      },
    ]);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-partial-check',
      module: 2,
      title: 'Sesiunea 2',
      validationRules: multiRules,
    } as any);

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-partial-check',
        targetFile: 'style.css',
        files: {
          'index.html': '<nav class="navbar"></nav>',
          'style.css': '.navbar { display: flex; }',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.isPartial).toBe(true);
    expect(data.targetFile).toBe('style.css');
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    // Should ONLY have the rule for style.css
    expect(data.feedback.length).toBe(1);
    expect(data.feedback[0].file).toBe('style.css');
    // Prisma submission create should NOT be called for partial checks
    expect(prisma.submission.create).not.toHaveBeenCalled();
  });

  it('evaluates Session 3 JavaScript Basics and returns 100 PASS for compliant homework', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-s3', name: 'JS Student', email: 'js@qualiadept.eu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-s3',
      isEnrolled: true,
      role: 'STUDENT',
      name: 'JS Student',
    } as any);

    const session3Rules = JSON.stringify([
      {
        file: 'index.html',
        name: '[index.html] Conectare app.js prin tag-ul <script>',
        selector: "body script[src*='app.js'], script[src*='app.js'], script[src='app.js']",
        check: 'attributeRegex',
        attrName: 'src',
        pattern: '^(?:\\.\\/)?app\\.js$',
        message: 'Cerință eșuată: Script app.js lipsă',
      },
      {
        file: 'app.js',
        name: '[app.js] Declarare Array listaTaskuri cu obiecte structurate',
        check: 'regex',
        pattern: 'const\\s+listaTaskuri\\s*=\\s*\\[[\\s\\S]*?id\\s*:[\\s\\S]*?nume\\s*:[\\s\\S]*?completat\\s*:[\\s\\S]*?\\]',
        message: 'Cerința 1 eșuată',
      },
      {
        file: 'app.js',
        name: '[app.js] Arrow Function proceseazaTaskNou',
        check: 'regex',
        pattern: 'const\\s+proceseazaTaskNou\\s*=\\s*\\(?\\s*[a-zA-Z0-9_$]+\\s*\\)?\\s*=>',
        message: 'Cerința 2 eșuată (arrow function)',
      },
      {
        file: 'app.js',
        name: '[app.js] Validare condițională if/else pentru nume lipsă sau invalid',
        check: 'regex',
        pattern: 'if\\s*\\([\\s\\S]*?\\.nume\\s*(?:===|==)\\s*(?:["\']["\']|undefined)|if\\s*\\([\\s\\S]*?!\\s*[a-zA-Z0-9_$]+\\.nume',
        message: 'Cerința 2 eșuată (validare if)',
      },
      {
        file: 'app.js',
        name: '[app.js] Logare mesaj de eroare pentru task invalid',
        check: 'regex',
        pattern: 'console\\.log\\s*\\(\\s*["\']Eroare:\\s*Task-ul\\s+trebuie\\s+s[aă]\\s+aib[aă]\\s+un\\s+nume!?["\']\\s*\\)',
        message: 'Cerința 2 eșuată (log eroare)',
      },
      {
        file: 'app.js',
        name: '[app.js] Adăugare în Array prin push() și mesaj de succes',
        check: 'regex',
        pattern: 'listaTaskuri\\.push\\s*\\([\\s\\S]*?\\)[\\s\\S]*?console\\.log\\s*\\(\\s*["\']Task\\s+ad[aă]ugat\\s+cu\\s+succes!?["\']\\s*\\)',
        message: 'Cerința 2 eșuată (push și log succes)',
      },
      {
        file: 'app.js',
        name: '[app.js] Buclă for de parcurgere și raportare în consolă',
        check: 'regex',
        pattern: 'for\\s*\\(\\s*(?:let|var)\\s+[a-zA-Z0-9_$]+\\s*=\\s*0;[\\s\\S]*?listaTaskuri\\.length[\\s\\S]*?\\)[\\s\\S]*?console\\.log\\s*\\([\\s\\S]*?\\.nume[\\s\\S]*?\\)',
        message: 'Cerința 3 eșuată (buclă for)',
      },
    ]);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-session3',
      module: 3,
      title: 'Sesiunea 3: JavaScript Basics',
      validationRules: session3Rules,
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    const compliantIndexHtml = `
      <!DOCTYPE html>
      <html lang="ro">
      <head><title>Task Tracker</title></head>
      <body>
        <main><h1>Task Tracker</h1></main>
        <script src="app.js"></script>
      </body>
      </html>
    `;

    const compliantAppJs = `
      // 1. Array de Obiecte
      const listaTaskuri = [
        { id: 1001, nume: "Setare Boilerplate HTML", completat: true },
        { id: 1002, nume: "Înțelegere Arhitectură Client-Server", completat: false }
      ];

      // 2. Funcția de Validare (Arrow Function)
      const proceseazaTaskNou = (taskObj) => {
        if (taskObj.nume === "" || taskObj.nume === undefined) {
          console.log("Eroare: Task-ul trebuie să aibă un nume!");
        } else {
          listaTaskuri.push(taskObj);
          console.log("Task adăugat cu succes!");
        }
      };

      proceseazaTaskNou({ id: 1003, nume: "", completat: false });
      proceseazaTaskNou({ id: 1004, nume: "Scrie primul test Playwright", completat: false });

      // 3. Bucla de raportare
      console.log("--- Raport Task-uri ---");
      for (let i = 0; i < listaTaskuri.length; i++) {
        console.log("Task: " + listaTaskuri[i].nume);
      }
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-session3',
        files: {
          'index.html': compliantIndexHtml,
          'app.js': compliantAppJs,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback).toHaveLength(7);
    expect(data.feedback.every((f: any) => f.passed)).toBe(true);
    expect(prisma.submission.create).toHaveBeenCalled();
  });

  it('evaluates Session 3 and fails if strict validation or console feedback is missing', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-s3-fail', name: 'JS Incomplete', email: 'incomplete@qualiadept.eu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-s3-fail',
      isEnrolled: true,
      role: 'STUDENT',
      name: 'JS Incomplete',
    } as any);

    const session3Rules = JSON.stringify([
      {
        file: 'app.js',
        name: '[app.js] Logare mesaj de eroare pentru task invalid',
        check: 'regex',
        pattern: 'console\\.log\\s*\\(\\s*["\']Eroare:\\s*Task-ul\\s+trebuie\\s+s[aă]\\s+aib[aă]\\s+un\\s+nume!?["\']\\s*\\)',
        message: 'Cerința 2 eșuată: lipsește logul de eroare exact',
      },
    ]);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-session3-fail',
      module: 3,
      title: 'Sesiunea 3',
      validationRules: session3Rules,
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-session3-fail',
        files: {
          'index.html': '<html><head></head><body><script src="app.js"></script></body></html>',
          'app.js': 'console.log("Wrong error message");',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('fail');
    expect(data.score).toBe(0);
    expect(data.feedback[0].passed).toBe(false);
  });

  it('does NOT count JavaScript comments as passed for Session 3 rules', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-s3-comments', name: 'Commenter', email: 'c@qualiadept.eu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: 'u-s3-comments',
      isEnrolled: true,
      role: 'STUDENT',
    } as any);

    const session3Rules = JSON.stringify([
      {
        file: 'app.js',
        name: '[app.js] Declarare Array listaTaskuri cu obiecte structurate',
        check: 'regex',
        pattern: 'const\\s+listaTaskuri\\s*=\\s*\\[[\\s\\S]*?id\\s*:[\\s\\S]*?nume\\s*:[\\s\\S]*?completat\\s*:[\\s\\S]*?\\]',
        message: 'Cerința 1 eșuată',
      },
    ]);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-session3-comments',
      module: 3,
      title: 'Sesiunea 3',
      validationRules: session3Rules,
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    // app.js ONLY has the code inside comments
    const commentedAppJs = `
      // const listaTaskuri = [{ id: 1001, nume: "Test", completat: true }];
      /* const listaTaskuri = [{ id: 1001, nume: "Test", completat: true }]; */
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-session3-comments',
        files: {
          'index.html': '<html><body><script src="app.js"></script></body></html>',
          'app.js': commentedAppJs,
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('fail');
    expect(data.score).toBe(0);
    expect(data.feedback[0].passed).toBe(false);
  });

  it('evaluates Session 3 and returns 100 PASS for alternative student coding styles', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-alt', name: 'Alt Student', email: 'alt@qualiadept.eu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-alt',
      isEnrolled: true,
      role: 'STUDENT',
      name: 'Alt Student',
    } as any);

    // Current flexible rules from seed.ts
    const session3Rules = JSON.stringify([
      {
        file: 'index.html',
        name: '[index.html] Conectare app.js prin tag-ul <script>',
        selector: "body script[src*='app.js'], script[src*='app.js'], script[src='app.js']",
        check: 'attributeRegex',
        attrName: 'src',
        pattern: '^(?:\\.?\\/)?app\\.js$',
        message: 'Script app.js lipsă',
      },
      {
        file: 'app.js',
        name: '[app.js] Declarare Array listaTaskuri cu obiecte structurate',
        check: 'regex',
        pattern: '(?:const|let|var)\\s+listaTaskuri\\s*=\\s*\\[(?=[\\s\\S]*?id\\s*:)(?=[\\s\\S]*?nume\\s*:)(?=[\\s\\S]*?completat\\s*:)[\\s\\S]*?\\]',
        message: 'Cerința 1 eșuată',
      },
      {
        file: 'app.js',
        name: '[app.js] Arrow Function proceseazaTaskNou',
        check: 'regex',
        pattern: '(?:const|let|var)\\s+proceseazaTaskNou\\s*=\\s*\\(?\\s*[a-zA-Z0-9_$]+\\s*\\)?\\s*=>',
        message: 'Cerința 2 eșuată (arrow function)',
      },
      {
        file: 'app.js',
        name: '[app.js] Validare condițională if/else pentru nume lipsă sau invalid',
        check: 'regex',
        pattern: 'if\\s*\\([\\s\\S]*?(?:\\.nume|\\[[\'"]nume[\'"]\\])[\\s\\S]*?(?:===|==|!|trim|undefined|[\'"][\'"]|typeof)[\\s\\S]*?\\)',
        message: 'Cerința 2 eșuată (validare if)',
      },
      {
        file: 'app.js',
        name: '[app.js] Logare mesaj de eroare pentru task invalid',
        check: 'regex',
        pattern: 'console\\.log\\s*\\(\\s*["\'`]Eroare:\\s*Task-?ul\\s+trebuie\\s+s[aă]\\s+aib[aă]\\s+un\\s+nume!?["\'`]\\s*\\)',
        message: 'Cerința 2 eșuată (log eroare)',
      },
      {
        file: 'app.js',
        name: '[app.js] Adăugare în Array prin push() și mesaj de succes',
        check: 'regex',
        pattern: '(?=[\\s\\S]*?listaTaskuri\\.push\\s*\\()(?=[\\s\\S]*?console\\.log\\s*\\(\\s*["\'`]Task\\s+ad[aă]ugat\\s+cu\\s+succes!?["\'`]\\s*\\))',
        message: 'Cerința 2 eșuată (push și log succes)',
      },
      {
        file: 'app.js',
        name: '[app.js] Buclă for de parcurgere și raportare în consolă',
        check: 'regex',
        pattern: '(?:for\\s*\\(\\s*(?:let|var)\\s+[a-zA-Z0-9_$]+\\s*=\\s*0;[\\s\\S]*?listaTaskuri\\.length[\\s\\S]*?\\)|for\\s*\\(\\s*(?:const|let|var)\\s+[a-zA-Z0-9_$]+\\s+of\\s+listaTaskuri\\s*\\))[\\s\\S]*?console\\.log\\s*\\([^\\)]*?\\.nume',
        message: 'Cerința 3 eșuată (buclă for)',
      },
    ]);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-session3-alt',
      module: 3,
      title: 'Sesiunea 3',
      validationRules: session3Rules,
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    // Alternative student code:
    // 1. Used ./app.js in index.html
    // 2. Swapped property order in objects (nume before id)
    // 3. Single parameter arrow function without parens
    // 4. Inverted order: console.log success before push
    // 5. Template literals and no diacritics in error string
    // 6. for...of modern loop
    const altStudentHtml = '<!DOCTYPE html><html><body><script src="./app.js"></script></body></html>';
    const altStudentJs = `
      let listaTaskuri = [
        { nume: 'Setare Boilerplate', completat: true, id: 1001 },
        { nume: 'Client-Server', completat: false, id: 1002 }
      ];

      const proceseazaTaskNou = task => {
        if (!task.nume || task.nume.trim() === '') {
          console.log(\`Eroare: Task-ul trebuie sa aiba un nume!\`);
        } else {
          console.log(\`Task adaugat cu succes!\`);
          listaTaskuri.push(task);
        }
      };

      for (const t of listaTaskuri) {
        console.log(\`Task Name: \${t.nume}\`);
      }
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-session3-alt',
        files: {
          'index.html': altStudentHtml,
          'app.js': altStudentJs,
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

  it('returns 100 PASS for partial check on a file with no specific rules (e.g. style.css in Module 3) without falling back to Session 1 HTML checks', async () => {
    vi.mocked(getAuthSession).mockResolvedValueOnce({
      user: { id: 'u-css-check', name: 'Student', email: 's@qualiadept.eu', role: 'STUDENT' },
    } as any);

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'u-css-check',
      isEnrolled: true,
      role: 'STUDENT',
      name: 'Student',
    } as any);

    // Rules only target app.js and index.html (like Module 3)
    const jsOnlyRules = JSON.stringify([
      {
        file: 'app.js',
        name: '[app.js] Declarare Array listaTaskuri',
        check: 'regex',
        pattern: 'listaTaskuri',
        message: 'Lipsește listaTaskuri',
      },
    ]);

    vi.mocked(prisma.assignment.findUnique).mockResolvedValueOnce({
      id: 'a-js-only',
      module: 3,
      title: 'Sesiunea 3',
      validationRules: jsOnlyRules,
    } as any);

    vi.mocked(prisma.submission.findFirst).mockResolvedValueOnce(null);
    vi.mocked(prisma.submission.count).mockResolvedValueOnce(0);

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: 'a-js-only',
        targetFile: 'style.css',
        files: {
          'index.html': '<html><body></body></html>',
          'style.css': '.navbar { display: flex; }',
          'app.js': 'const listaTaskuri = [];',
        },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.isPartial).toBe(true);
    expect(data.targetFile).toBe('style.css');
    expect(data.feedback).toHaveLength(1);
    expect(data.feedback[0].file).toBe('style.css');
    expect(data.feedback[0].passed).toBe(true);
    // Crucially: MUST NOT contain legacy Session 1 checks like "Main tag exists" or "Add task section exists"
    expect(data.feedback.some((f: any) => f.check.includes('Main tag') || f.check.includes('Add task'))).toBe(false);
  });
});

