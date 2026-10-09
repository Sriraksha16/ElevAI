"use client";

import { useEffect, useState } from "react";


import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

import {
  CheckCircle2,
  X,
} from "lucide-react";

export default function Home() {
  const [logoutSuccess, setLogoutSuccess] =
    useState(false);

 useEffect(() => {
  const params = new URLSearchParams(window.location.search);

  if (params.get("logout") !== "success") {
    return;
  }

  window.history.replaceState({}, "", window.location.pathname);

  let hideTimer: number | undefined;

  const showTimer = window.setTimeout(() => {
    setLogoutSuccess(true);

    hideTimer = window.setTimeout(() => {
      setLogoutSuccess(false);
    }, 3500);
  }, 0);

  return () => {
    window.clearTimeout(showTimer);

    if (hideTimer !== undefined) {
      window.clearTimeout(hideTimer);
    }
  };
}, []);

  return (
    <main className="min-h-screen overflow-hidden">
      {/* Logout success notification */}
      {logoutSuccess && (
        <div className="fixed right-6 top-6 z-[100]">
          <div className="flex min-w-[280px] items-center gap-3 rounded-2xl border border-emerald-400/20 bg-[#0c1110]/95 px-4 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />

            <p className="flex-1 text-sm font-medium text-emerald-100">
              Logged out successfully!
            </p>

            <button
              type="button"
              onClick={() =>
                setLogoutSuccess(false)
              }
              aria-label="Close notification"
              className="text-slate-500 transition hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <Navbar />

      <Hero />

      <Features />

      <HowItWorks />

      <CTA />

      <Footer />
    </main>
  );
}