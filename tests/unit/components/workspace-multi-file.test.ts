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
});
