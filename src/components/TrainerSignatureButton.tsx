'use client';

import React, { useState } from 'react';
import SignaturePadModal from './SignaturePadModal';

interface TrainerSignatureButtonProps {
  label?: string;
}

export default function TrainerSignatureButton({
  label = 'Semnătură Certificate',
}: TrainerSignatureButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs text-amber-200 hover:text-white bg-amber-950/70 hover:bg-amber-900 border border-amber-800/80 px-3.5 py-1.5 rounded-full font-mono flex items-center gap-1.5 transition-colors shadow-sm font-semibold"
        title="Configurează semnătura desenată pentru certificatele emise"
      >
        <span>✍️ {label}</span>
      </button>

      <SignaturePadModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
