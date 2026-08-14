import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import CodeBlock from '@/components/CodeBlock';

describe('CodeBlock Component Tests', () => {
  it('renders syntax highlighted code text correctly', () => {
    const codeSample = '<main><h1>QualiAdept</h1></main>';
    render(<CodeBlock code={codeSample} language="html" />);

    expect(screen.getByText(/QualiAdept/i)).toBeInTheDocument();
  });
});
