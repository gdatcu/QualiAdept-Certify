import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from '@/components/Footer';

describe('Footer Component Tests', () => {
  it('renders copyright brand name and qualiadept domain links correctly', () => {
    render(<Footer />);
    expect(screen.getByText(/copyright/i)).toBeInTheDocument();
    expect(screen.getByText(/qualiadept.eu/i)).toBeInTheDocument();
  });
});
