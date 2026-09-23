"use client";

import {
  FileText,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";

import type { ResumeAnalysis } from "@/lib/ai/resume-analyzer";
import type { ResumeScores } from "@/lib/scoring/resume-score";

type ResumeWorkspaceProps = {
  onAnalysisComplete?: (
    analysis: ResumeAnalysis,
    scores: ResumeScores
  ) => void;

  onAnalysisReset?: () => void;
};

export function ResumeWorkspace({
  onAnalysisComplete,
  onAnalysisReset,
}: ResumeWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [error, setError] = useState("");

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [analysisMessage, setAnalysisMessage] =
    useState("");

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setAnalysisMessage("");

    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null);

      setError(
        "Please upload a PDF or DOCX file."
      );

      return;
    }

    if (file.size > maxSize) {
      setSelectedFile(null);

      setError(
        "Your resume must be smaller than 5 MB."
      );

      return;
    }

    setSelectedFile(file);

    // Clear previous dashboard results
    onAnalysisReset?.();
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError("");
    setAnalysisMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    onAnalysisReset?.();
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a resume first.");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setAnalysisMessage("");

    try {
      const formData = new FormData();

      formData.append(
        "resume",
        selectedFile
      );

      const response = await fetch(
        "/api/resume/analyze",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            "Resume analysis failed."
        );
      }

      if (!result.analysis) {
        throw new Error(
          "The resume was processed, but no AI analysis was returned."
        );
      }

      if (!result.scores) {
        throw new Error(
          "The resume was analyzed, but no scores were returned."
        );
      }

      onAnalysisComplete?.(
        result.analysis,
        result.scores
      );

      setAnalysisMessage(
        `Resume analyzed successfully. ATS score: ${result.scores.atsScore}%`
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while analyzing your resume."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <section className="mt-8">
      <div className="glass rounded-2xl p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-400" />

              <h3 className="font-heading text-lg font-semibold">
                Resume Intelligence
              </h3>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Upload your resume and let ElevAI analyze
              its structure, skills, ATS readiness, and
              career opportunities.
            </p>
          </div>
        </div>

        {/* Upload area */}
        {!selectedFile && (
          <button
  type="button"
  onClick={handleChooseFile}
  className="mx-auto mt-6 flex max-w-md flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-10 text-center transition hover:border-indigo-400/40 hover:bg-white/[0.04]"
>
  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
    <Upload className="h-5 w-5 text-indigo-400" />
  </div>

  <p className="mt-4 text-sm font-medium text-slate-200">
    Upload your resume
  </p>

  <p className="mt-1 text-xs text-slate-500">
    PDF or DOCX • Maximum 5 MB
  </p>
</button>
        )}

        {/* Selected file */}
        {selectedFile && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/2 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                <FileText className="h-5 w-5 text-indigo-400" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">
                  {selectedFile.name}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Remove resume"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Analyze button */}
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
             className="mt-4 flex w-fit min-w-[180px] mx-auto items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />

              {isAnalyzing
                ? "Analyzing resume..."
                : "Analyze Resume"}
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/5 px-4 py-3">
            <p className="text-sm text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* Success / status */}
        {analysisMessage && !error && (
          <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/5 px-4 py-3">
            <p className="text-sm text-emerald-300">
              {analysisMessage}
            </p>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </section>
  );
}