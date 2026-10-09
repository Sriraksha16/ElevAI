
"use client";

import {
  Suspense,
  useState,
} from "react";

import type { FormEvent } from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
} from "lucide-react";

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        "This password reset link is invalid."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must be at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "The passwords do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/account/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setError(
          result.message ||
            "Unable to reset your password."
        );
        return;
      }

      setSuccess(true);
    } catch {
      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050509] px-6 text-white">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 shadow-2xl backdrop-blur-xl">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </div>

              <h1 className="text-2xl font-semibold">
                Password updated
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Your ElevAI password has been
                changed successfully.
              </p>

              <Link
                href="/signin"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-5 py-3 text-sm font-medium"
              >
                Sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-semibold">
                Create a new password
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Choose a new password for your
                ElevAI account.
              </p>

              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-4"
              >
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm text-slate-400"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                    <input
                      id="password"
                      type="password"
                      minLength={8}
                      required
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none focus:border-violet-400/40"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm text-slate-400"
                  >
                    Confirm password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    minLength={8}
                    required
                    value={confirmPassword}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/40"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-medium disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      Reset password
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#050509] px-6 text-white">
          <div className="text-sm text-slate-400">
            Loading password reset...
          </div>
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
