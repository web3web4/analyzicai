import type { Metadata } from "next";
import { Cascadia_Mono } from "next/font/google";
import "./globals.css";

const font = Cascadia_Mono({
  variable: "--font-cascadia-mono",
  subsets: ["latin"],
  adjustFontFallback: false, // custom fallback @font-face defined in shared index.css
  fallback: ["Cascadia Mono Fallback", "Courier New", "monospace"],
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
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
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
        className={`${font.variable} antialiased min-h-screen`}
      >
        {children}
      </body>
    </html>
  );
}
