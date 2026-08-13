'use client';

import { useState } from 'react';
import { deleteAssignment } from '@/app/actions/assignments';

interface DeleteAssignmentButtonProps {
  assignmentId: string;
  title: string;
}

export default function DeleteAssignmentButton({ assignmentId, title }: DeleteAssignmentButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?\n\nThis action cannot be undone and will permanently remove this assignment and all associated student submissions.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteAssignment(assignmentId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete assignment.';
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-rose-950/40 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 hover:border-rose-700 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
    >
      {isDeleting ? (
        <span>Deleting...</span>
      ) : (
        <span>Delete 🗑️</span>
      )}
    </button>
  );
}
