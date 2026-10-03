"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export function LandingAuthMessage() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(
      window.location.search
    );

    if (params.get("logout") === "success") {
      setVisible(true);

      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [visible]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed right-6 top-6 z-[100]">
      <div className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-emerald-400/20 bg-[#0c1110]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />

        <p className="flex-1 text-sm font-medium text-emerald-100">
          Logged out successfully!
        </p>

        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Close notification"
          className="text-slate-500 transition hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}