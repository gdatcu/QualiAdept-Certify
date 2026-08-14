import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HeaderAuth from '@/components/HeaderAuth';
import { useSession, signIn, signOut } from 'next-auth/react';

describe('HeaderAuth Component Tests', () => {
  it('renders Sign In button when user is unauthenticated', () => {
    vi.mocked(useSession).mockReturnValueOnce({
      data: null,
      status: 'unauthenticated',
    } as any);

    render(<HeaderAuth />);
    const signInBtn = screen.getByRole('button', { name: /signIn/i });
    expect(signInBtn).toBeInTheDocument();

    fireEvent.click(signInBtn);
    expect(signIn).toHaveBeenCalledWith('github');
  });

  it('renders student profile info and leaderboard link when authenticated as STUDENT', () => {
    vi.mocked(useSession).mockReturnValueOnce({
      data: {
        user: { id: 'u-1', name: 'Alex Student', role: 'STUDENT', isEnrolled: true },
      },
      status: 'authenticated',
    } as any);

    render(<HeaderAuth />);
    expect(screen.getByText('Alex Student')).toBeInTheDocument();
    expect(screen.getByText(/leaderboard/i)).toBeInTheDocument();
  });

  it('renders God Mode link when authenticated as TRAINER', () => {
    vi.mocked(useSession).mockReturnValueOnce({
      data: {
        user: { id: 't-1', name: 'George Trainer', role: 'TRAINER', isEnrolled: true, isAdmin: true },
      },
      status: 'authenticated',
    } as any);

    render(<HeaderAuth />);
    expect(screen.getByText(/godMode/i)).toBeInTheDocument();
  });
});
