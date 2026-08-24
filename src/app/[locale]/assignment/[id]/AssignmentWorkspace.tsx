'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import DOMPurify from 'isomorphic-dompurify';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex flex-col items-center justify-center gap-3 bg-zinc-950 text-zinc-400 font-mono text-xs border border-zinc-800 rounded-xl">
      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
      <span>Loading VS Code engine...</span>
    </div>
  ),
});

interface FeedbackItem {
  check: string;
  passed: boolean;
  message: string;
}

interface ValidationResponse {
  status: 'pass' | 'fail';
  score: number;
  feedback: FeedbackItem[];
}

interface AssignmentData {
  id: string;
  title: string;
  description: string;
  module: number;
  validationType: string;
  passingSample?: string | null;
  failingSample?: string | null;
}

export interface SubmissionRecord {
  id: string;
  codePayload: string;
  status: string;
  score: number;
  feedbackJSON: string;
  submittedAt: string;
}

interface AssignmentWorkspaceProps {
  assignment: AssignmentData;
  initialSubmissions?: SubmissionRecord[];
}

const PASSING_SAMPLE = `<main>
  <h1>Task Tracker</h1>
  <div id="add-task-section">
    <h2>Add New Task</h2>
    <input type="text" id="task-title" placeholder="Enter task name..." />
    <button type="button" data-testid="submit-btn">Submit Task</button>
  </div>
</main>`;

const FAILING_SAMPLE = `<div class="container">
  <h1>Task Tracker</h1>
  <div class="form-wrapper">
    <input type="text" placeholder="Task title..." />
    <button type="button">Submit Task</button>
  </div>
</div>`;

const DYNAMIC_PLAYWRIGHT_SAMPLE = `import { test, expect } from '@playwright/test';

test('QualiAdept Task Tracker E2E Automation', async ({ page }) => {
  // 1. Navigate to target application URL
  await page.goto('https://qualiadept.eu');

  // 2. Interact with element locator
  const taskInput = page.locator('#task-input');
  await taskInput.fill('Write E2E automation test suite');

  // 3. Click submission button
  await page.locator('[data-testid="submit-btn"]').click();

  // 4. Assert page state and assertion outcome
  await expect(page).toHaveTitle(/QualiAdept/);
});`;

