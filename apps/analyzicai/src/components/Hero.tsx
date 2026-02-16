'use client';

import { ArrowRight, Sparkles, ChevronDown } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import GlitchText from './animations/GlitchText';
import { scrollToSection } from '@/lib/scroll-config';

export default function Hero() {
  const noMotion = !!useReducedMotion();

  return (
    <section className="relative flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        {/* Badge */}
        <motion.div
          initial={noMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 border border-cyan/30 bg-surface-800/60 backdrop-blur-sm mb-8 font-mono text-sm">
            <Sparkles className="w-4 h-4 text-cyan" />
            <span className="text-cyan">AI-Powered Analysis Tools</span>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.h1
          className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 text-white leading-tight"
          initial={noMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
        >
          Transform Your Workflow
          <br />
          with{' '}
          <GlitchText trigger="viewport" variant="cyan" as="span" className="text-cyan text-glow-subtle">
            AI Analysis
          </GlitchText>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg sm:text-xl text-white/80 mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={noMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          Comprehensive suite of AI-powered tools designed to analyze, optimize,
          and enhance your UI/UX designs, smart contracts, and more.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={noMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <button
            onClick={() => scrollToSection('#apps')}
            className="group px-8 py-4 bg-cyan text-black font-mono font-bold border-2 border-cyan transition-all hover:bg-cyan/90 flex items-center space-x-2 text-lg cursor-pointer"
          >
            <span>Explore AnalyzicAI Apps</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => scrollToSection('#how-it-works')}
            className="px-8 py-4 bg-transparent text-magenta font-mono font-bold border-2 border-magenta/50 transition-all hover:border-magenta hover:bg-magenta/5 text-lg cursor-pointer"
          >
            Learn More
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto"
          initial={noMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          {[
            { value: 'Multi-AI', label: 'OpenAI, Gemini & Claude', color: 'cyan' as const },
            { value: 'Real-time', label: 'Instant Analysis', color: 'magenta' as const },
            { value: 'Secure', label: 'Enterprise-grade Privacy', color: 'cyan' as const },
          ].map((stat) => (
            <div
              key={stat.value}
              className="p-6 bg-surface-800/50 backdrop-blur-sm border border-white/10 transition-all hover:border-cyan/30"
            >
              <div
                className={`text-3xl sm:text-4xl font-bold font-mono mb-2 ${
                  stat.color === 'cyan' ? 'text-cyan' : 'text-magenta'
                }`}
              >
                {stat.value}
              </div>
              <div className="text-white/60 font-medium text-sm">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="mt-10 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          aria-hidden="true"
        >
          <span className="text-xs font-mono text-white/50 tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown className="w-5 h-5 text-cyan/60" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
