"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

type AuthStatusToastProps = {
  type: "signin" | "logout";
};

export function AuthStatusToast({
  type,
}: AuthStatusToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  if (!visible) {
    return null;
  }

  const message =
    type === "signin"
      ? "Signed in successfully!"
      : "Logged out successfully!";

  return (
    <div className="fixed right-6 top-6 z-[100]">
      <div className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-emerald-400/20 bg-[#0c1110]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />

        <p className="flex-1 text-sm font-medium text-emerald-100">
          {message}
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