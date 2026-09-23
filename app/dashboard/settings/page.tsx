"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  FileText,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  User,
} from "lucide-react";

import { PageBackLink } from "@/components/dashboard/PageBackLink";

type Settings = {
  name: string;
  careerTitle: string;
  preferredTone: "professional" | "confident" | "friendly";
  resumeFormat: "pdf" | "docx";
  emailNotifications: boolean;
  applicationReminders: boolean;
};

const DEFAULT_SETTINGS: Settings = {
  name: "Sriraksha",
  careerTitle: "Career Explorer",
  preferredTone: "professional",
  resumeFormat: "pdf",
  emailNotifications: true,
  applicationReminders: true,
};

const STORAGE_KEY = "elevai-settings";

export default function SettingsPage() {
  const [settings, setSettings] =
    useState<Settings>(DEFAULT_SETTINGS);

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        STORAGE_KEY
      );

      if (stored) {
        const parsed = JSON.parse(stored);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
        });
      }
    } catch {
      // Keep default settings if stored data is invalid.
    }
  }, []);

  function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(settings)
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS);

    localStorage.removeItem(STORAGE_KEY);

    setSaved(false);
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <PageBackLink />

        {/* Header */}

        <div className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
              <SettingsIcon className="h-6 w-6 text-indigo-400" />
            </div>

            <div>
              <p className="text-sm font-medium text-indigo-400">
                ElevAI Preferences
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                Settings
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Customize your ElevAI experience and
                career preferences.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {/* Profile */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <SectionHeader
              icon={<User className="h-5 w-5" />}
              title="Profile"
              description="Basic information used throughout your ElevAI workspace."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <Field label="Name">
                <input
                  type="text"
                  value={settings.name}
                  onChange={(event) =>
                    updateSetting(
                      "name",
                      event.target.value
                    )
                  }
                  className="settings-input"
                  placeholder="Your name"
                />
              </Field>

              <Field label="Career Title">
                <input
                  type="text"
                  value={settings.careerTitle}
                  onChange={(event) =>
                    updateSetting(
                      "careerTitle",
                      event.target.value
                    )
                  }
                  className="settings-input"
                  placeholder="e.g. Software Developer"
                />
              </Field>
            </div>
          </section>

          {/* AI Preferences */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <SectionHeader
              icon={
                <SettingsIcon className="h-5 w-5" />
              }
              title="AI Preferences"
              description="Choose how ElevAI should tailor generated career content."
            />

            <div className="mt-6">
              <Field
                label="Preferred Writing Tone"
                description="Used by supported AI writing features such as Cover Letter Generator."
              >
                <select
                  value={settings.preferredTone}
                  onChange={(event) =>
                    updateSetting(
                      "preferredTone",
                      event.target
                        .value as Settings["preferredTone"]
                    )
                  }
                  className="settings-input"
                >
                  <option value="professional">
                    Professional
                  </option>

                  <option value="confident">
                    Confident
                  </option>

                  <option value="friendly">
                    Friendly
                  </option>
                </select>
              </Field>
            </div>
          </section>

          {/* Resume Preferences */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <SectionHeader
              icon={<FileText className="h-5 w-5" />}
              title="Resume Preferences"
              description="Choose your preferred resume format."
            />

            <div className="mt-6">
              <Field
                label="Preferred Resume Format"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceButton
                    selected={
                      settings.resumeFormat ===
                      "pdf"
                    }
                    onClick={() =>
                      updateSetting(
                        "resumeFormat",
                        "pdf"
                      )
                    }
                    title="PDF"
                    description="Best for consistent document formatting."
                  />

                  <ChoiceButton
                    selected={
                      settings.resumeFormat ===
                      "docx"
                    }
                    onClick={() =>
                      updateSetting(
                        "resumeFormat",
                        "docx"
                      )
                    }
                    title="DOCX"
                    description="Easy to edit in Microsoft Word."
                  />
                </div>
              </Field>
            </div>
          </section>

          {/* Notifications */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <SectionHeader
              icon={<Bell className="h-5 w-5" />}
              title="Notifications"
              description="Control which local notification preferences are enabled."
            />

            <div className="mt-6 space-y-4">
              <Toggle
                label="Email Notifications"
                description="Receive important ElevAI account and feature notifications."
                enabled={
                  settings.emailNotifications
                }
                onChange={(value) =>
                  updateSetting(
                    "emailNotifications",
                    value
                  )
                }
              />

              <Toggle
                label="Application Reminders"
                description="Allow ElevAI to use your preference for future job application reminders."
                enabled={
                  settings.applicationReminders
                }
                onChange={(value) =>
                  updateSetting(
                    "applicationReminders",
                    value
                  )
                }
              />
            </div>
          </section>

          {/* Actions */}

          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-medium text-white">
                  Save Preferences
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your current settings are stored
                  locally in this browser.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400"
                >
                  {saved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {saved
                    ? "Saved"
                    : "Save Settings"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* ----------------------------------------
   Section Header
----------------------------------------- */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
        {icon}
      </div>

      <div>
        <h2 className="font-medium text-white">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------
   Field
----------------------------------------- */

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-300">
        {label}
      </label>

      {description && (
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      )}

      <div className="mt-3">
        {children}
      </div>
    </div>
  );
}

/* ----------------------------------------
   Choice Button
----------------------------------------- */

function ChoiceButton({
  selected,
  onClick,
  title,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-indigo-400/50 bg-indigo-500/10"
          : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`text-sm font-medium ${
            selected
              ? "text-white"
              : "text-slate-300"
          }`}
        >
          {title}
        </span>

        {selected && (
          <Check className="h-4 w-4 text-indigo-400" />
        )}
      </div>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </button>
  );
}

/* ----------------------------------------
   Toggle
----------------------------------------- */

function Toggle({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className="flex w-full items-center justify-between gap-5 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-left transition hover:bg-white/[0.04]"
    >
      <div>
        <p className="text-sm font-medium text-slate-200">
          {label}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <div
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          enabled
            ? "bg-indigo-500"
            : "bg-slate-700"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </div>
    </button>
  );
}