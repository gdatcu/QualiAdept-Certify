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
});

