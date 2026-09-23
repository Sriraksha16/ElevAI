import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type PageBackLinkProps = {
  label?: string;
};

export function PageBackLink({
  label = "Back to Dashboard",
}: PageBackLinkProps) {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}