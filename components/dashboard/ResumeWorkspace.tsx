"use client";

import { FileText, Sparkles, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

export function ResumeWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <section className="mt-8">
      <div className="glass relative overflow-hidden rounded-2xl p-8">
        {/* Aurora glow */}
        <div
          aria-hidden="true"
          className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-violet-600/10 blur-[80px]"
        />

        <div className="relative">
          {/* Heading */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linear-to-br from-violet-600/20 to-cyan-400/20 text-indigo-300">
              <FileText size={18} />
            </div>

            <p className="text-sm font-medium text-indigo-400">
              Career Workspace
            </p>
          </div>

          <h3 className="font-heading mt-4 text-2xl font-semibold text-white">
            Start with your resume
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Upload your resume and let ElevAI analyze your experience,
            skills, ATS compatibility, and career opportunities.
          </p>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Empty state */}
          {!selectedFile && (
            <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-slate-400">
                <Upload size={24} />
              </div>

              <h4 className="mt-4 font-medium text-white">
                Upload your resume
              </h4>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                PDF, DOC, or DOCX files are supported.
              </p>

              <button
                type="button"
                onClick={handleChooseFile}
                className="aurora-gradient mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02]"
              >
                <Upload size={17} />
                Choose Resume
              </button>
            </div>
          )}

          {/* Selected file */}
          {selectedFile && (
            <div className="mt-8 rounded-2xl border border-indigo-400/20 bg-indigo-500/[0.05] p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-600/20 to-cyan-400/20 text-indigo-300">
                    <FileText size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveFile}
                  aria-label="Remove selected resume"
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="aurora-gradient inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02]"
                >
                  <Sparkles size={17} />
                  Analyze Resume
                </button>

                <button
                  type="button"
                  onClick={handleChooseFile}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                >
                  Choose Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}