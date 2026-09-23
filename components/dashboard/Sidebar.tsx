import Link from "next/link";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
  },
  {
    label: "Resume",
    href: "/dashboard/resume",
  },
  {
    label: "AI Insights",
    href: "/dashboard/insights",
  },
  {
    label: "Cover Letter",
    href: "/dashboard/cover-letter",
  },
  {
    label: "Interview",
    href: "/dashboard/interview",
  },
  {
    label: "Job Tracker",
    href: "/dashboard/jobs",
  },
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-white/5 bg-black/20 px-5 py-6 md:block">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-3"
      >
        <div className="aurora-gradient flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20">
          E
        </div>

        <span className="font-heading text-xl font-semibold">
          Elev<span className="aurora-text">AI</span>
        </span>
      </Link>

      {/* Navigation */}
      <nav className="mt-10 space-y-2">
        {navigation.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`block w-full rounded-xl px-4 py-3 text-left text-sm transition ${
              item.href === "/dashboard"
                ? "bg-white/[0.06] text-white"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Settings */}
      <div className="mt-8">
        <Link
          href="/dashboard/settings"
          className="block w-full rounded-xl px-4 py-3 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          Settings
        </Link>
      </div>
    </aside>
  );
}