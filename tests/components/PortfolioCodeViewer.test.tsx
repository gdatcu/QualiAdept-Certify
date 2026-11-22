import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PortfolioCodeViewer, {
  parsePortfolioFiles,
  detectCodeLanguage,
  getPortfolioFileIcon,
} from '@/components/PortfolioCodeViewer';

describe('PortfolioCodeViewer Component Tests (BUG-03)', () => {
  it('parses multi-file JSON payloads with real newlines and proper languages/icons', () => {
    const payload = JSON.stringify({
      files: {
        'playwright.config.ts': "import { defineConfig } from '@playwright/test';\nexport default defineConfig({});",
        'task-tracker.spec.ts': "import { test } from '@playwright/test';\ntest('adds task', async () => {});",
      },
    });

    const parsed = parsePortfolioFiles(payload, 'STATIC');
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({
      name: 'playwright.config.ts',
      language: 'typescript',
      icon: '⚙️',
    });
    expect(parsed[0].content).toContain('\nexport default defineConfig({});');
    expect(parsed[1]).toMatchObject({
      name: 'task-tracker.spec.ts',
      language: 'typescript',
      icon: '🎭',
    });
  });

  it('falls back gracefully for legacy single-file HTML payloads', () => {
    const legacyHtml = '<main>\n  <h1>Task Tracker</h1>\n</main>';
    const parsed = parsePortfolioFiles(legacyHtml, 'STATIC');
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      name: 'index.html',
      language: 'html',
      icon: '🌐',
      content: legacyHtml,
    });
  });

  it('detects languages and icons accurately across supported extensions', () => {
    expect(detectCodeLanguage('style.css')).toBe('css');
    expect(detectCodeLanguage('app.js')).toBe('javascript');
    expect(detectCodeLanguage('pom.ts')).toBe('typescript');
    expect(detectCodeLanguage('index.html')).toBe('html');

    expect(getPortfolioFileIcon('playwright.config.ts')).toBe('⚙️');
    expect(getPortfolioFileIcon('task-tracker.spec.ts')).toBe('🎭');
    expect(getPortfolioFileIcon('pom.ts')).toBe('🔷');
    expect(getPortfolioFileIcon('style.css')).toBe('🎨');
    expect(getPortfolioFileIcon('app.js')).toBe('📜');
    expect(getPortfolioFileIcon('index.html')).toBe('🌐');
  });

  it('renders interactive file tabs and switches between files without raw JSON escaping', () => {
    const payload = JSON.stringify({
      files: {
        'playwright.config.ts': "export default defineConfig({ testDir: './tests' });",
        'task-tracker.spec.ts': "test('utilizatorul adaugă un task', async ({ page }) => {});",
      },
    });

    render(<PortfolioCodeViewer codePayload={payload} validationType="STATIC" />);

    const configTab = screen.getByRole('tab', { name: /playwright\.config\.ts/i });
    const specTab = screen.getByRole('tab', { name: /task-tracker\.spec\.ts/i });
    expect(configTab).toHaveAttribute('aria-selected', 'true');
    expect(specTab).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByText(/defineConfig/i)).toBeInTheDocument();
    expect(screen.queryByText(/"files":/)).not.toBeInTheDocument();

    fireEvent.click(specTab);
    expect(specTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText(/utilizatorul adaugă un task/i)).toBeInTheDocument();
  });
});
