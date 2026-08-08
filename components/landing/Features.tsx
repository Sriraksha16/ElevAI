import {
  FileText,
  Target,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "AI Resume Intelligence",
    description:
      "Analyze your resume and discover improvements that can make your profile stronger.",
  },
  {
    icon: Target,
    title: "ATS Optimization",
    description:
      "Compare your resume with a job description and identify important missing keywords.",
  },
  {
    icon: Sparkles,
    title: "AI Career Insights",
    description:
      "Get practical recommendations for skills, experience, and your next career move.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-indigo-400">
            Everything you need
          </p>

          <h2 className="font-heading mt-4 text-3xl font-bold text-white sm:text-4xl">
            Your career, intelligently optimized.
          </h2>

          <p className="mt-4 text-slate-400">
            ElevAI brings your resume, job matching, and career preparation
            into one intelligent workspace.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="glass group rounded-2xl p-7 transition duration-300 hover:-translate-y-1 hover:border-indigo-400/20 hover:bg-white/[0.06]"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-violet-600/20 to-cyan-400/20 text-indigo-300">
                  <Icon size={23} />
                </div>

                <h3 className="font-heading text-xl font-semibold text-white">
                  {feature.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}