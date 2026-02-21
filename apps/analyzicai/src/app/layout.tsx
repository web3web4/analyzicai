import type { Metadata } from 'next';
import { Cascadia_Mono } from "next/font/google";
import "./globals.css";

const font = Cascadia_Mono({
  variable: "--font-cascadia-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'AnalyzicAI - AI-Powered Analysis Tools',
  description: 'Comprehensive AI-powered analysis tools for UI/UX design, smart contracts, and more. Transform your workflow with intelligent automation.',
  keywords: 'AI, analysis, UI/UX, smart contracts, design tools, automation',
  authors: [{ name: 'AnalyzicAI Team' }],
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'AnalyzicAI - AI-Powered Analysis Tools',
    description: 'Comprehensive AI-powered analysis tools for UI/UX design, smart contracts, and more.',
    type: 'website',
    url: 'https://analyzicai.com',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AnalyzicAI - AI-Powered Analysis Tools',
    description: 'Comprehensive AI-powered analysis tools for UI/UX design, smart contracts, and more.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${font.className} bg-surface-900 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
