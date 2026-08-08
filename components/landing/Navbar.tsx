import Link from "next/link";

export function Navbar() {
  return (
    <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
      <Link href="/" className="flex items-center gap-3">
        <div className="aurora-gradient flex h-9 w-9 items-center justify-center rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20">
          E
        </div>

        <span className="font-heading text-xl font-semibold tracking-tight">
          Elev<span className="aurora-text">AI</span>
        </span>
      </Link>

      <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
        <Link href="#features" className="transition hover:text-white">
          Features
        </Link>

        <Link href="#how-it-works" className="transition hover:text-white">
          How it works
        </Link>

        <Link href="#about" className="transition hover:text-white">
          About
        </Link>
      </div>

      <button className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white">
        Sign in
      </button>
    </nav>
  );
}