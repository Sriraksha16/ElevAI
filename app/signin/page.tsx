"use client";

import {
  FormEvent,
  useState,
} from "react";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  User,
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();

  const [mode, setMode] =
    useState<"signin" | "signup">("signin");

  const [name, setName] = useState("");

  const [careerTitle, setCareerTitle] =
    useState("Career Explorer");

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const response = await fetch(
          "/api/register",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name,
              email,
              password,
              careerTitle,
            }),
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          setError(
            result.message ||
              "Unable to create your account."
          );
          return;
        }
      }

      const result = await signIn(
        "credentials",
        {
          email,
          password,
          redirect: false,
        }
      );

      if (result?.error) {
        setError(
          "Invalid email or password."
        );
        return;
      }

      /*
       * Send the user to the dashboard with
       * a temporary success flag.
       */
      router.push(
        "/dashboard?signin=success"
      );

      router.refresh();
    } catch {
      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050509] px-6 py-12 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Aurora ribbons */}
        <div className="aurora-ribbon aurora-ribbon-one" />
        <div className="aurora-ribbon aurora-ribbon-two" />
        <div className="aurora-ribbon aurora-ribbon-three" />

        {/* Left → right shooting stars */}
        <span className="shooting-star shooting-star-left-one" />
        <span className="shooting-star shooting-star-left-two" />
        <span className="shooting-star shooting-star-left-three" />

        {/* Right → left shooting stars */}
        <span className="shooting-star shooting-star-right-one" />
        <span className="shooting-star shooting-star-right-two" />

        {/* Blinking stars */}
        {Array.from({ length: 12 }).map(
          (_, index) => (
            <span
              key={index}
              className="tiny-star"
              style={{
                left: `${8 + index * 7}%`,
                top: `${
                  10 +
                  ((index * 17) % 75)
                }%`,
                animationDelay: `${
                  index * 0.45
                }s`,
              }}
            />
          )
        )}
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 text-xl font-bold shadow-2xl shadow-indigo-500/30">
            E
          </div>

          <h1 className="text-3xl font-semibold">
            Welcome to Elev
            <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
              AI
            </span>
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Elevate your career with intelligent
            career tools.
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
          {/* Mode switch */}
          <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError("");
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                mode === "signin"
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Sign in
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError("");
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                mode === "signup"
                  ? "bg-white/10 text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Create account
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-400" />

              <h2 className="font-medium">
                {mode === "signin"
                  ? "Sign in to your workspace"
                  : "Create your ElevAI account"}
              </h2>
            </div>

            <p className="text-sm text-slate-500">
              {mode === "signin"
                ? "Continue your career journey."
                : "Create your personal career workspace."}
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Signup fields */}
            {mode === "signup" && (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm text-slate-400"
                  >
                    Your name
                  </label>

                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                    <input
                      id="name"
                      type="text"
                      required
                      value={name}
                      onChange={(event) =>
                        setName(event.target.value)
                      }
                      placeholder="Your full name"
                      autoComplete="name"
                      className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-violet-400/40"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="careerTitle"
                    className="mb-2 block text-sm text-slate-400"
                  >
                    Career title
                  </label>

                  <input
                    id="careerTitle"
                    type="text"
                    value={careerTitle}
                    onChange={(event) =>
                      setCareerTitle(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Frontend Developer"
                    className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-violet-400/40"
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm text-slate-400"
              >
                Email
              </label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-violet-400/40"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm text-slate-400"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />

                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Minimum 8 characters"
                  autoComplete={
                    mode === "signin"
                      ? "current-password"
                      : "new-password"
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-700 focus:border-violet-400/40"
                />
              </div>

              {mode === "signin" && (
                <div className="mt-2 text-right">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-slate-500 transition hover:text-violet-300"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-500 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition hover:from-violet-500 hover:to-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />

                  {mode === "signin"
                    ? "Signing in..."
                    : "Creating account..."}
                </>
              ) : (
                <>
                  {mode === "signin"
                    ? "Sign in"
                    : "Create account"}

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .aurora-ribbon {
          position: absolute;
          width: 80vw;
          height: 220px;
          border-radius: 999px;
          filter: blur(55px);
          opacity: 0.18;
        }

        .aurora-ribbon-one {
          left: -20%;
          top: 8%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(99, 102, 241, 0.9),
            rgba(34, 211, 238, 0.55),
            transparent
          );
          animation: auroraOne 18s ease-in-out infinite;
        }

        .aurora-ribbon-two {
          right: -25%;
          top: 42%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(168, 85, 247, 0.7),
            rgba(45, 212, 191, 0.45),
            transparent
          );
          animation: auroraTwo 22s ease-in-out infinite;
        }

        .aurora-ribbon-three {
          left: -15%;
          bottom: 5%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(59, 130, 246, 0.55),
            rgba(139, 92, 246, 0.55),
            transparent
          );
          animation: auroraThree 25s ease-in-out infinite;
        }

        @keyframes auroraOne {
          0%,
          100% {
            transform: translateX(-8%) rotate(-12deg);
          }

          50% {
            transform: translateX(20%) rotate(-5deg);
          }
        }

        @keyframes auroraTwo {
          0%,
          100% {
            transform: translateX(10%) rotate(10deg);
          }

          50% {
            transform: translateX(-18%) rotate(4deg);
          }
        }

        @keyframes auroraThree {
          0%,
          100% {
            transform: translateX(-5%) rotate(8deg);
          }

          50% {
            transform: translateX(18%) rotate(14deg);
          }
        }

        .shooting-star {
          position: absolute;
          width: 90px;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.85),
            transparent
          );
          opacity: 0;
        }

        .shooting-star::after {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          width: 3px;
          height: 3px;
          border-radius: 999px;
          background: white;
          box-shadow: 0 0 10px 2px
            rgba(255, 255, 255, 0.8);
        }

        .shooting-star-left-one {
          top: 18%;
          left: -120px;
          transform: rotate(18deg);
          animation: shootLeft 7s linear infinite;
        }

        .shooting-star-left-two {
          top: 48%;
          left: -120px;
          transform: rotate(12deg);
          animation: shootLeft 9s linear 2s infinite;
        }

        .shooting-star-left-three {
          top: 76%;
          left: -120px;
          transform: rotate(20deg);
          animation: shootLeft 8s linear 4s infinite;
        }

        .shooting-star-right-one {
          top: 28%;
          right: -120px;
          transform: rotate(-18deg);
          animation: shootRight 8s linear 1s infinite;
        }

        .shooting-star-right-two {
          top: 65%;
          right: -120px;
          transform: rotate(-12deg);
          animation: shootRight 10s linear 3s infinite;
        }

        @keyframes shootLeft {
          0% {
            transform: translateX(0)
              rotate(18deg);
            opacity: 0;
          }

          10%,
          45% {
            opacity: 0.8;
          }

          60% {
            transform: translateX(120vw)
              rotate(18deg);
            opacity: 0;
          }

          100% {
            opacity: 0;
          }
        }

        @keyframes shootRight {
          0% {
            transform: translateX(0)
              rotate(-18deg);
            opacity: 0;
          }

          10%,
          45% {
            opacity: 0.8;
          }

          60% {
            transform: translateX(-120vw)
              rotate(-18deg);
            opacity: 0;
          }

          100% {
            opacity: 0;
          }
        }

        .tiny-star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 999px;
          background: white;
          opacity: 0.15;
          animation: blinkStar 3s ease-in-out infinite;
        }

        @keyframes blinkStar {
          0%,
          100% {
            opacity: 0.1;
            transform: scale(0.8);
          }

          50% {
            opacity: 0.8;
            transform: scale(1.5);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .aurora-ribbon,
          .shooting-star,
          .tiny-star {
            animation: none;
          }
        }
      `}</style>
    </main>
  );
}