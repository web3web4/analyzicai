'use client';

import Link from "next/link";
import { Logo } from "@web3web4/shared-platform";
import { createBrowserClient } from '@web3web4/shared-platform/supabase/client';
import { useEffect, useState } from 'react';
import { User } from 'lucide-react';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };

    checkAuth();

    const supabase = createBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-primary/8 to-slate-950">
      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <Logo containerSize="lg" prefix="Solidic" />
          <span className="text-xs px-2 py-0.5 rounded-full border border-primary text-primary font-mono">
            v1 pre-alpha
          </span>
        </div>
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <form action="/api/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-white/90 hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </form>
              <Link
                href="/dashboard"
                className="px-5 py-2 bg-gradient-to-r from-accent-light to-primary-light text-black rounded-full font-bold border border-transparent hover:[background-image:none] hover:bg-slate-900 hover:text-primary hover:border-primary/40 transition-all flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-white/90 hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 bg-gradient-to-r from-accent-light to-primary-light text-black rounded-full font-bold border border-transparent hover:[background-image:none] hover:bg-slate-900 hover:text-primary hover:border-primary/40 transition-all"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="relative py-24 md:py-32 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 mb-8">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm text-gray-400">
              Powered by GPT, Gemini & Claude
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
            Audit Smarter.
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-6">
            AI-powered smart contract security audits and gas optimization — Solidity, Vyper, and beyond.
          </p>
          <p className="text-gray-500 mb-12">
            Multiple AI providers independently analyze your contract, then synthesize a single prioritized report.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-gradient-to-r from-accent-light to-primary-light text-black font-bold rounded-full border border-transparent hover:[background-image:none] hover:bg-slate-900 hover:text-primary hover:border-primary/40 transition-all shadow-lg hover:shadow-xl text-lg"
            >
              Start Auditing Free
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 bg-primary/10 text-primary font-semibold rounded-full hover:bg-primary/20 transition-all border border-primary/30 text-lg"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </header>

      {/* Features / Pipeline */}
      <section id="features" className="py-24 px-6 bg-slate-950/70">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Multi-Provider Intelligence
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              No single AI has the full picture. Running independent models in parallel reduces bias — catching vulnerabilities one model misses while filtering out false positives others over-report.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl p-8 border border-primary/20">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-primary">01</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Parallel Audit
              </h3>
              <p className="text-gray-400">
                Each AI provider independently analyzes your contract, scoring security, gas efficiency, code quality, and best practices.
              </p>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl p-8 border border-accent/20 border-dashed">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                  <span className="text-xl font-bold text-accent">02</span>
                </div>
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                  Coming in V2
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Cross-Review & Rethinking
              </h3>
              <p className="text-gray-400">
                Providers review each other&apos;s findings, reconsidering assessments and surfacing blind spots before synthesis.
              </p>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl p-8 border border-primary/20">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-green-400">03</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">
                Master Synthesis
              </h3>
              <p className="text-gray-400">
                Your trusted provider consolidates all findings into a final, actionable report with severity-ranked vulnerabilities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What We Analyze
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Every audit covers the critical vulnerability classes and optimization opportunities in your smart contracts.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Reentrancy", icon: "🔁" },
              { name: "Access Control", icon: "🔐" },
              { name: "Integer Overflow", icon: "💥" },
              { name: "Front-Running", icon: "🏃" },
              { name: "Gas Optimization", icon: "⚡" },
              { name: "Logic Errors", icon: "🧠" },
              { name: "Oracle Manipulation", icon: "🔮" },
              { name: "Code Quality", icon: "✅" },
            ].map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-3 p-4 rounded-xl bg-slate-900/60 hover:bg-slate-900 transition-colors border border-primary/15"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-gray-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-slate-950/70">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ship with confidence.
          </h2>
          <p className="text-gray-400 text-lg mb-3">
            Start free with your own API keys. No credit card required.
          </p>
          <p className="text-sm text-gray-500 mb-10">
            Subscription plans coming soon —{" "}
            <Link href="/waitlist" className="underline underline-offset-2 hover:text-primary transition-colors">
              join the waitlist
            </Link>{" "}
            for early access.
          </p>
          <Link
            href="/signup"
            className="px-10 py-4 bg-gradient-to-r from-accent-light to-primary-light text-black font-bold rounded-full border border-transparent hover:[background-image:none] hover:bg-slate-900 hover:text-primary hover:border-primary/40 transition-all shadow-lg hover:shadow-xl text-lg inline-block"
          >
            Start Auditing Free
          </Link>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-primary/15 bg-slate-950/90">
        <div className="max-w-7xl mx-auto md:items-start lg:items-start flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
          <div className="flex flex-col max-w-2xl">
            <Logo containerSize="md" prefix="Solidic" />
            <div className=" ml-2 text-sm text-gray-400">
              AI-powered smart contract analysis
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 w-full lg:w-auto">
            <div className="space-y-4">
              <h4 className="font-bold text-white">Product</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/analyze"
                    className="hover:text-primary transition-colors"
                  >
                    Start Analysis
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-white">Ecosystem</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li>
                  <Link
                    href="https://analyzicai.com"
                    target="_blank"
                    className="hover:text-primary transition-colors"
                  >
                    AnalyzicAI.com
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://uxicai.com"
                    target="_blank"
                    className="hover:text-primary transition-colors"
                  >
                    UXicAI.com
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4 col-span-2 md:col-span-1">
              <h4 className="font-bold text-white">Developed by</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li>
                  <Link
                    href="https://web3web4.com"
                    target="_blank"
                    className="hover:text-primary transition-colors"
                  >
                    Web3Web4.com
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://github.com/web3web4/analyzicai"
                    target="_blank"
                    className="hover:text-primary transition-colors"
                  >
                    GitHub
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
