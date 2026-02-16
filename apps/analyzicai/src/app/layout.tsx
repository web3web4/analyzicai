import type { Metadata } from 'next';
import { Inter, Space_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'AnalyzicAI - AI-Powered Analysis Tools',
  description: 'Comprehensive AI-powered analysis tools for UI/UX design, smart contracts, and more. Transform your workflow with intelligent automation.',
  keywords: 'AI, analysis, UI/UX, smart contracts, design tools, automation',
  authors: [{ name: 'AnalyzicAI Team' }],
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
    <html lang="en" className={`${inter.variable} ${spaceMono.variable}`}>
      <body className={`${inter.className} bg-surface-900 text-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
