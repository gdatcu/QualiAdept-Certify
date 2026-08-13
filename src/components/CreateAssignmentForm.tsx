'use client';

import { useState } from 'react';
import { createAssignment } from '@/app/actions/assignments';

export default function CreateAssignmentForm() {
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [moduleNum, setModuleNum] = useState<string>('');
  const [title, setTitle] = useState('');
  const [validationType, setValidationType] = useState<'STATIC' | 'DYNAMIC'>('STATIC');
  const [description, setDescription] = useState('');
  const [validationRules, setValidationRules] = useState('');
  const [passingSample, setPassingSample] = useState('');
  const [failingSample, setFailingSample] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append('module', moduleNum);
      formData.append('title', title);
      formData.append('validationType', validationType);
      formData.append('description', description);
      formData.append('validationRules', validationRules);
      formData.append('passingSample', passingSample);
      formData.append('failingSample', failingSample);

      await createAssignment(formData);

      setSuccessMsg('✓ Module created successfully!');
      setModuleNum('');
      setTitle('');
      setValidationType('STATIC');
      setDescription('');
      setValidationRules('');
      setPassingSample('');
      setFailingSample('');

      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create assignment.';
      setErrorMsg(msg);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        {/* Module Number */}
        <div className="sm:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-mono font-semibold text-zinc-300">
            Module #
          </label>
          <input
            type="number"
            min="1"
            required
            value={moduleNum}
            onChange={(e) => setModuleNum(e.target.value)}
            placeholder="e.g. 5"
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
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Session 5: Advanced Playwright Locators & Assertions"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Validation Type */}
        <div className="sm:col-span-3 flex flex-col gap-1.5">
          <label className="text-xs font-mono font-semibold text-zinc-300">
            Validation Type
          </label>
          <select
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
          required
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detail the technical objectives, DOM IDs, test-attrs, or E2E scripts students must implement..."
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
          rows={2}
          value={validationRules}
          onChange={(e) => setValidationRules(e.target.value)}
          placeholder='e.g., [{"tag": "main", "message": "Main tag exists"}, {"tag": "header", "message": "Header element exists"}]'
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-emerald-400 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500 transition-colors font-mono resize-none"
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

      {/* Error & Success Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-mono">
          ❌ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono">
          {successMsg}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
        >
          {isPending ? (
            <>
              <svg className="animate-spin h-3.5 w-3.5 text-zinc-950" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Creating Module...</span>
            </>
          ) : (
            <>
              <span>+ Publish New Module</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
