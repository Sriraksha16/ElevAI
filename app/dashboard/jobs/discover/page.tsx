"use client";

import { useState } from "react";
import {
  BriefcaseBusiness,
  ExternalLink,
  MapPin,
  Search,
  Sparkles,
  Bookmark,
  Loader2,
  Building2,
  Clock3,
  DollarSign,
} from "lucide-react";

import { PageBackLink } from "@/components/dashboard/PageBackLink";

type Job = {
  id: string;
  title: string;
  company: string;
  companyLogo: string | null;
  category: string;
  jobType: string;
  publishedAt: string;
  location: string;
  salary: string;
  description: string;
  url: string;
  source: string;
};

type ApiResponse = {
  success?: unknown;
  message?: unknown;
  count?: unknown;
  jobs?: unknown;
};

function normalizeJob(value: unknown): Job | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const job = value as Record<string, unknown>;

  if (
    typeof job.id !== "string" ||
    !job.id.trim() ||
    typeof job.title !== "string" ||
    !job.title.trim() ||
    typeof job.company !== "string" ||
    !job.company.trim() ||
    typeof job.url !== "string"
  ) {
    return null;
  }

  try {
    const url = new URL(job.url);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
  } catch {
    return null;
  }

  return {
    id: job.id,
    title: job.title,
    company: job.company,
    companyLogo:
      typeof job.companyLogo === "string"
        ? job.companyLogo
        : null,
    category:
      typeof job.category === "string"
        ? job.category
        : "",
    jobType:
      typeof job.jobType === "string"
        ? job.jobType
        : "",
    publishedAt:
      typeof job.publishedAt === "string"
        ? job.publishedAt
        : "",
    location:
      typeof job.location === "string"
        ? job.location
        : "",
    salary:
      typeof job.salary === "string"
        ? job.salary
        : "",
    description:
      typeof job.description === "string"
        ? job.description
        : "",
    url: job.url,
    source:
      typeof job.source === "string"
        ? job.source
        : "",
  };
}

const categories = [
  {
    value: "",
    label: "All Categories",
  },
  {
    value: "software-dev",
    label: "Software Development",
  },
  {
    value: "devops",
    label: "DevOps",
  },
  {
    value: "data",
    label: "Data",
  },
  {
    value: "design",
    label: "Design",
  },
  {
    value: "product",
    label: "Product",
  },
  {
    value: "marketing",
    label: "Marketing",
  },
];

