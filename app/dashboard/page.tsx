import { Sidebar } from "@/components/dashboard/Sidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ResumeWorkspace } from "@/components/dashboard/ResumeWorkspace";


const navigation = [
  "Dashboard",
  "Resume",
  "AI Insights",
  "Cover Letter",
  "Interview",
  "Job Tracker",
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar />

         
       

        {/* Main content */}
        <div className="flex-1">

          {/* Top bar */}
         <DashboardHeader
              name="Sriraksha"
              role="Career Explorer"
           />

          {/* Dashboard */}
          <div className="px-6 py-8 lg:px-10">
            {/* Introduction */}
            <div>
              <p className="text-sm text-indigo-400">
                Your career intelligence
              </p>

              <h2 className="font-heading mt-2 text-3xl font-bold tracking-tight">
                Your career at a glance.
              </h2>

              <p className="mt-2 max-w-2xl text-slate-400">
                Track your resume strength, application readiness, and AI
                recommendations from one workspace.
              </p>
            </div>

            {/* Stats */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
                <StatCard
                  label="Career Health"
                  value="91%"
                  description="Strong profile"
                />

                <StatCard
                label="ATS Score"
                value="87%"
                description="Good match"
                />

                <StatCard
                      label="Interview Ready"
                      value="74%"
                      description="Keep improving"
                    />
              </div>

              <ResumeWorkspace />

            {/* Recent activity */}
            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading text-lg font-semibold">
                    Recent Analysis
                  </h3>

                  <span className="text-xs text-slate-500">
                    No analyses yet
                  </span>
                </div>

                <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <p className="text-sm text-slate-400">
                    Your resume analyses will appear here.
                  </p>
                </div>
              </div>

              <div className="glass rounded-2xl p-6">
                <h3 className="font-heading text-lg font-semibold">
                  AI Recommendations
                </h3>

                <div className="mt-6 rounded-xl border border-dashed border-white/10 p-8 text-center">
                  <p className="text-sm text-slate-400">
                    AI recommendations will appear after your first analysis.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}