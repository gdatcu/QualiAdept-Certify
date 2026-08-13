'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface UserRelation {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  role: string;
  createdAt: Date | string;
}

export interface AssignmentRelation {
  id: string;
  title: string;
  description: string;
  module: number;
  validationType: string;
  isActive: boolean;
}

export interface SubmissionRecord {
  id: string;
  userId: string;
  assignmentId: string;
  codePayload: string;
  status: string;
  score: number;
  feedbackJSON: string;
  submittedAt: Date | string;
  user: UserRelation;
  assignment: AssignmentRelation;
}

interface SubmissionsTableProps {
  initialSubmissions: SubmissionRecord[];
}

interface ParsedFeedback {
  status?: string;
  score?: number;
  manualOverride?: boolean;
  overriddenAt?: string;
  feedback?: Array<{
    check: string;
    passed: boolean;
    message: string;
  }>;
}

export default function SubmissionsTable({ initialSubmissions }: SubmissionsTableProps) {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>(initialSubmissions);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, 'code' | 'feedback'>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASS' | 'FAIL' | 'PENDING'>('ALL');
  const [overridingId, setOverridingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toggle row expansion
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    if (!activeTab[id]) {
      setActiveTab((prev) => ({ ...prev, [id]: 'feedback' }));
    }
  };

  // Switch tab inside expanded details
  const setTab = (id: string, tab: 'code' | 'feedback') => {
    setActiveTab((prev) => ({ ...prev, [id]: tab }));
  };

  // Copy raw HTML payload
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Force Pass manual override
  const handleForcePass = async (submissionId: string) => {
    setOverridingId(submissionId);
    setActionError((prev) => ({ ...prev, [submissionId]: '' }));

    try {
      const res = await fetch('/api/trainer/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      const updatedRecord: SubmissionRecord = data.submission;

      // Update state locally
      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === submissionId ? updatedRecord : sub))
      );

      // Revalidate server components in background
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to override submission.';
      setActionError((prev) => ({ ...prev, [submissionId]: msg }));
    } finally {
      setOverridingId(null);
    }
  };

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const userName = (sub.user.name || '').toLowerCase();
    const userEmail = (sub.user.email || '').toLowerCase();
    const assignmentTitle = (sub.assignment.title || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      userName.includes(query) ||
      userEmail.includes(query) ||
      assignmentTitle.includes(query);

    const matchesStatus =
      statusFilter === 'ALL' || sub.status.toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const parseFeedback = (rawJson: string): ParsedFeedback => {
    try {
      return JSON.parse(rawJson);
    } catch {
      return { feedback: [] };
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Controls Bar: Search & Filter */}
      <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, email, assignment..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-purple-500 font-mono transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800/80 text-xs font-mono self-start sm:self-auto">
          {(['ALL', 'PASS', 'FAIL', 'PENDING'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                statusFilter === st
                  ? st === 'PASS'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold'
                    : st === 'FAIL'
                    ? 'bg-rose-950 text-rose-300 border border-rose-800 font-bold'
                    : st === 'PENDING'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800 font-bold'
                    : 'bg-purple-950 text-purple-300 border border-purple-800 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans border-collapse">
            <thead>
              <tr className="bg-zinc-950/90 text-zinc-400 font-mono border-b border-zinc-800/80 text-[11px] uppercase tracking-wider">
                <th className="py-3.5 px-4 w-10 text-center"></th>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Assignment</th>
                <th className="py-3.5 px-4">Submitted At</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 px-4 text-center text-zinc-400 bg-zinc-950/40">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <span className="font-semibold text-zinc-300">No Submissions Found</span>
                      <p className="text-xs text-zinc-400 max-w-sm">
                        {submissions.length === 0
                          ? 'No student code submissions have been recorded yet.'
                          : 'No submissions match your active filter criteria.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const isExpanded = expandedId === sub.id;
                  const feedbackData = parseFeedback(sub.feedbackJSON);
                  const isPass = sub.status.toUpperCase() === 'PASS';
                  const isFail = sub.status.toUpperCase() === 'FAIL';
                  const currentTab = activeTab[sub.id] || 'feedback';
                  const displayName = sub.user.name || 'Anonymous Student';
                  const displayEmail = sub.user.email || 'No email registered';

                  return (
                    <tr
                      key={sub.id}
                      className={`group transition-colors ${
                        isExpanded ? 'bg-zinc-950/80' : 'hover:bg-zinc-950/50'
                      }`}
                    >
                      {/* Sub-wrapper row content */}
                      <td colSpan={7} className="p-0">
                        <div className="grid grid-cols-12 items-center py-3.5 px-4 gap-2">
                          {/* Toggle Expand Arrow */}
                          <div className="col-span-1 flex items-center justify-center">
                            <button
                              onClick={() => toggleExpand(sub.id)}
                              className="h-7 w-7 rounded-md hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                              title={isExpanded ? 'Collapse' : 'Expand Details'}
                            >
                              <svg
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-90 text-purple-400' : ''
                                }`}
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>

                          {/* Student Info */}
                          <div className="col-span-3 flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0">
                              {displayName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-zinc-100 block truncate">{displayName}</span>
                              <span className="text-[11px] text-zinc-400 font-mono block truncate">{displayEmail}</span>
                            </div>
                          </div>

                          {/* Assignment Info */}
                          <div className="col-span-3 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-cyan-400">
                                Mod {sub.assignment.module}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                                {sub.assignment.validationType}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-zinc-200 block truncate" title={sub.assignment.title}>
                              {sub.assignment.title}
                            </span>
                          </div>

                          {/* Submitted Timestamp */}
                          <div className="col-span-2 text-xs font-mono text-zinc-400">
                            {new Date(sub.submittedAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>

                          {/* Score Gauge */}
                          <div className="col-span-1 text-center font-mono font-bold text-sm">
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                isPass
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80'
                                  : isFail
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800/80'
                                  : 'bg-amber-950 text-amber-400 border border-amber-800/80'
                              }`}
                            >
                              {sub.score}%
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="col-span-1 text-center">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                                isPass
                                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                  : isFail
                                  ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                                  : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                              }`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  isPass ? 'bg-emerald-400' : isFail ? 'bg-rose-400' : 'bg-amber-400 animate-pulse'
                                }`}
                              ></span>
                              {sub.status}
                            </span>
                          </div>

                          {/* Action Buttons */}
                          <div className="col-span-1 flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleExpand(sub.id)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono transition-colors cursor-pointer"
                            >
                              {isExpanded ? 'Hide' : 'Inspect'}
                            </button>
                          </div>
                        </div>

                        {/* EXPANDED ROW DETAILS VIEW */}
                        {isExpanded && (
                          <div className="bg-zinc-950/90 border-t border-b border-purple-900/30 p-5 font-sans space-y-4">
                            {/* Expanded Header & Tab Bar */}
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-zinc-400">Submission ID:</span>
                                <code className="text-xs font-mono text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800">
                                  {sub.id}
                                </code>
                                {feedbackData.manualOverride && (
                                  <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    ⚡ Manually Overridden
                                  </span>
                                )}
                              </div>

                              {/* Tab Switches */}
                              <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs font-mono">
                                <button
                                  onClick={() => setTab(sub.id, 'feedback')}
                                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                                    currentTab === 'feedback'
                                      ? 'bg-purple-950 text-purple-200 border border-purple-800 font-bold'
                                      : 'text-zinc-400 hover:text-zinc-200'
                                  }`}
                                >
                                  Assertions Breakdown
                                </button>
                                <button
                                  onClick={() => setTab(sub.id, 'code')}
                                  className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                                    currentTab === 'code'
                                      ? 'bg-purple-950 text-purple-200 border border-purple-800 font-bold'
                                      : 'text-zinc-400 hover:text-zinc-200'
                                  }`}
                                >
                                  Raw Student Code ({sub.codePayload.length} bytes)
                                </button>
                              </div>
                            </div>

                            {/* TAB 1: ASSERTIONS BREAKDOWN */}
                            {currentTab === 'feedback' && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                                    Automated Test Suite Assertions
                                  </h4>
                                  <span className="text-xs font-mono text-zinc-400">
                                    Score: <strong className="text-zinc-200">{sub.score}%</strong>
                                  </span>
                                </div>

                                {feedbackData.feedback && feedbackData.feedback.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {feedbackData.feedback.map((chk, i) => (
                                      <div
                                        key={i}
                                        className={`p-3 rounded-xl border flex items-start gap-3 ${
                                          chk.passed
                                            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                                            : 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                                        }`}
                                      >
                                        <div className="mt-0.5 text-base flex-shrink-0">
                                          {chk.passed ? '✅' : '❌'}
                                        </div>
                                        <div className="min-w-0">
                                          <span className="font-semibold text-xs text-zinc-100 block">
                                            {chk.check}
                                          </span>
                                          <p className="text-xs text-zinc-300 mt-0.5">{chk.message}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-zinc-400 bg-zinc-900 p-3 rounded-lg border border-zinc-800 font-mono">
                                    No detailed feedback items recorded for this submission.
                                  </div>
                                )}
                              </div>
                            )}

                            {/* TAB 2: RAW CODE PAYLOAD */}
                            {currentTab === 'code' && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-mono text-zinc-400">
                                    Student Submitted Code Payload
                                  </span>
                                  <button
                                    onClick={() => handleCopyCode(sub.id, sub.codePayload)}
                                    className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    {copiedId === sub.id ? (
                                      <span className="text-emerald-400 font-semibold">✓ Copied!</span>
                                    ) : (
                                      <>
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        Copy Code
                                      </>
                                    )}
                                  </button>
                                </div>
                                <pre className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-80 selection:bg-emerald-500/30">
                                  <code>{sub.codePayload}</code>
                                </pre>
                              </div>
                            )}

                            {/* MANUAL OVERRIDE FOOTER */}
                            <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3">
                              <div className="text-xs text-zinc-400 font-mono">
                                {isPass ? (
                                  <span className="text-emerald-400 flex items-center gap-1">
                                    ✓ Submission meets all pass requirements.
                                  </span>
                                ) : (
                                  <span className="text-rose-400">
                                    ⚠ Submission currently marked as FAILED.
                                  </span>
                                )}
                              </div>

                              {!isPass && (
                                <div className="flex items-center gap-3">
                                  {actionError[sub.id] && (
                                    <span className="text-xs text-rose-400 font-mono">
                                      {actionError[sub.id]}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleForcePass(sub.id)}
                                    disabled={overridingId === sub.id}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-zinc-950 font-mono font-bold text-xs shadow-lg hover:shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                                  >
                                    {overridingId === sub.id ? (
                                      <>
                                        <svg className="animate-spin h-3.5 w-3.5 text-zinc-950" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Overriding...</span>
                                      </>
                                    ) : (
                                      <>
                                        <span>⚡ Force Pass (Override to 100%)</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
