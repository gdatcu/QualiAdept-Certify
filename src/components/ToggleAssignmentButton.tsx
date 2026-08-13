'use client';

import { useState } from 'react';
import { toggleAssignmentStatus } from '@/app/actions/assignments';

interface ToggleAssignmentButtonProps {
  assignmentId: string;
  currentStatus: boolean;
}

export default function ToggleAssignmentButton({ assignmentId, currentStatus }: ToggleAssignmentButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    setIsPending(true);
    try {
      await toggleAssignmentStatus(assignmentId, currentStatus);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle status.';
      alert(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
        currentStatus
          ? 'bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80'
          : 'bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/80'
      }`}
    >
      {isPending ? (
        <span>Processing...</span>
      ) : (
        <span>{currentStatus ? 'Deactivate 🛑' : 'Activate 🚀'}</span>
      )}
    </button>
  );
}
