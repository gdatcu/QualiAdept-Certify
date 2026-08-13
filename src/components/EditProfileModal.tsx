'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfileData {
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  publicEmail?: string | null;
  aboutMe?: string | null;
  isProfilePublic?: boolean | null;
}

interface EditProfileModalProps {
  initialData?: UserProfileData;
}

export default function EditProfileModal({ initialData }: EditProfileModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [aboutMe, setAboutMe] = useState(initialData?.aboutMe || '');
  const [linkedinUrl, setLinkedinUrl] = useState(initialData?.linkedinUrl || '');
  const [githubUrl, setGithubUrl] = useState(initialData?.githubUrl || '');
  const [publicEmail, setPublicEmail] = useState(initialData?.publicEmail || '');
  const [isProfilePublic, setIsProfilePublic] = useState<boolean>(
    initialData?.isProfilePublic !== false
  );

  // Sync state whenever modal is opened or initialData updates
  useEffect(() => {
    if (isOpen && initialData) {
      setAboutMe(initialData.aboutMe || '');
      setLinkedinUrl(initialData.linkedinUrl || '');
      setGithubUrl(initialData.githubUrl || '');
      setPublicEmail(initialData.publicEmail || '');
      setIsProfilePublic(initialData.isProfilePublic !== false);
    }
  }, [isOpen, initialData]);

  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMsg(false);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          aboutMe,
          linkedinUrl,
          githubUrl,
          publicEmail,
          isProfilePublic,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to update profile settings.');
      }

      setSuccessMsg(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccessMsg(false);
        router.refresh();
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred while saving profile.';
      setErrorMessage(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex items-center gap-2 cursor-pointer shadow-md"
      >
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span>Edit Public Profile</span>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 p-4 sm:p-6 overflow-y-auto flex justify-center items-start sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative my-auto max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header (Fixed) */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  ⚙
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-100">Public Profile Settings</h3>
                  <p className="text-xs text-zinc-400 font-mono">Visible on your public portfolio page</p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                type="button"
                className="text-zinc-400 hover:text-zinc-200 text-sm font-mono p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Form Container */}
            <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between overflow-hidden">
              {/* Scrollable Form Body */}
              <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 pb-2">
                {/* Public Profile Privacy Toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950 border border-zinc-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-200">
                        Make Profile Public
                      </span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          isProfilePublic
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {isProfilePublic ? 'PUBLIC' : 'PRIVATE'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 block mt-1">
                      {isProfilePublic
                        ? 'Anyone with your link can view your portfolio'
                        : 'Portfolio access is locked with 🔒 Private Guard'}
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isProfilePublic}
                      onChange={(e) => setIsProfilePublic(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* About Me */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-semibold text-zinc-300">
                    About Me / Bio
                  </label>
                  <textarea
                    value={aboutMe}
                    onChange={(e) => setAboutMe(e.target.value)}
                    placeholder="Tell recruiters about your QA Automation background, tools you use, and career goals..."
                    rows={3}
                    maxLength={300}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                  <span className="text-[10px] font-mono text-zinc-500 text-right">
                    {aboutMe.length}/300 chars
                  </span>
                </div>

                {/* LinkedIn URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span className="text-blue-400">LinkedIn Profile URL</span>
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>

                {/* GitHub Profile URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span>GitHub Profile URL</span>
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/username"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>

                {/* Public Contact Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono font-semibold text-zinc-300 flex items-center gap-1.5">
                    <span>Public Contact Email</span>
                  </label>
                  <input
                    type="email"
                    value={publicEmail}
                    onChange={(e) => setPublicEmail(e.target.value)}
                    placeholder="alex.developer@qualiadept.eu"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                  />
                </div>

                {/* Error / Success Feedback */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs font-mono">
                    {errorMessage}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-mono">
                    ✓ Profile settings saved successfully!
                  </div>
                )}
              </div>

              {/* Form Buttons (Fixed Footer) */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800 shrink-0 bg-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs font-mono transition-all shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? (
                    <span>Saving...</span>
                  ) : (
                    <span>Save Profile</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
