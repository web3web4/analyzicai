import { ArrowRight, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function CTA() {
  return (
    <section id="cta" className="py-20 bg-gradient-to-br from-primary-600 via-secondary-600 to-primary-700 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-8">
          <Rocket className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">
            Ready to Transform Your Workflow?
          </span>
        </div>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
          Start Analyzing with AI Today
        </h2>

        <p className="text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
          Join developers and designers who are already using AnalyzicAI tools to enhance their projects with intelligent analysis and optimization.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="https://UXicAI.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-4 bg-white text-primary-700 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-xl hover:shadow-2xl flex items-center space-x-2 text-lg"
          >
            <span>Try UXicAI</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <Link
            href="https://SolidicAI.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group px-8 py-4 bg-white text-primary-700 rounded-xl hover:bg-gray-100 transition-all font-semibold shadow-xl hover:shadow-2xl flex items-center space-x-2 text-lg"
          >
            <span>Try SolidicAI</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto">
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">Free Sign Up</div>
            <div className="text-white/80">No credit card required</div>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">BYOK</div>
            <div className="text-white/80">Bring your own API keys</div>
          </div>
          
          <div className="p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
            <div className="text-3xl font-bold text-white mb-2">Subscription</div>
            <div className="text-white/80">Subscription plans will be available soon!</div>
          </div>
        </div>
      </div>
    </section>
  );
}
