'use client';

import { ArrowRight, Rocket } from 'lucide-react';
import Link from 'next/link';
import ScrollReveal from './animations/ScrollReveal';
import GlitchText from './animations/GlitchText';

export default function CTA() {
  return (
    <section id="cta" className="relative py-10 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <ScrollReveal>
          <div className="inline-flex items-center space-x-2 px-4 py-2 border border-ai-soft/30 bg-ai-soft/[0.06] mb-8 font-mono text-sm">
            <Rocket className="w-4 h-4 text-ai-soft" />
            <span className="text-ai-soft">Ready to Transform Your Workflow?</span>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.05}>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
            Start Analyzing with{' '}
            <GlitchText trigger="viewport" variant="ai" as="span" className="text-ai text-glow-subtle">
              AI Today
            </GlitchText>
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <p className="text-lg text-white/80 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join developers and designers who are already using Analyzic<span className="text-ai">AI</span> tools to enhance their projects with intelligent analysis and optimization.
          </p>
        </ScrollReveal>

        {/* CTA Buttons */}
        <ScrollReveal delay={0.15}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="https://UXicAI.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-gradient-to-r text-white font-mono font-black border-2 border-ux transition-all hover:opacity-90 flex items-center space-x-2 text-lg"
            >
              <span>Try <span className="opacity-90 text-ux">UXic</span><span className="text-ai-soft">AI</span></span>
              <ArrowRight className="w-5 h-5 text-ux group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              href="https://SolidicAI.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-transparent font-mono font-extrabold border-2 border-chain/60 transition-all hover:border-chain hover:bg-chain/5 flex items-center space-x-2 text-lg"
            >
              <span>Try <span className="text-chain">Solidic</span><span className="text-ai-soft">AI</span></span>
              <ArrowRight className="w-5 h-5 text-chain group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Info cards */}
        <ScrollReveal delay={0.2}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 max-w-4xl mx-auto">
            {[
              { title: 'Free Sign Up', sub: 'No credit card required', accent: 'ai' as const },
              { title: 'BYOK', sub: 'Bring your own API keys', accent: 'soft' as const },
              { title: 'Subscription', sub: 'Plans available soon!', accent: 'ai' as const },
            ].map((card) => (
              <div
                key={card.title}
                className="p-6 bg-surface-800/50 backdrop-blur-sm border border-white/10 transition-all hover:border-ai/30"
              >
                <div
                  className={`text-2xl font-bold font-mono mb-2 ${
                    card.accent === 'ai' ? 'text-ai' : 'text-ai-soft'
                  }`}
                >
                  {card.title}
                </div>
                <div className="text-white/60 text-sm">{card.sub}</div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
