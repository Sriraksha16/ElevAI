"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Bell,
  Check,
  FileText,
  Loader2,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  User,
} from "lucide-react";

import { PageBackLink } from "@/components/dashboard/PageBackLink";

type Settings = {
  preferredTone: "professional" | "confident" | "friendly";
  resumeFormat: "pdf" | "docx";
  emailNotifications: boolean;
  applicationReminders: boolean;
};

type Profile = {
  id: string;
  name: string;
  email: string;
  careerTitle: string;
  createdAt: string;
};

const DEFAULT_SETTINGS: Settings = {
  preferredTone: "professional",
  resumeFormat: "pdf",
  emailNotifications: true,
  applicationReminders: true,
};

export default function SettingsPage() {
  const { update: updateSession } = useSession();

  const [profile, setProfile] = useState<Profile | null>(null);

  const [settings, setSettings] =
    useState<Settings>(DEFAULT_SETTINGS);

  const [profileLoading, setProfileLoading] =
    useState(true);

  const [settingsLoading, setSettingsLoading] =
    useState(true);

  const [profileSaving, setProfileSaving] =
    useState(false);

  const [settingsSaving, setSettingsSaving] =
    useState(false);

  const [profileSaved, setProfileSaved] =
    useState(false);

  const [settingsSaved, setSettingsSaved] =
    useState(false);

  const [profileError, setProfileError] =
    useState("");

  const [settingsError, setSettingsError] =
    useState("");

  // -----------------------------------------
  // LOAD PROFILE
  // -----------------------------------------
  useEffect(() => {
    async function loadProfile() {
      try {
        setProfileLoading(true);
        setProfileError("");

        const response = await fetch(
          "/api/account/profile",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load your profile."
          );
        }

        setProfile(data.user);
      } catch (error) {
        setProfileError(
          error instanceof Error
            ? error.message
            : "Unable to load your profile."
        );
      } finally {
        setProfileLoading(false);
      }
    }

    loadProfile();
  }, []);

  // -----------------------------------------
  // LOAD ACCOUNT SETTINGS
  // -----------------------------------------
  useEffect(() => {
    async function loadSettings() {
      try {
        setSettingsLoading(true);
        setSettingsError("");

        const response = await fetch(
          "/api/account/settings",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load your settings."
          );
        }

        setSettings({
          ...DEFAULT_SETTINGS,
          ...data.settings,
        });
      } catch (error) {
        setSettingsError(
          error instanceof Error
            ? error.message
            : "Unable to load your settings."
        );
      } finally {
        setSettingsLoading(false);
      }
    }

    loadSettings();
  }, []);

  // -----------------------------------------
  // PROFILE
  // -----------------------------------------
  function updateProfile(
    key: "name" | "careerTitle",
    value: string
  ) {
    setProfile((current) =>
      current
        ? {
            ...current,
            [key]: value,
          }
        : current
    );

    setProfileSaved(false);
    setProfileError("");
  }

  async function handleProfileSave() {
    if (!profile) {
      return;
    }

    setProfileSaving(true);
    setProfileSaved(false);
    setProfileError("");

    try {
      const response = await fetch(
        "/api/account/profile",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: profile.name,
            careerTitle: profile.careerTitle,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to update your profile."
        );
      }

      setProfile(data.user);

      await updateSession({
        name: data.user.name,
        careerTitle: data.user.careerTitle,
      });

      setProfileSaved(true);

      window.setTimeout(() => {
        setProfileSaved(false);
      }, 2500);
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : "Unable to update your profile."
      );
    } finally {
      setProfileSaving(false);
    }
  }

  // -----------------------------------------
  // SETTINGS
  // -----------------------------------------
  function updateSetting<K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSettingsSaved(false);
    setSettingsError("");
  }

  async function handleSaveSettings() {
    setSettingsSaving(true);
    setSettingsSaved(false);
    setSettingsError("");

    try {
      const response = await fetch(
        "/api/account/settings",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save your settings."
        );
      }

      setSettings({
        ...DEFAULT_SETTINGS,
        ...data.settings,
      });

      setSettingsSaved(true);

      window.setTimeout(() => {
        setSettingsSaved(false);
      }, 2500);
    } catch (error) {
      setSettingsError(
        error instanceof Error
          ? error.message
          : "Unable to save your settings."
      );
    } finally {
      setSettingsSaving(false);
    }
  }

  function handleResetSettings() {
    setSettings(DEFAULT_SETTINGS);
    setSettingsSaved(false);
    setSettingsError("");
  }

  return (
    <main className="min-h-screen bg-[#070b14] text-white">
      <div className="mx-auto max-w-5xl px-6 py-8 lg:px-8">
        <PageBackLink />

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
                Manage your ElevAI account and career
                preferences.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {/* PROFILE */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <SectionHeader
              icon={<User className="h-5 w-5" />}
              title="Profile"
              description="Your account information is connected to your ElevAI account."
            />

            {profileError && (
              <ErrorMessage message={profileError} />
            )}

            {profileLoading ? (
              <LoadingMessage text="Loading your profile..." />
            ) : profile ? (
              <>
                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <Field label="Name">
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(event) =>
                        updateProfile(
                          "name",
                          event.target.value
                        )
                      }
                      className="settings-input"
                      placeholder="Your name"
                    />
                  </Field>

                  <Field
                    label="Email"
                    description="Your login email is managed by your account."
                  >
                    <input
                      type="email"
                      value={profile.email}
                      disabled
                      className="settings-input cursor-not-allowed opacity-60"
                    />
                  </Field>

                  <Field label="Career Title">
                    <input
                      type="text"
                      value={profile.careerTitle}
                      onChange={(event) =>
                        updateProfile(
                          "careerTitle",
                          event.target.value
                        )
                      }
                      className="settings-input"
                      placeholder="e.g. Software Developer"
                    />
                  </Field>
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-slate-500">
                    Changes here update your ElevAI
                    account profile.
                  </p>

                  <button
                    type="button"
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {profileSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : profileSaved ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}

                    {profileSaving
                      ? "Saving..."
                      : profileSaved
                        ? "Profile Saved"
                        : "Save Profile"}
                  </button>
                </div>
              </>
            ) : null}
          </section>

          {/* AI PREFERENCES */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <SectionHeader
              icon={
                <SettingsIcon className="h-5 w-5" />
              }
              title="AI Preferences"
              description="Choose how ElevAI should tailor generated career content."
            />

            {settingsError && (
              <ErrorMessage message={settingsError} />
            )}

            {settingsLoading ? (
              <LoadingMessage text="Loading your preferences..." />
            ) : (
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
            )}
          </section>

          {/* RESUME PREFERENCES */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <SectionHeader
              icon={<FileText className="h-5 w-5" />}
              title="Resume Preferences"
              description="Choose your preferred resume format."
            />

            {settingsLoading ? (
              <LoadingMessage text="Loading your preferences..." />
            ) : (
              <div className="mt-6">
                <Field label="Preferred Resume Format">
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
            )}
          </section>

          {/* NOTIFICATIONS */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <SectionHeader
              icon={<Bell className="h-5 w-5" />}
              title="Notifications"
              description="Control your ElevAI notification preferences."
            />

            {settingsLoading ? (
              <LoadingMessage text="Loading your preferences..." />
            ) : (
              <div className="mt-6 space-y-4">
                <Toggle
                  label="Email Notifications"
                  description="Receive important ElevAI account and feature notifications."
                  enabled={settings.emailNotifications}
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
            )}
          </section>

          {/* SAVE */}
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-medium text-white">
                  Save Preferences
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your preferences are saved to your
                  ElevAI account.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={handleResetSettings}
                  disabled={settingsSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </button>

                <button
                  type="button"
                  onClick={handleSaveSettings}
                  disabled={settingsSaving || settingsLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {settingsSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : settingsSaved ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}

                  {settingsSaving
                    ? "Saving..."
                    : settingsSaved
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

      <div className="mt-3">{children}</div>
    </div>
  );
}

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
            enabled ? "left-6" : "left-1"
          }`}
        />
      </div>
    </button>
  );
}

function LoadingMessage({ text }: { text: string }) {
  return (
    <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-5 text-sm text-slate-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      {text}
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200">
      {message}
    </div>
  );
}