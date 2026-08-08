const navigation = [
  "Dashboard",
  "Resume",
  "AI Insights",
  "Cover Letter",
  "Interview",
  "Job Tracker",
];

export function Sidebar() {
  return (
    <aside className="hidden w-64 border-r border-white/5 bg-black/20 px-5 py-6 md:block">
      {/* Logo */}
      <div className="flex items-center gap-3 px-3">
        <div className="aurora-gradient flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20">
          E
        </div>

        <span className="font-heading text-xl font-semibold">
          Elev<span className="aurora-text">AI</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="mt-10 space-y-2">
        {navigation.map((item, index) => (
          <button
            key={item}
            className={`w-full rounded-xl px-4 py-3 text-left text-sm transition ${
              index === 0
                ? "bg-white/[0.06] text-white"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {/* Settings */}
      <div className="mt-8">
        <button className="w-full rounded-xl px-4 py-3 text-left text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white">
          Settings
        </button>
      </div>
    </aside>
  );
}