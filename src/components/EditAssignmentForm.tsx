'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateAssignment } from '@/app/actions/assignments';

interface AssignmentData {
  id: string;
  title: string;
  description: string;
  module: number;
  validationType: string;
  validationRules?: string | null;
  passingSample?: string | null;
  failingSample?: string | null;
}

interface EditAssignmentFormProps {
  assignment: AssignmentData;
}

export default function EditAssignmentForm({ assignment }: EditAssignmentFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [moduleNum, setModuleNum] = useState<string>(assignment.module.toString());
  const [title, setTitle] = useState(assignment.title);
  const [validationType, setValidationType] = useState<'STATIC' | 'DYNAMIC'>(
    assignment.validationType as 'STATIC' | 'DYNAMIC'
  );
  const [description, setDescription] = useState(assignment.description);
  const [validationRules, setValidationRules] = useState(assignment.validationRules || '');
  const [passingSample, setPassingSample] = useState(assignment.passingSample || '');
  const [failingSample, setFailingSample] = useState(assignment.failingSample || '');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg(null);

    try {
      const formData = new FormData();
      formData.append('module', moduleNum);
      formData.append('title', title);
      formData.append('validationType', validationType);
      formData.append('description', description);
      formData.append('validationRules', validationRules);
      formData.append('passingSample', passingSample);
      formData.append('failingSample', failingSample);

      await updateAssignment(assignment.id, formData);

      router.push('/trainer/assignments');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update assignment.';
      setErrorMsg(msg);
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        {/* Module Number */}
        <div className="sm:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-mono font-semibold text-zinc-300">
            Module #
          </label>
          <input
            type="number"
            name="module"
            min="1"
            required
            value={moduleNum}
            onChange={(e) => setModuleNum(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
          />
        </div>

        {/* Title */}
        <div className="sm:col-span-6 flex flex-col gap-1.5">
          <label className="text-xs font-mono font-semibold text-zinc-300">
            Assignment Title
          </label>
          <input
            type="text"
            name="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Validation Type */}
        <div className="sm:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-mono font-semibold text-zinc-300">
            Validation Type
          </label>
          <select
            name="validationType"
            value={validationType}
            onChange={(e) => setValidationType(e.target.value as 'STATIC' | 'DYNAMIC')}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors cursor-pointer"
          >
            <option value="STATIC">STATIC (DOM/Cheerio)</option>
            <option value="DYNAMIC">DYNAMIC (Playwright E2E)</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-mono font-semibold text-zinc-300">
          Assignment Description & Objectives
        </label>
        <textarea
          name="description"
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed resize-none"
        />
      </div>

      {/* Validation Rules JSON */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center justify-between">
          <span>Validation Rules (JSON Schema - Optional)</span>
          <span className="text-[10px] text-zinc-500 font-normal">Stringified JSON array of DOM assertion checks</span>
        </label>
        <textarea
          name="validationRules"
          rows={3}
          value={validationRules}
          onChange={(e) => setValidationRules(e.target.value)}
          placeholder='e.g., [{"tag": "main", "message": "Main tag exists"}, {"tag": "header", "message": "Header element exists"}]'
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-xs text-emerald-400 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 transition-colors font-mono resize-none"
        />
      </div>

      {/* Code Samples Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Passing Sample */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono font-semibold text-emerald-400 flex items-center justify-between">
            <span>+ Passing Code Sample (Optional)</span>
            <span className="text-[10px] text-zinc-500 font-normal">Inserted via workspace button</span>
          </label>
          <textarea
            name="passingSample"
            rows={3}
            value={passingSample}
            onChange={(e) => setPassingSample(e.target.value)}
            placeholder="Paste code sample that satisfies all module assertions..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-emerald-300 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 transition-colors font-mono resize-none"
          />
        </div>

        {/* Failing Sample */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-mono font-semibold text-rose-400 flex items-center justify-between">
            <span>+ Failing Code Sample (Optional)</span>
            <span className="text-[10px] text-zinc-500 font-normal">Inserted via workspace button</span>
          </label>
          <textarea
            name="failingSample"
            rows={3}
            value={failingSample}
            onChange={(e) => setFailingSample(e.target.value)}
            placeholder="Paste code sample that triggers assertion failure..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-rose-300 placeholder:text-zinc-700 focus:outline-none focus:border-rose-500 transition-colors font-mono resize-none"
          />
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-mono">
          ❌ {errorMsg}
        </div>
      )}

      {/* Form Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.push('/trainer/assignments')}
          className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <span>Saving Changes...</span>
          ) : (
            <span>Save & Apply Updates</span>
          )}
        </button>
      </div>
    </form>
  );
}
