"use client";

import { useSession } from "next-auth/react";

export function DashboardHeader() {
  const { data: session } = useSession();

  const name =
    session?.user?.name?.trim() || "User";

  const email =
    session?.user?.email?.trim() || "";

  const careerTitle =
    session?.user?.careerTitle ||
    "Career Explorer";

  const firstLetter =
    name.charAt(0).toUpperCase() || "U";

  return (
    <header className="flex items-center justify-between border-b border-white/5 px-6 py-5 lg:px-10">
      <div>
        <p className="text-sm text-slate-500">
          Mission Control
        </p>

        <h1 className="font-heading mt-1 text-xl font-semibold">
          Welcome back 👋
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Notifications"
          className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:text-white"
        >
          🔔
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-violet-600 to-cyan-400 text-sm font-semibold">
            {firstLetter}
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">
              {name}
            </p>

            <p className="text-xs text-slate-500">
              {email || careerTitle}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}