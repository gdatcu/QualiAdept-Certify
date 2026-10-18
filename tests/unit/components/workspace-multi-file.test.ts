import { describe, it, expect } from 'vitest';
import { getModuleFiles, parseInitialFiles } from '@/app/[locale]/assignment/[id]/AssignmentWorkspace';

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
});
