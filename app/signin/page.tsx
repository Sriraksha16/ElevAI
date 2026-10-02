
"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignIn(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Sign in error:", error);

      setError(
        "Something went wrong while signing in. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070b14] px-6 py-12 text-white">

      {/* Background */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {/* Aurora glows */}

        <div className="absolute left-1/2 top-[-20%] h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />

        <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[600px] rounded-full bg-cyan-400/10 blur-[140px]" />

        <div className="absolute right-[-10%] top-[20%] h-[500px] w-[600px] rounded-full bg-indigo-500/10 blur-[140px]" />

        {/* Geometric aurora ring */}

        <div className="aurora-circle aurora-circle-one" />

        {/* Geometric diamond */}

        <div className="aurora-diamond aurora-diamond-one">
          <div className="aurora-diamond-inner" />
        </div>

        {/* Geometric square */}

        <div className="aurora-square aurora-square-one" />

        {/* Small glowing orb */}

        <div className="aurora-orb aurora-orb-one" />

        {/* Shooting stars */}

        <span className="shooting-star shooting-star-one" />
        <span className="shooting-star shooting-star-two" />
        <span className="shooting-star shooting-star-three" />
      </div>

      {/* Main content */}

      <div className="relative z-10 w-full max-w-md">

        {/* Logo */}

        <div className="mb-8 flex justify-center">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="aurora-gradient flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20">
              E
            </div>

            <span className="text-xl font-semibold tracking-tight">
              Elev<span className="aurora-text">AI</span>
            </span>
          </Link>
        </div>

        {/* Sign in card */}

        <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">

          {/* Heading */}

          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
              <Sparkles className="h-5 w-5 text-indigo-400" />
            </div>

            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
              Welcome back
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Sign in to continue to your ElevAI career workspace.
            </p>
          </div>

          {/* Error */}

          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-300"
            >
              {error}
            </div>
          )}

          {/* Form */}

          <form
            onSubmit={handleSignIn}
            className="mt-8 space-y-5"
          >
            {/* Email */}

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Email
              </label>

              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:bg-white/[0.04]"
                />
              </div>
            </div>

            {/* Password */}

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Password
              </label>

              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-400/50 focus:bg-white/[0.04]"
                />
              </div>
            </div>

            {/* Submit */}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/10 transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Test account */}

          <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <p className="text-xs font-medium text-slate-400">
              Development test account
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Email:{" "}
              <span className="text-slate-300">
                test@elevai.com
              </span>
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Password:{" "}
              <span className="text-slate-300">
                ElevAI123
              </span>
            </p>
          </div>

          {/* Back */}

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-slate-500 transition hover:text-white"
            >
              Back to ElevAI
            </Link>
          </div>
        </div>
      </div>

      {/* Animation CSS */}

      <style jsx>{`
        /* -----------------------------------------
           SHOOTING STARS
        ----------------------------------------- */

        .shooting-star {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 9999px;
          background: white;
          box-shadow:
            0 0 8px 2px rgba(255, 255, 255, 0.8),
            0 0 20px 5px rgba(129, 140, 248, 0.45);
          opacity: 0;
        }

        .shooting-star::after {
          content: "";
          position: absolute;
          right: 0;
          top: 0;
          width: 120px;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.8),
            rgba(129, 140, 248, 0)
          );
        }

        .shooting-star-one {
          top: 18%;
          left: -10%;
          animation: shooting-one 7s linear infinite;
        }

        .shooting-star-two {
          top: 38%;
          left: -15%;
          animation: shooting-two 9s linear infinite 3s;
        }

        .shooting-star-three {
          top: 65%;
          left: -20%;
          animation: shooting-three 11s linear infinite 6s;
        }

        @keyframes shooting-one {
          0% {
            opacity: 0;
            transform: translate(0, 0) rotate(-25deg);
          }

          5% {
            opacity: 1;
          }

          35% {
            opacity: 0;
            transform: translate(120vw, 30vh) rotate(-25deg);
          }

          100% {
            opacity: 0;
            transform: translate(120vw, 30vh) rotate(-25deg);
          }
        }

        @keyframes shooting-two {
          0% {
            opacity: 0;
            transform: translate(0, 0) rotate(-25deg);
          }

          5% {
            opacity: 1;
          }

          35% {
            opacity: 0;
            transform: translate(120vw, 25vh) rotate(-25deg);
          }

          100% {
            opacity: 0;
            transform: translate(120vw, 25vh) rotate(-25deg);
          }
        }

        @keyframes shooting-three {
          0% {
            opacity: 0;
            transform: translate(0, 0) rotate(-25deg);
          }

          5% {
            opacity: 1;
          }

          35% {
            opacity: 0;
            transform: translate(120vw, 20vh) rotate(-25deg);
          }

          100% {
            opacity: 0;
            transform: translate(120vw, 20vh) rotate(-25deg);
          }
        }

        /* -----------------------------------------
           AURORA CIRCLE
        ----------------------------------------- */

        .aurora-circle {
          position: absolute;
          width: 230px;
          height: 230px;
          border-radius: 50%;
          border: 1px solid rgba(129, 140, 248, 0.25);
          box-shadow:
            0 0 30px rgba(129, 140, 248, 0.12),
            inset 0 0 30px rgba(34, 211, 238, 0.08);
          opacity: 0.65;
        }

        .aurora-circle::after {
          content: "";
          position: absolute;
          inset: 30px;
          border-radius: 50%;
          border: 1px solid rgba(34, 211, 238, 0.18);
        }

        .aurora-circle-one {
          left: -100px;
          top: 15%;
          animation: circle-float 10s ease-in-out infinite;
        }

        @keyframes circle-float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-20px) rotate(20deg);
          }
        }

        /* -----------------------------------------
           AURORA DIAMOND
        ----------------------------------------- */

        .aurora-diamond {
          position: absolute;
          right: 8%;
          top: 12%;
          width: 150px;
          height: 150px;
          border: 1px solid rgba(167, 139, 250, 0.22);
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.12);
          transform: rotate(45deg);
          opacity: 0.6;
          animation: diamond-float 12s ease-in-out infinite;
        }

        .aurora-diamond-inner {
          position: absolute;
          inset: 25px;
          border: 1px solid rgba(34, 211, 238, 0.18);
        }

        @keyframes diamond-float {
          0%,
          100% {
            transform: rotate(45deg) translateY(0);
          }

          50% {
            transform: rotate(55deg) translateY(18px);
          }
        }

        /* -----------------------------------------
           AURORA SQUARE
        ----------------------------------------- */

        .aurora-square {
          position: absolute;
          right: -40px;
          bottom: 15%;
          width: 180px;
          height: 180px;
          border: 1px solid rgba(34, 211, 238, 0.16);
          box-shadow:
            0 0 35px rgba(34, 211, 238, 0.08),
            inset 0 0 30px rgba(99, 102, 241, 0.06);
          transform: rotate(25deg);
          opacity: 0.5;
          animation: square-float 14s ease-in-out infinite;
        }

        .aurora-square-one::after {
          content: "";
          position: absolute;
          inset: 20px;
          border: 1px solid rgba(129, 140, 248, 0.15);
        }

        @keyframes square-float {
          0%,
          100% {
            transform: rotate(25deg) translateY(0);
          }

          50% {
            transform: rotate(35deg) translateY(-20px);
          }
        }

        /* -----------------------------------------
           SMALL AURORA ORB
        ----------------------------------------- */

        .aurora-orb {
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(129, 140, 248, 0.18) 0%,
            rgba(34, 211, 238, 0.08) 40%,
            transparent 70%
          );
          filter: blur(2px);
          opacity: 0.7;
        }

        .aurora-orb-one {
          left: 10%;
          bottom: 12%;
          animation: orb-pulse 6s ease-in-out infinite;
        }

        @keyframes orb-pulse {
          0%,
          100% {
            transform: scale(0.9);
          }

          50% {
            transform: scale(1.2);
          }
        }

        /* -----------------------------------------
           MOBILE
        ----------------------------------------- */

        @media (max-width: 640px) {
          .aurora-circle-one {
            left: -140px;
          }

          .aurora-diamond-one {
            right: -70px;
            transform: scale(0.7) rotate(45deg);
          }

          .aurora-square-one {
            right: -90px;
            transform: scale(0.7) rotate(25deg);
          }
        }
      `}</style>
    </main>
  );
}


