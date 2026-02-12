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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