export default function JobDiscoveryPage() {
  const [search, setSearch] = useState("");

  const [category, setCategory] =
    useState("");

  const [jobs, setJobs] = useState<Job[]>([]);

  const [isSearching, setIsSearching] =
    useState(false);

  const [hasSearched, setHasSearched] =
    useState(false);

  const [error, setError] = useState("");

  const [savedJobs, setSavedJobs] =
    useState<string[]>([]);

  async function handleSearch() {
    setIsSearching(true);
    setError("");
    setHasSearched(true);

    try {
      const params = new URLSearchParams();

      if (search.trim()) {
        params.set(
          "search",
          search.trim()
        );
      }

      if (category) {
        params.set("category", category);
      }

      const response = await fetch(
        `/api/jobs/search?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const payload: unknown = await response.json();

      if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload)
      ) {
        throw new Error(
          "The job search returned an invalid response."
        );
      }

      const data = payload as ApiResponse;

      if (!response.ok || data.success !== true) {
        throw new Error(
          (typeof data.message === "string" && data.message) ||
            "Unable to search for jobs."
        );
      }

      if (!Array.isArray(data.jobs)) {
        throw new Error(
          "The job search returned an invalid response."
        );
      }

      const validJobs = data.jobs
        .map(normalizeJob)
        .filter((job): job is Job => job !== null);

      if (data.jobs.length > 0 && validJobs.length === 0) {
        throw new Error(
          "The job provider returned no valid job listings."
        );
      }

      setJobs(validJobs);
    } catch (error) {
      setJobs([]);

      setError(
        error instanceof SyntaxError
          ? "The job search returned an invalid response."
          : error instanceof TypeError
            ? "Unable to reach the job search service. Please try again."
            : error instanceof Error
              ? error.message
              : "Something went wrong while searching for jobs."
      );
    } finally {
      setIsSearching(false);
    }
  }

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  function toggleSaved(jobId: string) {
    setSavedJobs((current) => {
      if (current.includes(jobId)) {
        return current.filter(
          (id) => id !== jobId
        );
      }

      return [...current, jobId];
    });
  }

  function formatDate(date: string) {
    if (!date) {
      return "";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "";
    }

    return parsed.toLocaleDateString(
      undefined,
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  }

  function cleanDescription(
    description: string
  ) {
    return description
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-8">

        <PageBackLink />

        {/* HEADER */}

        <div className="mt-8">
          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
              <BriefcaseBusiness className="h-6 w-6 text-indigo-400" />
            </div>

            <div>
              <p className="text-sm font-medium text-indigo-400">
                Career Management
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Job Discovery
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Search remote opportunities and
                connect them directly with your
                ElevAI career tools.
              </p>
            </div>

          </div>
        </div>

        {/* SEARCH */}

        <section className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6">

          <div className="grid gap-4 lg:grid-cols-[1fr_240px_auto]">

            {/* Search */}

            <div className="relative">

              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Search jobs, skills or technologies..."
                className="h-12 w-full rounded-xl border border-white/10 bg-black/20 pl-11 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-600 focus:border-indigo-400/40"
              />

            </div>

            {/* Category */}

            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className="h-12 rounded-xl border border-white/10 bg-[#0b101b] px-4 text-sm text-slate-300 outline-none focus:border-indigo-400/40"
            >
              {categories.map((item) => (
                <option
                  key={item.value}
                  value={item.value}
                >
                  {item.label}
                </option>
              ))}
            </select>

            {/* Search button */}

            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-6 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search Jobs
                </>
              )}
            </button>

          </div>

          <div className="mt-4 flex flex-wrap gap-2">

            {[
              "React",
              ".NET",
              "AWS",
              "Frontend Developer",
              "Cloud Developer",
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => {
                  setSearch(suggestion);
                }}
                className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-slate-500 transition hover:border-indigo-400/30 hover:text-indigo-300"
              >
                {suggestion}
              </button>
            ))}

          </div>

        </section>

        {/* ERROR */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* RESULTS */}

        {hasSearched && !isSearching && !error && (
          <div className="mt-8">

            <div className="mb-5 flex items-center justify-between">

              <div>
                <h2 className="text-xl font-semibold">
                  Job Opportunities
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {jobs.length} opportunities found
                </p>
              </div>

            </div>

            {jobs.length === 0 ? (
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">

                <Search className="mx-auto h-8 w-8 text-slate-600" />

                <h3 className="mt-4 font-medium text-slate-300">
                  No jobs found
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Try a different keyword or category.
                </p>

              </section>
            ) : (
              <div className="grid gap-5">

                {jobs.map((job) => {
                  const isSaved =
                    savedJobs.includes(job.id);

                  return (
                    <article
                      key={job.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-white/15"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                        {/* JOB INFO */}

                        <div className="min-w-0">

                          <div className="flex items-start gap-4">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">

                              {job.companyLogo ? (
                                <img
                                  src={job.companyLogo}
                                  alt=""
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <Building2 className="h-5 w-5 text-slate-500" />
                              )}

                            </div>

                            <div className="min-w-0">

                              <h3 className="text-lg font-semibold text-slate-100">
                                {job.title}
                              </h3>

                              <p className="mt-1 text-sm text-slate-400">
                                {job.company}
                              </p>

                            </div>

                          </div>

                          {/* META */}

                          <div className="mt-4 flex flex-wrap gap-2">

                            {job.location && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-slate-400">
                                <MapPin className="h-3 w-3" />
                                {job.location}
                              </span>
                            )}

                            {job.jobType && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-slate-400">
                                <Clock3 className="h-3 w-3" />
                                {job.jobType.replace(
                                  /_/g,
                                  " "
                                )}
                              </span>
                            )}

                            {job.salary && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 text-xs text-slate-400">
                                <DollarSign className="h-3 w-3" />
                                {job.salary}
                              </span>
                            )}

                          </div>

                          {/* DESCRIPTION */}

                          <p className="mt-5 max-w-4xl text-sm leading-6 text-slate-500">
                            {cleanDescription(
                              job.description
                            ).slice(0, 500)}
                            {cleanDescription(
                              job.description
                            ).length > 500
                              ? "..."
                              : ""}
                          </p>

                          {/* SOURCE */}

                          <p className="mt-4 text-xs text-slate-600">
                            Source:{" "}
                            {job.source}
                            {job.publishedAt
                              ? ` • Published ${formatDate(
                                  job.publishedAt
                                )}`
                              : ""}
                          </p>

                        </div>

                        {/* ACTIONS */}

                        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col">

                          <button
                            type="button"
                            onClick={() =>
                              toggleSaved(job.id)
                            }
                            className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${
                              isSaved
                                ? "border-indigo-400/30 bg-indigo-500/10 text-indigo-300"
                                : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                            }`}
                          >
                            <Bookmark
                              className={`h-4 w-4 ${
                                isSaved
                                  ? "fill-current"
                                  : ""
                              }`}
                            />

                            {isSaved
                              ? "Saved"
                              : "Save Job"}
                          </button>

                          <a
                            href={job.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Job
                          </a>

                          <button
                            type="button"
                            onClick={() => {
                              window.location.href =
                                `/dashboard/jobs?jobTitle=${encodeURIComponent(
                                  job.title
                                )}&company=${encodeURIComponent(
                                  job.company
                                )}&jobUrl=${encodeURIComponent(
                                  job.url
                                )}`;
                            }}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500/10 px-4 py-2.5 text-sm text-indigo-300 transition hover:bg-indigo-500/20"
                          >
                            <Sparkles className="h-4 w-4" />
                            Add to Tracker
                          </button>

                        </div>

                      </div>

                    </article>
                  );
                })}

              </div>
            )}

          </div>
        )}

        {/* INITIAL STATE */}

        {!hasSearched && (
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
              <Sparkles className="h-6 w-6 text-indigo-400" />
            </div>

            <h2 className="mt-5 text-xl font-semibold">
              Find your next opportunity
            </h2>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Search remote jobs by role, technology,
              skill or category. Start with something
              like React, AWS, .NET or Cloud Developer.
            </p>

          </section>
        )}

        {/* ATTRIBUTION */}

        <p className="mt-8 text-center text-xs text-slate-600">
          Job listings provided by Remotive. Please
          use the original listing to apply.
        </p>

      </div>
    </main>
  );
}