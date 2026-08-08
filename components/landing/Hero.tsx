import { ArrowDown, CheckCircle2, Sparkles } from "lucide-react";
import { AuroraButton } from "@/components/ui/AuroraButton";

export function Hero() {
  return (
    <section className="relative isolate px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
      {/* Aurora background */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden"
      >
        <div className="h-125 w-225 rounded-full bg-linear-to-r from-violet-600/20 via-indigo-500/20 to-cyan-400/20 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        {/* Badge */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 backdrop-blur">
          <Sparkles size={15} className="text-cyan-300" />
          AI-powered career intelligence
        </div>

        {/* Heading */}
        <h1 className="font-heading text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-8xl">
          Elevate Your
          <br />
          Career with{" "}
          <span className="aurora-text">AI</span>
        </h1>

        {/* Description */}
        <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-400 sm:text-xl">
          Transform your resume into opportunities with intelligent ATS
          analysis, personalized career insights, and AI-powered interview
          preparation.
        </p>

        {/* Buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <AuroraButton>Start Your Journey</AuroraButton>

          <button className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 font-medium text-white transition hover:border-white/20 hover:bg-white/4">
            View how it works
            <ArrowDown size={17} />
          </button>
        </div>

        {/* Benefits */}
        <div className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-500">
          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Resume analysis
          </span>

          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            ATS optimization
          </span>

          <span className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            Interview preparation
          </span>
        </div>
      </div>
    </section>
  );
}