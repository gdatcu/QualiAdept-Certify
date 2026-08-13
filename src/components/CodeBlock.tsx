'use client';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = 'html' }: CodeBlockProps) {
  return (
    <div className="rounded-xl overflow-x-auto max-w-full w-full font-mono text-xs border border-zinc-800 shadow-inner bg-zinc-950">
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.75rem',
          lineHeight: '1.6',
          backgroundColor: '#09090b', // zinc-950
          borderRadius: 0,
          maxWidth: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
        codeTagProps={{
          style: {
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            whiteSpace: 'pre',
            wordBreak: 'normal',
            overflowWrap: 'normal',
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

