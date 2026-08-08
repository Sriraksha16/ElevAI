import { AuroraButton } from "@/components/ui/AuroraButton";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";
import {
  ArrowDown,
  CheckCircle2,
  FileText,
  Sparkles,
  Target,
} from "lucide-react";

const features = [
  {
    icon: FileText,
    title: "AI Resume Intelligence",
    description:
      "Analyze your resume and discover the improvements that can make your profile stronger.",
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

const steps = [
  "Upload your resume",
  "Add a job description",
  "Let ElevAI analyze the match",
  "Improve and apply with confidence",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <Navbar />
    
     

      {/* Hero */}
      <Hero />
      {/* Features */}
      <Features />
      {/* How It Works */}
      <HowItWorks />
      {/* CTA */}
      <CTA />
      {/* Footer */}
      <Footer />
    </main>
  );
}