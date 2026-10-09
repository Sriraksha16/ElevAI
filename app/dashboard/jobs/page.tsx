"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import Link from "next/link";

import { PageBackLink } from "@/components/dashboard/PageBackLink";
import { JobAiActions } from "@/components/dashboard/JobAiActions";

type JobStatus =
  | "Saved"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

type JobTimelineEvent = {
  id: string;
  status: JobStatus;
  date: string;
  note: string;
};

type JobApplication = {
  id: string;
  company: string;
  position: string;
  jobUrl: string;
  jobDescription: string;
  applicationDate: string;
  status: JobStatus;
  notes: string;
  interviewDate: string;
  timeline: JobTimelineEvent[];
};

type JobForm = {
  company: string;
  position: string;
  jobUrl: string;
  jobDescription: string;
  applicationDate: string;
  status: JobStatus;
  notes: string;
  interviewDate: string;
};

type StatusFilter = "All" | JobStatus;

const statusOptions: JobStatus[] = [
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

const filterOptions: StatusFilter[] = [
  "All",
  "Saved",
  "Applied",
  "Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
];

const emptyForm: JobForm = {
  company: "",
  position: "",
  jobUrl: "",
  jobDescription: "",
  applicationDate: "",
  status: "Saved",
  notes: "",
  interviewDate: "",
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function createTimelineEvent(
  status: JobStatus,
  note = ""
): JobTimelineEvent {
  return {
    id: crypto.randomUUID(),
    status,
    date: getToday(),
    note,
  };
}

function getStatusClasses(status: JobStatus) {
  switch (status) {
    case "Applied":
      return "border-blue-400/20 bg-blue-400/10 text-blue-300";

    case "Interview":
      return "border-purple-400/20 bg-purple-400/10 text-purple-300";

    case "Offer":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

    case "Rejected":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "Withdrawn":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";

    default:
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }
}

function getTimelineDotClasses(status: JobStatus) {
  switch (status) {
    case "Applied":
      return "bg-blue-400";

    case "Interview":
      return "bg-purple-400";

    case "Offer":
      return "bg-emerald-400";

    case "Rejected":
      return "bg-red-400";

    case "Withdrawn":
      return "bg-orange-400";

    default:
      return "bg-slate-400";
  }
}

function formatTimelineDate(date: string) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [form, setForm] = useState<JobForm>(emptyForm);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("All");

  const [expandedTimeline, setExpandedTimeline] = useState<
    string | null
  >(null);

  /*
   * Load jobs from the database.
   *
   * IMPORTANT:
   * We no longer use localStorage.
   * The API automatically limits the results to
   * the currently signed-in user.
   */
  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      try {
        const response = await fetch("/api/jobs", {
          method: "GET",
          cache: "no-store",
        });

        const data = (await response.json()) as {
          success?: boolean;
          message?: string;
          jobs?: JobApplication[];
        };

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load your jobs."
          );
        }

        if (!cancelled) {
          setJobs(data.jobs ?? []);
        }
      } catch (error) {
        console.error(
          "Could not load job tracker data:",
          error
        );
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }

    void loadJobs();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Preserve the existing Job Match -> Job Tracker
   * URL prefill behaviour.
   */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const hasJobDetails = [
      "jobTitle",
      "company",
      "jobUrl",
    ].some((key) => params.has(key));

    if (!hasJobDetails) {
      return;
    }

    const position = params.get("jobTitle") || "";
    const company = params.get("company") || "";
    const jobUrl = params.get("jobUrl") || "";

    params.delete("jobTitle");
    params.delete("company");
    params.delete("jobUrl");

    const remainingQuery = params.toString();

    const nextUrl =
      `${window.location.pathname}${
        remainingQuery ? `?${remainingQuery}` : ""
      }${window.location.hash}`;

    const timeoutId = window.setTimeout(() => {
      setForm({
        ...emptyForm,
        position,
        company,
        jobUrl,
        applicationDate: getToday(),
      });

      setIsModalOpen(true);

      window.history.replaceState(
        null,
        "",
        nextUrl
      );
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredJobs = useMemo(() => {
    const normalizedSearch = searchQuery
      .trim()
      .toLowerCase();

    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === "All" ||
        job.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        job.company
          .toLowerCase()
          .includes(normalizedSearch) ||
        job.position
          .toLowerCase()
          .includes(normalizedSearch) ||
        job.notes
          .toLowerCase()
          .includes(normalizedSearch) ||
        job.jobDescription
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [jobs, searchQuery, statusFilter]);

  const appliedCount = jobs.filter(
    (job) => job.status === "Applied"
  ).length;

  const interviewCount = jobs.filter(
    (job) => job.status === "Interview"
  ).length;

  const offerCount = jobs.filter(
    (job) => job.status === "Offer"
  ).length;

  function openAddModal() {
    setEditingJobId(null);

    setForm({
      ...emptyForm,
      applicationDate: getToday(),
    });

    setIsModalOpen(true);
  }

  function openEditModal(job: JobApplication) {
    setEditingJobId(job.id);

    setForm({
      company: job.company,
      position: job.position,
      jobUrl: job.jobUrl,
      jobDescription: job.jobDescription,
      applicationDate: job.applicationDate,
      status: job.status,
      notes: job.notes,
      interviewDate: job.interviewDate,
    });

    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingJobId(null);
    setForm(emptyForm);
  }

  /*
   * Create or update a job through the database API.
   */
  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const company = form.company.trim();
    const position = form.position.trim();

    if (!company || !position) {
      return;
    }

    try {
      if (editingJobId) {
        const currentJob = jobs.find(
          (job) => job.id === editingJobId
        );

        if (!currentJob) {
          return;
        }

        const statusChanged =
          currentJob.status !== form.status;

        const timeline = statusChanged
          ? [
              ...currentJob.timeline,
              createTimelineEvent(
                form.status,
                `Status changed to ${form.status}.`
              ),
            ]
          : currentJob.timeline;

        const response = await fetch("/api/jobs", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingJobId,
            company,
            position,
            jobUrl: form.jobUrl.trim(),
            jobDescription:
              form.jobDescription.trim(),
            applicationDate:
              form.applicationDate,
            status: form.status,
            notes: form.notes.trim(),
            interviewDate:
              form.interviewDate,
            timeline,
          }),
        });

        const data = (await response.json()) as {
          success?: boolean;
          message?: string;
          job?: JobApplication;
        };

        if (
          !response.ok ||
          !data.success ||
          !data.job
        ) {
          throw new Error(
            data.message ||
              "Unable to update the job."
          );
        }

        setJobs((currentJobs) =>
          currentJobs.map((job) =>
            job.id === editingJobId && data.job
              ? data.job
              : job
          )
        );
      } else {
        const initialStatus = form.status;

        const timeline = [
          createTimelineEvent(
            initialStatus,
            "Application created in Job Tracker."
          ),
        ];

        const response = await fetch("/api/jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            company,
            position,
            jobUrl: form.jobUrl.trim(),
            jobDescription:
              form.jobDescription.trim(),
            applicationDate:
              form.applicationDate,
            status: initialStatus,
            notes: form.notes.trim(),
            interviewDate:
              form.interviewDate,
            timeline,
          }),
        });

        const data = (await response.json()) as {
          success?: boolean;
          message?: string;
          job?: JobApplication;
        };

        if (
          !response.ok ||
          !data.success ||
          !data.job
        ) {
          throw new Error(
            data.message ||
              "Unable to add the job."
          );
        }

        setJobs((currentJobs) => [
          data.job!,
          ...currentJobs,
        ]);
      }

      closeModal();
    } catch (error) {
      console.error(
        "Could not save job:",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to save the job."
      );
    }
  }

  /*
   * Delete the job from the database.
   */
  async function deleteJob(id: string) {
    const shouldDelete = window.confirm(
      "Delete this job from your tracker?"
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const response = await fetch("/api/jobs", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete the job."
        );
      }

      setJobs((currentJobs) =>
        currentJobs.filter(
          (job) => job.id !== id
        )
      );

      if (expandedTimeline === id) {
        setExpandedTimeline(null);
      }
    } catch (error) {
      console.error(
        "Could not delete job:",
        error
      );

      window.alert(
        error instanceof Error
          ? error.message
          : "Unable to delete the job."
      );
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setStatusFilter("All");
  }

  function toggleTimeline(id: string) {
    setExpandedTimeline((current) =>
      current === id ? null : id
    );
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <PageBackLink />

        {/* Header */}
        <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10">
                <BriefcaseBusiness className="h-5 w-5 text-indigo-400" />
              </div>

              <div>
                <p className="text-sm text-indigo-400">
                  Career Management
                </p>

                <h1 className="text-3xl font-semibold tracking-tight">
                  Job Tracker
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Keep track of jobs you save, applications you send,
              interviews you attend, and offers you receive.
              Everything stays organized in one place.
            </p>
          </div>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Add Job
          </button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Total Jobs
              </p>

              <BriefcaseBusiness className="h-5 w-5 text-indigo-400" />
            </div>

            <p className="mt-3 text-3xl font-semibold">
              {jobs.length}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Tracked in your account
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Applied
              </p>

              <CheckCircle2 className="h-5 w-5 text-blue-400" />
            </div>

            <p className="mt-3 text-3xl font-semibold">
              {appliedCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Applications submitted
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Interviews
              </p>

              <CalendarDays className="h-5 w-5 text-purple-400" />
            </div>

            <p className="mt-3 text-3xl font-semibold">
              {interviewCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Active interview stages
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Offers
              </p>

              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>

            <p className="mt-3 text-3xl font-semibold">
              {offerCount}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Offers received
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search company, position, notes..."
                className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/40"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {filterOptions.map((option) => {
                const active =
                  statusFilter === option;

                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setStatusFilter(option)
                    }
                    className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                      active
                        ? "bg-indigo-500 text-white"
                        : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}

              {(searchQuery || statusFilter !== "All") && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Jobs */}
        <div className="mt-6">
          {!isLoaded ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-white/10 border-t-indigo-400" />

              <p className="mt-4 text-sm text-slate-400">
                Loading your jobs...
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
                <BriefcaseBusiness className="h-6 w-6 text-indigo-400" />
              </div>

              <h2 className="mt-5 text-lg font-semibold">
                {jobs.length === 0
                  ? "Your job tracker is empty"
                  : "No matching jobs"}
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {jobs.length === 0
                  ? "Start tracking the opportunities you care about. Your jobs are securely saved to your ElevAI account."
                  : "Try changing your search or status filter."}
              </p>

              {jobs.length === 0 && (
                <button
                  type="button"
                  onClick={openAddModal}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  <Plus className="h-4 w-4" />
                  Add your first job
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const timelineOpen =
                  expandedTimeline === job.id;

                return (
                  <div
                    key={job.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/15"
                  >
                    <div className="p-5">
                      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                              <BriefcaseBusiness className="h-5 w-5 text-indigo-400" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="truncate text-lg font-semibold text-white">
                                  {job.position}
                                </h2>

                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClasses(
                                    job.status
                                  )}`}
                                >
                                  {job.status}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-slate-400">
                                {job.company}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-slate-600">
                                Application Date
                              </p>

                              <p className="mt-1 text-sm text-slate-300">
                                {job.applicationDate
                                  ? formatTimelineDate(
                                      job.applicationDate
                                    )
                                  : "Not set"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-slate-600">
                                Interview
                              </p>

                              <p className="mt-1 text-sm text-slate-300">
                                {job.interviewDate
                                  ? formatTimelineDate(
                                      job.interviewDate
                                    )
                                  : "Not scheduled"}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-slate-600">
                                Timeline
                              </p>

                              <button
                                type="button"
                                onClick={() =>
                                  toggleTimeline(job.id)
                                }
                                className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-300 transition hover:text-indigo-200"
                              >
                                {job.timeline.length} event
                                {job.timeline.length === 1
                                  ? ""
                                  : "s"}

                                <ChevronDown
                                  className={`h-4 w-4 transition ${
                                    timelineOpen
                                      ? "rotate-180"
                                      : ""
                                  }`}
                                />
                              </button>
                            </div>

                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-slate-600">
                                Job Link
                              </p>

                              {job.jobUrl ? (
                                <a
                                  href={job.jobUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-300 transition hover:text-indigo-200"
                                >
                                  Open posting
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </a>
                              ) : (
                                <p className="mt-1 text-sm text-slate-600">
                                  Not provided
                                </p>
                              )}
                            </div>
                          </div>

                          {job.jobDescription && (
                            <div className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4">
                              <p className="text-[11px] uppercase tracking-wider text-slate-600">
                                Job Description
                              </p>

                              <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                {job.jobDescription}
                              </p>
                            </div>
                          )}

                          {job.notes && (
                            <div className="mt-3 rounded-xl border border-white/5 bg-black/20 p-4">
                              <p className="text-[11px] uppercase tracking-wider text-slate-600">
                                Notes
                              </p>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                                {job.notes}
                              </p>
                            </div>
                          )}

                          <div className="mt-4">
                            <JobAiActions
                              position={job.position}
                              company={job.company}
                              jobDescription={
                                job.jobDescription
                              }
                              
                            />
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2 lg:ml-4">
                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(job)
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deleteJob(job.id)
                            }
                            className="inline-flex items-center gap-2 rounded-xl border border-red-400/10 bg-red-400/[0.04] px-3.5 py-2.5 text-sm text-red-300 transition hover:bg-red-400/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>

                    {timelineOpen && (
                      <div className="border-t border-white/10 bg-black/10 px-5 py-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">
                              Application Timeline
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Track how this application
                              progresses.
                            </p>
                          </div>
                        </div>

                        <div className="relative mt-5 space-y-5">
                          {job.timeline.map(
                            (event, index) => (
                              <div
                                key={event.id}
                                className="relative flex gap-4"
                              >
                                {index <
                                  job.timeline.length - 1 && (
                                  <div className="absolute left-[7px] top-5 h-full w-px bg-white/10" />
                                )}

                                <div
                                  className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full ring-4 ring-[#0a0f1a] ${getTimelineDotClasses(
                                    event.status
                                  )}`}
                                />

                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded-full border px-2 py-1 text-[10px] font-medium ${getStatusClasses(
                                        event.status
                                      )}`}
                                    >
                                      {event.status}
                                    </span>

                                    <span className="text-xs text-slate-600">
                                      {formatTimelineDate(
                                        event.date
                                      )}
                                    </span>
                                  </div>

                                  {event.note && (
                                    <p className="mt-2 text-sm leading-6 text-slate-400">
                                      {event.note}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add / Edit Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0b101c] shadow-2xl shadow-black/50">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#0b101c]/95 px-6 py-5 backdrop-blur-xl">
                <div>
                  <p className="text-sm text-indigo-400">
                    Career Management
                  </p>

                  <h2 className="mt-1 text-xl font-semibold">
                    {editingJobId
                      ? "Edit Job"
                      : "Add Job"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-5 p-6"
              >
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      Company
                    </label>

                    <input
                      type="text"
                      value={form.company}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          company:
                            event.target.value,
                        }))
                      }
                      placeholder="e.g. Spotify"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      Position
                    </label>

                    <input
                      type="text"
                      value={form.position}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          position:
                            event.target.value,
                        }))
                      }
                      placeholder="e.g. Frontend Developer"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Job URL
                  </label>

                  <input
                    type="url"
                    value={form.jobUrl}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        jobUrl: event.target.value,
                      }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Job Description
                  </label>

                  <textarea
                    value={form.jobDescription}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        jobDescription:
                          event.target.value,
                      }))
                    }
                    placeholder="Paste the job description here..."
                    rows={7}
                    className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/40"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      Application Date
                    </label>

                    <input
                      type="date"
                      value={form.applicationDate}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          applicationDate:
                            event.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/40"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-medium text-slate-400">
                      Status
                    </label>

                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status:
                            event.target.value as JobStatus,
                        }))
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/40"
                    >
                      {statusOptions.map(
                        (option) => (
                          <option
                            key={option}
                            value={option}
                            className="bg-[#0b101c]"
                          >
                            {option}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Interview Date
                  </label>

                  <input
                    type="date"
                    value={form.interviewDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        interviewDate:
                          event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-indigo-400/40"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-slate-400">
                    Notes
                  </label>

                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Add notes about this opportunity..."
                    rows={5}
                    className="w-full resize-y rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-600 focus:border-indigo-400/40"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-400"
                  >
                    {editingJobId
                      ? "Save Changes"
                      : "Add Job"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}