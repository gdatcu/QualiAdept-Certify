'use client';

import { signIn } from 'next-auth/react';
import { Link } from '@/i18n/routing';
import React from 'react';

interface ModuleCardItemProps {
  assignmentId: string;
  isUnlockedOrCompleted: boolean;
  isAuthenticated: boolean;
  className: string;
  children: React.ReactNode;
}

export default function ModuleCardItem({
  assignmentId,
  isUnlockedOrCompleted,
  isAuthenticated,
  className,
  children,
}: ModuleCardItemProps) {
  if (!isUnlockedOrCompleted) {
    return <div className={className}>{children}</div>;
  }

  if (!isAuthenticated) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          signIn('github', { callbackUrl: `/assignment/${assignmentId}` });
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            signIn('github', { callbackUrl: `/assignment/${assignmentId}` });
          }
        }}
        className={className}
      >
        {children}
      </div>
    );
  }

  return (
    <Link href={`/assignment/${assignmentId}`} className={className}>
      {children}
    </Link>
  );
}
