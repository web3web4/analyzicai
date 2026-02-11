export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto p-8 text-center">
        <h1 className="text-6xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
          SolidicAI
        </h1>
        <p className="text-2xl text-gray-300 mb-8">
          AI-Powered Smart Contract Security & Gas Optimization
        </p>
        <p className="text-lg text-gray-400 mb-12">
          Analyze your contract for vulnerabilities and gas inefficiencies using
          multi-provider AI consensus
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
          <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl">
            Start Analysis
          </button>
          <button className="px-8 py-3 bg-white/10 backdrop-blur-lg text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/20">
            View Demo
          </button>
        </div>

        <div className="mt-16 text-sm text-gray-500">
          <p>Powered by @web3web4/ai-core • Built on Next.js</p>
        </div>
      </div>
    </div>
  );
}
