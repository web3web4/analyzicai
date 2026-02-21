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
  title: "SolidicAI - AnalyzicAI Ecosystem by Web3Web4",
  description:
    "AI-Powered Smart Contract Security & Gas Optimization. Part of the AnalyzicAI ecosystem by Web3Web4.com. Multi-AI consensus analysis for Ethereum and EVM contracts.",
  keywords: [
    "SolidicAI",
    "AnalyzicAI",
    "Web3Web4",
    "Smart Contract",
    "Security Audit",
    "Gas Optimization",
    "Ethereum",
    "Solidity",
  ],
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
    <html lang="en">
      <body
        className={`${font.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
