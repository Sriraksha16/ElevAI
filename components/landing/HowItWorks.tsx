const steps = [
  {
    number: "01",
    title: "Upload your resume",
    description:
      "Start by uploading your current resume. ElevAI analyzes your experience, skills, and career profile.",
  },
  {
    number: "02",
    title: "Add a job description",
    description:
      "Paste the job description for the position you're interested in.",
  },
  {
    number: "03",
    title: "Let AI analyze the match",
    description:
      "ElevAI identifies your ATS score, missing keywords, skill gaps, and improvement opportunities.",
  },
  {
    number: "04",
    title: "Improve and apply",
    description:
      "Use personalized suggestions, generate a cover letter, and prepare for your interview.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative px-6 py-24 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        {/* Section heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-cyan-400">
            How it works
          </p>

          <h2 className="font-heading mt-4 text-3xl font-bold text-white sm:text-4xl">
            From resume to opportunity.
          </h2>

          <p className="mt-4 text-slate-400">
            Four simple steps to turn your job application into a smarter
            career strategy.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-16">
          {/* Connecting line */}
          <div
            aria-hidden="true"
            className="absolute left-[12%] right-[12%] top-7 hidden h-px bg-linear-to-r from-violet-500/10 via-indigo-400/40 to-cyan-400/10 lg:block"
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div
                key={step.number}
                className="glass group relative rounded-2xl p-7 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/20"
              >
                {/* Number */}
                <div className="relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-violet-600/20 via-indigo-500/20 to-cyan-400/20 text-lg font-semibold text-white ring-1 ring-white/10">
                  {step.number}
                </div>

                <h3 className="font-heading text-xl font-semibold text-white">
                  {step.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}