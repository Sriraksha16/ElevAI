
import type { Metadata } from "next";

import {
  Geist,
  Geist_Mono,
  Inter,
  Sora,
  Space_Grotesk,
} from "next/font/google";

import "./globals.css";

import { SessionProvider } from "@/components/SessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    "https://elevai-production-fc8e.up.railway.app"
  ),

  title: "ElevAI — AI Resume Analyzer & Career Assistant",

  description:
    "Analyze your resume, match job descriptions, create tailored cover letters, and practice interviews with ElevAI, your AI-powered career assistant.",

  applicationName: "ElevAI",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "ElevAI — Elevate Your Career with AI",
    description:
      "Improve your resume, prepare for interviews, and explore AI-powered career tools with ElevAI.",
    url: "https://elevai-production-fc8e.up.railway.app/",
    siteName: "ElevAI",
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "ElevAI — Elevate Your Career with AI",
    description:
      "AI-powered resume analysis, job matching, cover letters, and interview preparation.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${sora.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
