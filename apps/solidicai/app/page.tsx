import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
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
          <button className="px-8 py-3 bg-white/10 backdrop-blur-lg text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20">
            View Demo
          </button>
        </div>

        <div className="mt-20 pt-10 border-t border-white/10 w-full text-sm text-gray-500 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-white font-bold tracking-tight">
              SolidicAI.com
            </span>
            <span>An AnalyzicAI Product by Web3Web4</span>
          </div>
          <div className="flex gap-8">
            <a
              href="https://analyzicai.com"
              className="hover:text-white transition-colors"
            >
              AnalyzicAI.com
            </a>
            <a
              href="https://uxicai.com"
              className="hover:text-white transition-colors"
            >
              UXicAI.com
            </a>
            <a
              href="https://web3web4.com"
              className="hover:text-white transition-colors"
            >
              Web3Web4.com
            </a>
          </div>
          <p>© 2026 SolidicAI. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
