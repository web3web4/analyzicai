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
  title: "UXicAI - AI-Powered UI/UX Analysis",
  description:
    "Analyze your UI/UX with multiple AI vision models. Get comprehensive design feedback powered by OpenAI, Gemini, and Claude.",
  keywords: [
    "UI/UX",
    "AI analysis",
    "design feedback",
    "accessibility",
    "web design",
  ],
  openGraph: {
    title: "UXicAI - AI-Powered UI/UX Analysis",
    description:
      "Get comprehensive design feedback powered by multiple AI vision models.",
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
