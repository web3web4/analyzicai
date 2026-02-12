import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UXicAI - AnalyzicAI Ecosystem by Web3Web4",
  description:
    "AI-Powered UI/UX Analysis. Part of the AnalyzicAI ecosystem by Web3Web4.com. Get comprehensive design feedback powered by OpenAI, Gemini, and Claude.",
  keywords: [
    "UXicAI",
    "AnalyzicAI",
    "Web3Web4",
    "UI/UX",
    "AI analysis",
    "design feedback",
  ],
  openGraph: {
    title: "UXicAI - AI-Powered UI/UX Analysis",
    description:
      "AnalyzicAI ecosystem product by Web3Web4.com. Get comprehensive design feedback.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
