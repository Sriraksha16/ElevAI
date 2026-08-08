type DashboardHeaderProps = {
  name: string;
  role: string;
};

export function DashboardHeader({
  name,
  role,
}: DashboardHeaderProps) {
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
        {/* Notification */}
        <button
          aria-label="Notifications"
          className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:text-white"
        >
          🔔
        </button>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br from-violet-600 to-cyan-400 text-sm font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-medium text-white">
              {name}
            </p>

            <p className="text-xs text-slate-500">
              {role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}