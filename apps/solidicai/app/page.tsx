import Link from "next/link";
import { Logo } from "@web3web4/ui-library";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto p-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">
              AnalyzicAI Ecosystem
            </span>
          </div>

          <h1 className="text-6xl font-bold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
            SolidicAI
          </h1>
          <div className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">
            by Web3Web4.com
          </div>

          <p className="text-2xl text-gray-300 mb-8">
            AI-Powered Smart Contract Security & Gas Optimization
          </p>
          <p className="text-lg text-gray-400 mb-12">
            Comprehensive analysis powered by multi-provider AI consensus. Part of
            the <span className="text-white font-semibold">AnalyzicAI</span>{" "}
            family.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Security Audit
              </h3>
              <p className="text-gray-300 text-sm">
                Detect reentrancy, overflow, access control, and 20+ vulnerability
                patterns
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Gas Optimization
              </h3>
              <p className="text-gray-300 text-sm">
                Identify storage patterns, loop optimizations, and data type
                improvements
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Multi-AI Consensus
              </h3>
              <p className="text-gray-300 text-sm">
                Powered by OpenAI, Gemini, and Claude for comprehensive analysis
              </p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard/analyze"
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl"
            >
              Start Analysis
            </Link>
            {/* <button className="px-8 py-3 bg-white/10 backdrop-blur-lg text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20">
            View Demo
          </button> */}
          </div>
        </div>
      </div>

      <footer className="py-12 px-6 border-t border-white/10 bg-slate-900/50">
        <div className="max-w-7xl mx-auto md:items-start lg:items-start flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-24">
          <div className="flex flex-col md:flex-row gap-6 max-w-2xl">
            <Logo containerSize="md" prefix="Solidic" prefixSize="medium" />
            <div className="flex flex-col gap-1">
              <div className="text-sm text-gray-400">
                AI-powered smart contract analysis
              </div>
              <div className="text-sm text-gray-500">
                An AnalyzicAI product
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 md:gap-12 w-full lg:w-auto">
            <div className="space-y-4">
              <h4 className="font-bold text-white">Product</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-purple-400 transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/analyze"
                    className="hover:text-purple-400 transition-colors"
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
                    className="hover:text-purple-400 transition-colors"
                  >
                    AnalyzicAI.com
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://solidicai.com"
                    target="_blank"
                    className="hover:text-purple-400 transition-colors"
                  >
                    SolidicAI.com
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
                    className="hover:text-purple-400 transition-colors"
                  >
                    Web3Web4.com
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
