import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-secondary-50 to-primary-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20 animate-gradient" />
      
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-primary-200/30 to-transparent rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-secondary-200/30 to-transparent rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }} />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full mb-8 shadow-lg">
          <Sparkles className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            AI-Powered Analysis Tools
          </span>
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent animate-gradient">
          Transform Your Workflow
          <br />
          with AI Analysis
        </h1>

        <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
          Comprehensive suite of AI-powered tools designed to analyze, optimize, and enhance your UI/UX designs, smart contracts, and more.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="#apps"
            className="group px-8 py-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl hover:from-primary-700 hover:to-secondary-700 transition-all font-semibold shadow-xl hover:shadow-2xl flex items-center space-x-2 text-lg"
          >
            <span>Explore AnalyzicAI Apps</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            href="#how-it-works"
            className="px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 text-lg"
          >
            Learn More
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
          <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
              Multi-AI
            </div>
            <div className="text-gray-600 dark:text-gray-400 font-medium">
              OpenAI, Gemini & Claude
            </div>
          </div>
          
          <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
              Real-time
            </div>
            <div className="text-gray-600 dark:text-gray-400 font-medium">
              Instant Analysis
            </div>
          </div>
          
          <div className="p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg">
            <div className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
              Secure
            </div>
            <div className="text-gray-600 dark:text-gray-400 font-medium">
              Enterprise-grade Privacy
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