export default function AssignmentWorkspace({
  assignment,
  initialSubmissions = [],
}: AssignmentWorkspaceProps) {
  const { data: session, status: authStatus } = useSession();

  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(initialSubmissions);
  const mostRecent = submissions.length > 0 ? submissions[0] : null;
  const isMostRecentPassed = mostRecent?.status === 'PASS';

  // Code persistence: Pre-populate editor with most recent submission or sample code
  const [htmlCode, setHtmlCode] = useState<string>(
    mostRecent?.codePayload ||
      assignment.passingSample ||
      (assignment.validationType === 'DYNAMIC' ? DYNAMIC_PLAYWRIGHT_SAMPLE : PASSING_SAMPLE)
  );

  // Editor lock state for passed modules
  const [isUnlockedForEdit, setIsUnlockedForEdit] = useState<boolean>(!isMostRecentPassed);

  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(mostRecent?.id || null);

  const autosaveKey = `qualiadept_draft_${assignment.id}`;

  // 1. Initial mount: restore saved draft from localStorage if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem(autosaveKey);
      if (savedDraft && savedDraft.trim().length > 0) {
        setHtmlCode(savedDraft);
      }
    }
  }, [autosaveKey]);

  // 2. Debounced Autosave editor code state changes to localStorage (500ms debounce)
  useEffect(() => {
    if (typeof window !== 'undefined' && htmlCode) {
      const handler = setTimeout(() => {
        localStorage.setItem(autosaveKey, htmlCode);
      }, 500);
      return () => clearTimeout(handler);
    }
  }, [htmlCode, autosaveKey]);

  // 3. Cooldown timer for anti-spam (10s countdown)
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // 4. Sync initial most recent submission result to Green Wall
  useEffect(() => {
    if (mostRecent?.feedbackJSON) {
      try {
        const parsed: ValidationResponse = JSON.parse(mostRecent.feedbackJSON);
        setValidationResult(parsed);
      } catch {
        // Fallback if parsing fails
      }
    }
  }, [mostRecent]);

  const handleValidation = async () => {
    if (!session?.user) {
      setSubmitError('Authentication Required: Please sign in with GitHub before submitting code.');
      return;
    }

    setIsValidating(true);
    setSubmitError(null);

    try {
      const endpoint =
        assignment.validationType === 'DYNAMIC'
          ? '/api/validate/dynamic'
          : '/api/validate/static';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignmentId: assignment.id,
          htmlCode,
          codePayload: htmlCode,
        }),
      });

      if (res.status === 401) {
        if (typeof window !== 'undefined' && htmlCode) {
          localStorage.setItem(autosaveKey, htmlCode);
        }
        setSubmitError(
          'Sesiunea ta a expirat. Codul a fost salvat local. Te rugăm să dai refresh și să te reautentifici.'
        );
        return;
      }

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Validation server returned error code ${res.status}`);
      }

      const result: ValidationResponse = await res.json();
      setValidationResult(result);

      // Prepend newly created submission record to history state
      const newRecord: SubmissionRecord = {
        id: `submission-${Date.now()}`,
        codePayload: htmlCode,
        status: result.status.toUpperCase(),
        score: result.score,
        feedbackJSON: JSON.stringify(result),
        submittedAt: new Date().toISOString(),
      };

      setSubmissions((prev) => [newRecord, ...prev]);
      setSelectedHistoryId(newRecord.id);

      if (result.status === 'pass') {
        setIsUnlockedForEdit(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem(autosaveKey);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Network error occurred while submitting code.';
      setSubmitError(msg);
    } finally {
      setIsValidating(false);
      setCooldown(2);
    }
  };

  const loadHistorySubmission = (record: SubmissionRecord) => {
    setHtmlCode(record.codePayload);
    setSelectedHistoryId(record.id);
    try {
      const parsed: ValidationResponse = JSON.parse(record.feedbackJSON);
      setValidationResult(parsed);
    } catch {
      // Ignore parse error
    }
  };

  const isTrainer = session?.user?.role === 'TRAINER';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500 selection:text-zinc-950 flex flex-col">
      {/* Top Header / Brand & Auth Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-emerald-400 transition-colors mr-2">
              <span>← Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-zinc-800 hidden sm:block"></div>
            <Link href="/" className="flex items-center gap-2 group hover:opacity-90 transition-opacity">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-base shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:border-emerald-400/60 transition-colors">
                Q
              </div>
              <span className="font-semibold text-zinc-100 tracking-wide text-sm hidden sm:inline group-hover:text-white transition-colors">QualiAdept</span>
            </Link>
          </div>

          {/* User Profile / Auth Status */}
          <div className="flex items-center gap-3">
            {authStatus === 'loading' ? (
              <div className="h-8 w-32 bg-zinc-900 rounded-full animate-pulse border border-zinc-800"></div>
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/leaderboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-800/60 text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                >
                  <span>🏆 Leaderboard</span>
                </Link>
                {isTrainer && (
                  <Link
                    href="/trainer"
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-700 text-xs font-mono font-bold transition-all shadow-[0_0_15px_rgba(147,51,234,0.3)]"
                  >
                    <span>⚡ God Mode Dashboard</span>
                  </Link>
                )}
                <div className="flex items-center gap-2.5 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-zinc-800">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name || 'User Avatar'}
                      className="h-6 w-6 rounded-full border border-zinc-700 object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white">
                      {(session.user.name || 'U').charAt(0)}
                    </div>
                  )}
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-medium text-zinc-200 leading-tight">
                      {session.user.name || 'Student'}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono leading-tight">
                      {session.user.role || 'STUDENT'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => signOut()}
                  className="text-xs text-zinc-400 hover:text-rose-400 font-mono px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-rose-900 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('github')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs transition-all shadow-md cursor-pointer font-mono"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                Sign In with GitHub
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <main className="max-w-7xl mx-auto w-full flex-1 px-4 py-6 sm:px-8 sm:py-8 flex flex-col gap-6">
        {/* Assignment Hero Header */}
        <section className="bg-zinc-900/60 rounded-2xl border border-zinc-800 p-5 sm:p-6 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-zinc-800 text-cyan-400 border border-zinc-700">
                  Module {assignment.module}
                </span>
                <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-purple-950/60 text-purple-300 border border-purple-800/60 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse"></span>
                  {assignment.validationType} Validation
                </span>
                {isMostRecentPassed && (
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1 font-semibold">
                    ✓ Module Completed
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-50 tracking-tight">
                {assignment.title}
              </h1>
              <div
                className="text-zinc-400 text-sm mt-1 max-w-3xl leading-relaxed"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(assignment.description),
                }}
              />
            </div>

            {/* User Session Quick Card */}
            <div className="flex items-center gap-4 bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/80 text-xs font-mono self-start md:self-auto">
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Submissions</span>
                <span className="text-emerald-400 font-bold block">{submissions.length} Attempts</span>
              </div>
              <div className="h-8 w-px bg-zinc-800"></div>
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase tracking-wider">Role</span>
                <span className="text-emerald-400 font-semibold uppercase block">
                  {session?.user?.role || 'Guest'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Passed Status & Resubmit Banner */}
        {isMostRecentPassed && !isUnlockedForEdit && (
          <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-lg">
                ✓
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-200">Assignment Passed!</h3>
                <p className="text-xs text-emerald-400/90 mt-0.5">
                  The editor is read-only to prevent accidental overwrites. Click &quot;Edit / Resubmit&quot; to modify your solution.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsUnlockedForEdit(true)}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-md cursor-pointer whitespace-nowrap self-stretch sm:self-auto text-center"
            >
              🔓 Edit / Resubmit Code
            </button>
          </div>
        )}

        {/* 2-Column Interactive Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Code Editor & Submission History (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Code Editor Window */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col">
              {/* Window Bar / Tab Controls */}
              <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 mr-2">
                    <span className="h-3 w-3 rounded-full bg-rose-500/80 inline-block"></span>
                    <span className="h-3 w-3 rounded-full bg-amber-500/80 inline-block"></span>
                    <span className="h-3 w-3 rounded-full bg-emerald-500/80 inline-block"></span>
                  </div>
                  <div className="flex items-center gap-2 bg-zinc-900 px-3 py-1 rounded-md border border-zinc-800 text-xs font-mono text-zinc-300">
                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    {assignment.validationType === 'DYNAMIC' ? 'e2e.spec.ts' : 'index.html'}
                  </div>
                </div>

                {/* Preset Loaders */}
                <div className="flex items-center gap-2">
                  {(assignment.passingSample || PASSING_SAMPLE || DYNAMIC_PLAYWRIGHT_SAMPLE) && (
                    <button
                      type="button"
                      onClick={() => {
                        const sampleToInsert =
                          assignment.passingSample ||
                          (assignment.validationType === 'DYNAMIC'
                            ? DYNAMIC_PLAYWRIGHT_SAMPLE
                            : PASSING_SAMPLE);
                        setHtmlCode(sampleToInsert);
                        setIsUnlockedForEdit(true);
                      }}
                      className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 active:scale-95 border border-emerald-800/60 px-2.5 py-1 rounded transition-all cursor-pointer"
                    >
                      + Passing Sample
                    </button>
                  )}

                  {(assignment.failingSample || (assignment.validationType !== 'DYNAMIC' && FAILING_SAMPLE)) && (
                    <button
                      type="button"
                      onClick={() => {
                        const sampleToInsert = assignment.failingSample || FAILING_SAMPLE;
                        setHtmlCode(sampleToInsert);
                        setIsUnlockedForEdit(true);
                      }}
                      className="text-[11px] font-mono text-rose-400 bg-rose-950/40 hover:bg-rose-900/60 active:scale-95 border border-rose-800/60 px-2.5 py-1 rounded transition-all cursor-pointer"
                    >
                      + Failing Sample
                    </button>
                  )}
                </div>
              </div>

              {/* VS Code Monaco Editor Window */}
              <div className="relative bg-zinc-950 p-2 sm:p-3 font-mono text-sm w-full max-w-full overflow-hidden border-b border-zinc-800">
                <Editor
                  height="500px"
                  language={assignment.validationType === 'DYNAMIC' ? 'typescript' : 'html'}
                  theme="vs-dark"
                  value={htmlCode}
                  onChange={(value) => setHtmlCode(value || '')}
                  loading={
                    <div className="h-[500px] w-full flex flex-col items-center justify-center gap-3 bg-zinc-950 text-zinc-400 font-mono text-xs border border-zinc-800 rounded-xl">
                      <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                      <span>Loading VS Code engine...</span>
                    </div>
                  }
                  options={{
                    readOnly: !isUnlockedForEdit,
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    wordWrap: 'on',
                    automaticLayout: true,
                    tabSize: 2,
                    formatOnPaste: true,
                    contextmenu: true,
                  }}
                />
              </div>

              {/* Editor Footer / Submit CTA Bar */}
              <div className="bg-zinc-950/90 px-4 py-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4 text-xs font-mono text-zinc-400">
                  <span>Lines: {htmlCode.split('\n').length}</span>
                  <span>Chars: {htmlCode.length}</span>
                </div>

                {session?.user ? (
                  isUnlockedForEdit ? (
                    <button
                      type="button"
                      onClick={handleValidation}
                      disabled={isValidating || cooldown > 0}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-zinc-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isValidating ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-zinc-950" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>⚙️ Validating...</span>
                        </>
                      ) : cooldown > 0 ? (
                        <span>⏳ Please wait {cooldown}s</span>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Submit Code for Validation</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsUnlockedForEdit(true)}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-emerald-300 border border-zinc-700 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>🔓 Unlock Editor to Resubmit</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => signIn('github')}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-zinc-100 font-bold text-xs font-mono transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Sign In with GitHub to Submit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Validation Error Alert */}
            {submitError && (
              <div className="bg-rose-950/80 border border-rose-800 p-4 rounded-xl text-rose-200 text-sm flex items-start gap-3">
                <svg className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <h4 className="font-semibold text-rose-100">Submission Alert</h4>
                  <p className="text-xs text-rose-300 mt-1">{submitError}</p>
                </div>
                {(!session?.user || submitError.includes('expirat')) && (
                  <button
                    onClick={() => signIn('github')}
                    className="px-3 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 rounded text-xs font-mono transition-colors shrink-0"
                  >
                    Sign In
                  </button>
                )}
              </div>
            )}

            {/* Submission History Section ("Git Commit Log") */}
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400 text-xs font-mono font-bold">
                    ⌥
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">Submission History Log</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">Git commit history for this module</p>
                  </div>
                </div>

                <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                  {submissions.length} {submissions.length === 1 ? 'Attempt' : 'Attempts'}
                </span>
              </div>

              {submissions.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40 text-xs text-zinc-500 font-mono">
                  No submissions recorded yet for this module.
                </div>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub, idx) => {
                    const isSelected = selectedHistoryId === sub.id;
                    const isPass = sub.status === 'PASS';
                    const dateFormatted = new Date(sub.submittedAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    });

                    return (
                      <div
                        key={sub.id || idx}
                        onClick={() => loadHistorySubmission(sub)}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all cursor-pointer font-mono text-xs ${
                          isSelected
                            ? 'bg-zinc-800/90 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                            : 'bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-900 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Git Commit Dot Status */}
                          <div
                            className={`h-3 w-3 rounded-full flex-shrink-0 ${
                              isPass ? 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                            }`}
                          ></div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-zinc-200 truncate">
                                Attempt #{submissions.length - idx}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                  isPass
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                                }`}
                              >
                                {sub.status}
                              </span>
                            </div>
                            <span className="text-[11px] text-zinc-400 truncate mt-0.5">
                              {dateFormatted}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs font-bold text-zinc-300 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                            {sub.score}%
                          </span>
                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                              isSelected
                                ? 'bg-cyan-500 text-zinc-950'
                                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                            }`}
                          >
                            {isSelected ? 'Active Code' : 'Load Code'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: "Green Wall" Feedback UI (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-5 sm:p-6 shadow-xl flex flex-col gap-5 min-h-[500px]">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                    Green Wall Feedback
                  </h2>
                  <p className="text-xs text-zinc-400 font-mono mt-0.5">
                    {assignment.validationType === 'DYNAMIC'
                      ? 'Playwright Engine Analysis'
                      : 'Automated DOM Assertions'}
                  </p>
                </div>
                {validationResult && (
                  <span className="text-xs font-mono text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded border border-zinc-800">
                    Response 200 OK
                  </span>
                )}
              </div>

              {/* State 1: Awaiting Submission */}
              {!validationResult && !isValidating && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
                  <div className="h-12 w-12 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 mb-3">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-300">Ready to Evaluate</h3>
                  <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
                    Paste your HTML code on the left editor and click <strong>&quot;Submit Code&quot;</strong> to view real-time assertion feedback.
                  </p>
                  
                  <div className="mt-6 w-full text-left bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-[11px] font-mono text-zinc-400">
                    <span className="text-emerald-400 block font-semibold mb-1">// Assertion Requirements:</span>
                    <ul className="space-y-1 list-disc list-inside text-zinc-400">
                      <li>Semantic <code className="text-zinc-200">&lt;main&gt;</code> tag</li>
                      <li>Element with <code className="text-zinc-200">id=&quot;add-task-section&quot;</code></li>
                      <li>Button with <code className="text-zinc-200">data-testid=&quot;submit-btn&quot;</code></li>
                    </ul>
                  </div>
                </div>
              )}

              {/* State 2: Validating Loader */}
              {isValidating && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border border-zinc-800 rounded-xl bg-zinc-950/60">
                  <div className="relative mb-4">
                    <div className="w-14 h-14 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping"></span>
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-200">Parsing HTML AST</h3>
                  <p className="text-xs text-zinc-400 mt-1 font-mono">Running Cheerio static inspectors...</p>
                </div>
              )}

              {/* State 3: Rendered Results ("Green Wall") */}
              {validationResult && !isValidating && (
                <div className="flex flex-col gap-5">
                  {/* Overall Status Banner */}
                  <div
                    className={`rounded-xl p-5 border shadow-lg transition-all ${
                      validationResult.status === 'pass'
                        ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                        : 'bg-rose-950/40 border-rose-500/50 shadow-[0_0_30px_rgba(244,63,94,0.15)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-12 w-12 rounded-xl flex items-center justify-center font-black text-2xl ${
                            validationResult.status === 'pass'
                              ? 'bg-emerald-500 text-zinc-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                              : 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                          }`}
                        >
                          {validationResult.status === 'pass' ? '✓' : '✕'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded ${
                                validationResult.status === 'pass'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              Status: {validationResult.status.toUpperCase()}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-zinc-50 mt-1">
                            {validationResult.status === 'pass'
                              ? 'All Checks Passed!'
                              : 'Validation Failed'}
                          </h3>
                        </div>
                      </div>

                      {/* Score Badge Gauge */}
                      <div className="flex flex-col items-end">
                        <span className="text-3xl font-black font-mono tracking-tight text-zinc-50">
                          {validationResult.score}%
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-mono">
                          Score
                        </span>
                      </div>
                    </div>

                    {/* Progress Score Bar */}
                    <div className="mt-4 w-full bg-zinc-950 h-2 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          validationResult.status === 'pass' ? 'bg-emerald-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${validationResult.score}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Module Unlocked CTA Banner */}
                  {validationResult.status === 'pass' && (
                    <div className="bg-emerald-950/60 border border-emerald-500/40 p-4 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <span>🎉 Module Passed!</span>
                        </div>
                        <p className="text-[11px] text-emerald-400/90 mt-0.5">
                          Next module in curriculum is now unlocked on your Dashboard.
                        </p>
                      </div>
                      <Link
                        href="/"
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-semibold text-xs hover:bg-emerald-400 transition-all font-mono shadow-md whitespace-nowrap"
                      >
                        Dashboard →
                      </Link>
                    </div>
                  )}

                  {/* Assertion Breakdown Checklist */}
                  <div className="flex flex-col gap-3">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold px-1">
                      Assertion Results ({validationResult.feedback.filter((f) => f.passed).length}/
                      {validationResult.feedback.length})
                    </h4>

                    <div className="space-y-2.5">
                      {validationResult.feedback.map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-3.5 rounded-xl border flex items-start gap-3 transition-all ${
                            item.passed
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-100'
                              : 'bg-rose-950/20 border-rose-800/40 text-rose-100'
                          }`}
                        >
                          {/* Assertion Status Icon */}
                          <div
                            className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                              item.passed
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {item.passed ? '✅' : '❌'}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className="text-sm font-semibold text-zinc-100 truncate">{item.check}</h5>
                              <span
                                className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded ${
                                  item.passed
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                                }`}
                              >
                                {item.passed ? 'PASS' : 'FAIL'}
                              </span>
                            </div>
                            <p className="text-xs mt-1 leading-relaxed text-zinc-300">{item.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
