'use client';

import { useState } from 'react';
import CodeBlock from './CodeBlock';

export interface ParsedPortfolioFile {
  name: string;
  content: string;
  language: string;
  icon: string;
}

export function detectCodeLanguage(fileName: string, fallbackType?: string): string {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.jsx')) return 'javascript';
  if (lower.endsWith('.css')) return 'css';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'html';
  return fallbackType === 'DYNAMIC' ? 'typescript' : 'html';
}

export function getPortfolioFileIcon(fileName: string): string {
  if (fileName === 'playwright.config.ts') return '⚙️';
  if (fileName.endsWith('.spec.ts')) return '🎭';
  if (fileName.endsWith('.css')) return '🎨';
  if (fileName.endsWith('.ts') || fileName.endsWith('.tsx')) return '🔷';
  if (fileName.endsWith('.js') || fileName.endsWith('.jsx')) return '📜';
  return '🌐';
}

/**
 * Parses a submission codePayload into individual displayable files.
 * Handles multi-file JSON payloads (`{ files: { [fileName]: content } }`)
 * as well as legacy single-file plain-text payloads.
 */
export function parsePortfolioFiles(
  codePayload: string,
  validationType?: string
): ParsedPortfolioFile[] {
  if (!codePayload || typeof codePayload !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(codePayload);
    if (parsed && typeof parsed.files === 'object' && !Array.isArray(parsed.files)) {
      const entries = Object.entries(parsed.files)
        .filter(([, content]) => typeof content === 'string')
        .map(([name, content]) => ({
          name,
          content: content as string,
          language: detectCodeLanguage(name, validationType),
          icon: getPortfolioFileIcon(name),
        }));
      if (entries.length > 0) {
        return entries;
      }
    }
  } catch {
    // Plain-text legacy submission payload
  }

  const defaultName = validationType === 'DYNAMIC' ? 'e2e.spec.ts' : 'index.html';
  return [
    {
      name: defaultName,
      content: codePayload,
      language: detectCodeLanguage(defaultName, validationType),
      icon: getPortfolioFileIcon(defaultName),
    },
  ];
}

interface PortfolioCodeViewerProps {
  codePayload: string;
  validationType?: string;
}

export default function PortfolioCodeViewer({
  codePayload,
  validationType,
}: PortfolioCodeViewerProps) {
  const files = parsePortfolioFiles(codePayload, validationType);
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  if (files.length === 0) {
    return null;
  }

  const currentFile = files[activeIndex] || files[0];
  const lineCount = currentFile.content.split('\n').length;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div className="flex flex-col gap-2.5 w-full max-w-full">
      {/* File Tabs & Metadata Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-zinc-800/80">
        <div className="flex items-center gap-1.5 flex-wrap" role="tablist">
          {files.map((file, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={file.name}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => {
                  setActiveIndex(idx);
                  setCopied(false);
                }}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-zinc-800 text-emerald-300 border-emerald-500/40 font-semibold shadow-sm'
                    : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
              >
                <span>{file.icon}</span>
                <span>{file.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
            {currentFile.language} &bull; {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-emerald-300 border border-zinc-800 transition-colors cursor-pointer"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Syntax-Highlighted Source Code */}
      <CodeBlock code={currentFile.content} language={currentFile.language} />
    </div>
  );
}
