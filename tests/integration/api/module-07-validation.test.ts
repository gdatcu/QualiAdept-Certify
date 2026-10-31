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

const module7Rules = JSON.stringify([
  {
    file: 'index.html',
    name: '[index.html] Conectare script app.ts',
    name_en: '[index.html] Connect script app.ts',
    check: 'regex',
    pattern: '<script[^>]*src=["\']app\\.(ts|js)["\'][^>]*>',
    message: 'Cerința QA eșuată: Conectează fișierul script în index.html folosind <script src="app.ts"></script>.',
    message_en: 'QA requirement failed: Connect script file in index.html using <script src="app.ts"></script>.',
    successMessage: 'Scriptul app.ts (sau app.js) este corect conectat în index.html.',
    successMessage_en: 'Script app.ts (or app.js) is correctly linked in index.html.',
  },
  {
    file: 'app.ts',
    name: '[app.ts] Tipizare primitivă apiUrl: string',
    name_en: '[app.ts] Primitive type apiUrl: string',
    check: 'regex',
    pattern: '\\bapiUrl\\s*:\\s*string\\b',
    message: 'Cerința QA eșuată: Variabila apiUrl trebuie să aibă tipul explicit : string.',
    message_en: 'QA requirement failed: Variable apiUrl must have explicit type : string.',
    successMessage: 'Variabila apiUrl este strict tipizată ca string.',
    successMessage_en: 'Variable apiUrl is strictly typed as string.',
  },
  {
    file: 'app.ts',
    name: '[app.ts] Tipizare primitivă maxTasksLimit: number',
    name_en: '[app.ts] Primitive type maxTasksLimit: number',
    check: 'regex',
    pattern: '\\bmaxTasksLimit\\s*:\\s*number\\b',
    message: 'Cerința QA eșuată: Variabila maxTasksLimit trebuie să aibă tipul explicit : number.',
    message_en: 'QA requirement failed: Variable maxTasksLimit must have explicit type : number.',
    successMessage: 'Variabila maxTasksLimit este strict tipizată ca number.',
    successMessage_en: 'Variable maxTasksLimit is strictly typed as number.',
  },
  {
    file: 'app.ts',
    name: '[app.ts] Tipizare primitivă isAppReady: boolean',
    name_en: '[app.ts] Primitive type isAppReady: boolean',
    check: 'regex',
    pattern: '\\bisAppReady\\s*:\\s*boolean\\b',
    message: 'Cerința QA eșuată: Variabila isAppReady trebuie să aibă tipul explicit : boolean.',
    message_en: 'QA requirement failed: Variable isAppReady must have explicit type : boolean.',
    successMessage: 'Variabila isAppReady este strict tipizată ca boolean.',
    successMessage_en: 'Variable isAppReady is strictly typed as boolean.',
  },
  {
    file: 'app.ts',
    name: '[app.ts] Union Type TaskStatus',
    name_en: '[app.ts] Union Type TaskStatus',
    check: 'regex',
    pattern: 'type\\s+TaskStatus\\s*=\\s*[\'"]todo[\'"]\\s*\\|\\s*[\'"]in-progress[\'"]\\s*\\|\\s*[\'"]completed[\'"]',
    message: 'Cerința QA eșuată: Definește type TaskStatus = \'todo\' | \'in-progress\' | \'completed\'.',
    message_en: 'QA requirement failed: Define type TaskStatus = \'todo\' | \'in-progress\' | \'completed\'.',
    successMessage: 'Type Alias TaskStatus este definit corect cu cele 3 stări literale.',
    successMessage_en: 'Type Alias TaskStatus is correctly defined with all 3 literal states.',
  },
  {
    file: 'app.ts',
    name: '[app.ts] Model de date tipizat TaskItem',
    name_en: '[app.ts] Typed data model TaskItem',
    check: 'regex',
    pattern: 'type\\s+TaskItem\\s*=\\s*\\{[\\s\\S]*?id\\s*:\\s*number[\\s\\S]*?title\\s*:\\s*string[\\s\\S]*?status\\s*:\\s*TaskStatus[\\s\\S]*?completed\\s*:\\s*boolean[\\s\\S]*?priority\\?\\s*:\\s*[\'"]low[\'"]\\s*\\|\\s*[\'"]medium[\'"]\\s*\\|\\s*[\'"]high[\'"][\\s\\S]*?\\}',
    message: 'Cerința QA eșuată: Modelul TaskItem trebuie să conțină id: number, title: string, status: TaskStatus, completed: boolean și opțional priority?: \'low\' | \'medium\' | \'high\'.',
    message_en: 'QA requirement failed: TaskItem model must contain id: number, title: string, status: TaskStatus, completed: boolean, and optional priority?: \'low\' | \'medium\' | \'high\'.',
    successMessage: 'Modelul TaskItem conține proprietățile cerute și câmpul opțional priority?.',
    successMessage_en: 'TaskItem model contains required properties and optional priority? field.',
  },
  {
    file: 'app.ts',
    name: '[app.ts] Colecție tipizată listaTaskuri',
    name_en: '[app.ts] Typed collection listaTaskuri',
    check: 'regex',
    pattern: 'listaTaskuri\\s*:\\s*(TaskItem\\[\\]|Array<TaskItem>)',
    message: 'Cerința QA eșuată: Variabila listaTaskuri trebuie să fie tipizată ca TaskItem[] sau Array<TaskItem>.',
    message_en: 'QA requirement failed: Variable listaTaskuri must be typed as TaskItem[] or Array<TaskItem>.',
    successMessage: 'Array-ul principal listaTaskuri este strict tipizat ca TaskItem[].',
    successMessage_en: 'Main array listaTaskuri is strictly typed as TaskItem[].',
  },
  {
    file: 'app.ts',
    name: '[app.ts] Semnătură funcție proceseazaTaskNou',
    name_en: '[app.ts] Function signature proceseazaTaskNou',
    check: 'regex',
    pattern: 'proceseazaTaskNou\\s*=\\s*\\(?\\s*taskObj\\s*:\\s*TaskItem\\s*\\)?\\s*:\\s*boolean',
    message: 'Cerința QA eșuată: Funcția proceseazaTaskNou trebuie să primească parametrul (taskObj: TaskItem) și să aibă retur explicit : boolean.',
    message_en: 'QA requirement failed: Function proceseazaTaskNou must accept parameter (taskObj: TaskItem) and have explicit return type : boolean.',
    successMessage: 'Funcția proceseazaTaskNou primește taskObj: TaskItem și returnează boolean.',
    successMessage_en: 'Function proceseazaTaskNou accepts taskObj: TaskItem and returns boolean.',
  },
  {
    file: 'app.ts',
    name: '[app.ts] Semnătură funcție afiseazaTask',
    name_en: '[app.ts] Function signature afiseazaTask',
    check: 'regex',
    pattern: 'afiseazaTask\\s*=\\s*\\(?\\s*id\\s*:\\s*number\\s*\\)?\\s*:\\s*void',
    message: 'Cerința QA eșuată: Funcția afiseazaTask trebuie să primească parametrul (id: number) și să aibă retur explicit : void.',
    message_en: 'QA requirement failed: Function afiseazaTask must accept parameter (id: number) and have explicit return type : void.',
    successMessage: 'Funcția afiseazaTask primește id: number și returnează void.',
    successMessage_en: 'Function afiseazaTask accepts id: number and returns void.',
  },
  {
    file: 'app.ts',
    name: '[app.ts] Funcție asincronă incarcaTaskuriInitiale și asertare as TaskItem[]',
    name_en: '[app.ts] Async function incarcaTaskuriInitiale and assertion as TaskItem[]',
    check: 'regex',
    pattern: 'incarcaTaskuriInitiale\\s*=\\s*async\\s*\\(\\)\\s*:\\s*Promise<void>[\\s\\S]*?as\\s+TaskItem\\[\\]',
    message: 'Cerința QA eșuată: Funcția incarcaTaskuriInitiale trebuie să aibă retur : Promise<void> și să aserteze datele de la server cu as TaskItem[].',
    message_en: 'QA requirement failed: Function incarcaTaskuriInitiale must have return type : Promise<void> and assert server data with as TaskItem[].',
    successMessage: 'Funcția incarcaTaskuriInitiale returnează Promise<void> și asertează răspunsul ca TaskItem[].',
    successMessage_en: 'Function incarcaTaskuriInitiale returns Promise<void> and asserts response as TaskItem[].',
  },
  {
    file: 'app.ts',
    name: '[app.ts] Zero Any Policy (fără tipul any)',
    name_en: '[app.ts] Zero Any Policy (no any type)',
    check: 'regexInverted',
    pattern: '(:\\s*any\\b|as\\s+any\\b|<any>)',
    message: 'Cerința QA eșuată (Zero Any Policy): Utilizarea tipului any este strict interzisă! Înlocuiește any cu tipuri specifice sau unknown.',
    message_en: 'QA requirement failed (Zero Any Policy): Using the any type is strictly prohibited! Replace any with specific types or unknown.',
    successMessage: 'Politica Zero Any este respectată: nicio apariție a tipului any.',
    successMessage_en: 'Zero Any Policy respected: no occurrences of any type.',
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
  <h1>QA Task Tracker</h1>
  <script src="app.ts"></script>
</body>
</html>`;

const validAppTs = `// 1. Tipizarea Primitivelor
const apiUrl: string = 'https://jsonplaceholder.typicode.com/todos';
const maxTasksLimit: number = 5;
let isAppReady: boolean = false;

// 2. Tipul de Uniune (Union Type)
type TaskStatus = 'todo' | 'in-progress' | 'completed';

// 3. Modelul de Date Tipizat
type TaskItem = {
    id: number;
    title: string;
    status: TaskStatus;
    completed: boolean;
    priority?: 'low' | 'medium' | 'high'; // Proprietate opțională
};

// Declararea colecției tipizate
let listaTaskuri: TaskItem[] = [];

// 4. Semnăturile Funcțiilor (Zero Any Policy)
const proceseazaTaskNou = (taskObj: TaskItem): boolean => {
    if (!taskObj.title) {
        console.error("Eroare: Task-ul trebuie să aibă un titlu!");
        return false;
    }
    
    listaTaskuri.push(taskObj);
    console.log(\`Task-ul "\${taskObj.title}" a fost adăugat.\`);
    return true;
};

const afiseazaTask = (id: number): void => {
    const taskGasit = listaTaskuri.find(task => task.id === id);
    if (taskGasit) {
        console.log(\`[\${taskGasit.status.toUpperCase()}] \${taskGasit.title}\`);
    } else {
        console.log(\`Task-ul cu ID \${id} nu a fost găsit.\`);
    }
};

// 5. Funcție Asincronă Tipizată
const incarcaTaskuriInitiale = async (): Promise<void> => {
    try {
        const response = await fetch(\`\${apiUrl}?_limit=\${maxTasksLimit}\`);
        
        if (!response.ok) {
            throw new Error("Eroare la conectarea cu API-ul");
        }

        // Asertăm tipul datelor primite
        const dateServer = await response.json() as TaskItem[];
        
        // Populăm lista noastră
        listaTaskuri = dateServer;
        isAppReady = true;
        
        console.log(\`Au fost încărcate \${listaTaskuri.length} task-uri.\`);
        
    } catch (error) {
        console.error("Sistemul a întâmpinat o problemă:", error);
    }
};

incarcaTaskuriInitiale();
`;

describe('Module 7 (TypeScript Transition) - API Validation Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (getAuthSession as any).mockResolvedValue({
      user: {
        id: 'usr-1',
        email: 'trainer@qualiadept.eu',
        name: 'George Trainer',
        role: 'TRAINER',
      },
    });

    (prisma.user.findUnique as any).mockResolvedValue({
      id: 'usr-1',
      email: 'trainer@qualiadept.eu',
      role: 'TRAINER',
    });

    (prisma.assignment.findUnique as any).mockResolvedValue({
      id: '00000000-0000-0000-0000-000000000007',
      title: 'Sesiunea 7: Trecerea la TypeScript (Refactorizare Task Tracker)',
      module: 7,
      validationType: 'STATIC',
      validationRules: module7Rules,
    });

    (prisma.submission.create as any).mockResolvedValue({
      id: 'sub-mod7-1',
      status: 'PASS',
      score: 100,
      feedbackJSON: '[]',
    });
  });

  it('TC-01: Full passing submission passes all 11 criteria with 100% score', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000007',
        files: {
          'index.html': validIndexHtml,
          'app.ts': validAppTs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.score).toBe(100);
    expect(data.feedback).toHaveLength(11);
    expect(data.feedback.every((f: any) => f.passed === true)).toBe(true);
  });

  it('TC-02: Single-file check for app.ts executes only app.ts checks', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000007',
        targetFile: 'app.ts',
        files: {
          'index.html': validIndexHtml,
          'app.ts': validAppTs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.isPartial).toBe(true);
    expect(data.targetFile).toBe('app.ts');
    expect(data.feedback).toHaveLength(10);
    expect(data.feedback.every((f: any) => f.file === 'app.ts')).toBe(true);
    expect(data.feedback.every((f: any) => f.passed === true)).toBe(true);
  });

  it('TC-03: Zero Any Policy fails when : any is used', async () => {
    const codeWithAny = validAppTs.replace(
      'const proceseazaTaskNou = (taskObj: TaskItem): boolean =>',
      'const proceseazaTaskNou = (taskObj: any): boolean =>'
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000007',
        files: {
          'index.html': validIndexHtml,
          'app.ts': codeWithAny,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const zeroAnyFeedback = data.feedback.find((f: any) => f.check.includes('Zero Any Policy'));
    expect(zeroAnyFeedback).toBeDefined();
    expect(zeroAnyFeedback.passed).toBe(false);
    expect(zeroAnyFeedback.message).toContain('Zero Any Policy');
  });

  it('TC-04: Missing primitive type annotation fails the specific check', async () => {
    const codeWithoutPrimitive = validAppTs.replace(
      'const apiUrl: string =',
      'const apiUrl ='
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000007',
        files: {
          'index.html': validIndexHtml,
          'app.ts': codeWithoutPrimitive,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const apiUrlFeedback = data.feedback.find((f: any) => f.check.includes('apiUrl: string'));
    expect(apiUrlFeedback.passed).toBe(false);
  });

  it('TC-05: Missing union type TaskStatus fails that criterion', async () => {
    const codeWithoutUnion = validAppTs.replace(
      "type TaskStatus = 'todo' | 'in-progress' | 'completed';",
      "type TaskStatus = string;"
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000007',
        files: {
          'index.html': validIndexHtml,
          'app.ts': codeWithoutUnion,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const unionFeedback = data.feedback.find((f: any) => f.check.includes('TaskStatus'));
    expect(unionFeedback.passed).toBe(false);
  });

  it('TC-06: Missing Promise<void> on async function fails validation', async () => {
    const codeWithoutPromise = validAppTs.replace(
      'const incarcaTaskuriInitiale = async (): Promise<void> =>',
      'const incarcaTaskuriInitiale = async () =>'
    );

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000007',
        files: {
          'index.html': validIndexHtml,
          'app.ts': codeWithoutPromise,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('fail');
    const asyncFeedback = data.feedback.find((f: any) => f.check.includes('incarcaTaskuriInitiale'));
    expect(asyncFeedback.passed).toBe(false);
  });

  it('TC-07: Strips comments so instructional comments do not produce false passes', async () => {
    const commentCheatTs = `
      // const apiUrl: string = '';
      // const maxTasksLimit: number = 5;
      // let isAppReady: boolean = true;
      // type TaskStatus = 'todo' | 'in-progress' | 'completed';
      // type TaskItem = { id: number; title: string; status: TaskStatus; completed: boolean; priority?: 'low' | 'medium' | 'high'; };
      // let listaTaskuri: TaskItem[] = [];
      // const proceseazaTaskNou = (taskObj: TaskItem): boolean => true;
      // const afiseazaTask = (id: number): void => {};
      // const incarcaTaskuriInitiale = async (): Promise<void> => { const x = [] as TaskItem[]; };
    `;

    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000007',
        files: {
          'index.html': validIndexHtml,
          'app.ts': commentCheatTs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    // All TS pattern checks must fail because comments were stripped
    expect(data.feedback[1].passed).toBe(false);
    expect(data.feedback[2].passed).toBe(false);
    expect(data.feedback[3].passed).toBe(false);
    expect(data.feedback[4].passed).toBe(false);
    expect(data.feedback[5].passed).toBe(false);
  });

  it('TC-08: Bilingual messages: English locale returns English check names and messages', async () => {
    const req = new NextRequest('http://localhost:3000/api/validate/static', {
      method: 'POST',
      body: JSON.stringify({
        assignmentId: '00000000-0000-0000-0000-000000000007',
        locale: 'en',
        files: {
          'index.html': validIndexHtml,
          'app.ts': validAppTs,
        },
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(data.status).toBe('pass');
    expect(data.feedback[0].check).toBe('[index.html] Connect script app.ts');
    expect(data.feedback[0].message).toContain('correctly linked');
    expect(data.feedback[1].check).toBe('[app.ts] Primitive type apiUrl: string');
    expect(data.feedback[10].check).toBe('[app.ts] Zero Any Policy (no any type)');
  });
});
