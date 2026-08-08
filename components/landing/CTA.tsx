import { AuroraButton } from "@/components/ui/AuroraButton";

export function CTA() {
  return (
    <section id="about" className="px-6 py-24 lg:px-8">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 px-8 py-16 text-center sm:px-12">
        {/* Aurora background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-br from-violet-600/20 via-indigo-500/10 to-cyan-400/20"
        />

        {/* Aurora glow */}
        <div
          aria-hidden="true"
          className="absolute -left-24 -top-24 -z-10 h-64 w-64 rounded-full bg-violet-600/20 blur-[100px]"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-24 -z-10 h-64 w-64 rounded-full bg-cyan-400/20 blur-[100px]"
        />

        <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-400">
          Your next chapter
        </p>

        <h2 className="font-heading mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Your next opportunity
          <br />
          starts here.
        </h2>

        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
          Build a stronger resume, understand your opportunities, and walk
          into your next interview prepared.
        </p>

        <div className="mt-8 flex justify-center">
          <AuroraButton>Start with ElevAI</AuroraButton>
        </div>
      </div>
    </section>
  );
}