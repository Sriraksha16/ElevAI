"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import {
  BriefcaseBusiness,
  FileText,
  Home,
  LogOut,
  MessageSquareText,
  Settings,
  Sparkles,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Home,
  },
  {
    label: "Resume",
    href: "/dashboard/resume",
    icon: FileText,
  },
  {
    label: "AI Insights",
    href: "/dashboard/insights",
    icon: Sparkles,
  },
  {
    label: "Cover Letter",
    href: "/dashboard/cover-letter",
    icon: FileText,
  },
  {
    label: "Interview",
    href: "/dashboard/interview",
    icon: MessageSquareText,
  },
  {
    label: "Job Tracker",
    href: "/dashboard/jobs",
    icon: BriefcaseBusiness,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut({
      redirect: false,
    });

    router.push("/?logout=success");
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-[#08080c]">
      {/* Logo */}
      <div className="px-6 py-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="aurora-gradient flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20">
            E
          </div>

          <span className="font-heading text-xl font-semibold tracking-tight">
            Elev<span className="aurora-text">AI</span>
          </span>
        </Link>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const Icon = item.icon;

          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                isActive
                  ? "bg-white/[0.07] text-white"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />

              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="space-y-2 border-t border-white/5 px-3 py-4">
        {/* Settings */}
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
            pathname === "/dashboard/settings"
              ? "bg-white/[0.07] text-white"
              : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
          }`}
        >
          <Settings className="h-4 w-4 shrink-0" />

          <span>Settings</span>
        </Link>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 transition hover:bg-red-400/10 hover:text-red-300"
        >
          <LogOut className="h-4 w-4 shrink-0" />

          <span>Log out</span>
        </button>

        {/* Footer */}
        <div className="px-3 pt-3">
          <p className="text-[11px] text-slate-700">
            Your career, elevated.
          </p>
        </div>
      </div>
    </aside>
  );
}