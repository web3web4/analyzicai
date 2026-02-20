'use client';

import { Upload, Brain, CheckCircle2, Sparkles } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './animations/ScrollReveal';

const steps = [
  {
    icon: Upload,
    title: 'Select & Configure',
    description: 'Choose the specialized tool that fits your needs, share your work, and configure your preferred AI providers and analysis settings.',
    accent: 'ai' as const,
  },
  {
    icon: Brain,
    title: 'Parallel Processing',
    description: 'Each AI provider independently applies its unique analytical framework, generating diverse perspectives concurrently.',
    accent: 'soft' as const,
  },
  {
    icon: Sparkles,
    title: 'Cross-Validation Layer',
    description: 'Providers examine alternative viewpoints, identifying consensus areas and resolving discrepancies through comparative analysis, idea pollination and rethinking based on other models feedback.',
    accent: 'ai' as const,
  },
  {
    icon: CheckCircle2,
    title: 'Synthesis & Delivery',
    description: 'A unified synthesis emerges, combining validated insights with prioritized recommendations from all analytical streams.',
    accent: 'soft' as const,
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-10 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <ScrollReveal className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
            How It <span className="text-ai">Works</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto font-mono">
            Simple, powerful, and intelligent — our multi-step AI pipeline delivers results
          </p>
        </ScrollReveal>

        <div className="relative">
          {/* Connection line for desktop */}
          <div className="hidden lg:block absolute top-10 left-[8%] right-[8%] z-0" aria-hidden="true">
            <div className="h-[1px] bg-gradient-to-r from-ai via-ai-soft to-ai opacity-40" />
            {/* Travelling pulse */}
            <div
              className="absolute top-0 left-0 w-24 h-[1px] bg-gradient-to-r from-transparent via-ai to-transparent animate-scan-line opacity-80"
            />
          </div>

          {/* Steps grid */}
          <StaggerContainer stagger={0.15} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {steps.map((step, index) => {
              const isAi = step.accent !== 'soft';
              return (
                <StaggerItem key={index}>
                  <div className="relative flex flex-col items-center text-center">
                    {/* Icon box */}
                    <div
                      className={`relative z-20 w-20 h-20 flex items-center justify-center border mb-6 transition-all ${
                        isAi
                          ? 'border-ai/30 bg-surface-700'
                          : 'border-ai-soft/30 bg-surface-700'
                      }`}
                    >
                      <step.icon className={`w-9 h-9 ${isAi ? 'text-ai' : 'text-ai-soft'}`} />

                      {/* Step number badge */}
                      <div
                        className={`absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center text-xs font-mono font-bold z-30 ${
                          isAi
                            ? 'bg-ai-soft text-white'
                            : 'bg-ai text-white'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Text */}
                    <h3 className="text-lg font-bold mb-3 text-white">
                      {step.title}
                    </h3>
                    <p className="text-white/70 leading-relaxed text-sm">
                      {step.description}
                    </p>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>

        {/* Info panel */}
        <ScrollReveal delay={0.3} className="mt-10">
          <div className="p-8 bg-surface-700/50 border-l-2 border-ai">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Advanced Multi-Step Pipeline
                </h3>
                <p className="text-white/70 max-w-2xl">
                  Our unique approach combines the strengths of multiple AI providers, with cross-validation and synthesis to deliver the most accurate and comprehensive analysis.
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="flex items-center space-x-2 px-6 py-3 border border-ai-soft/30 bg-ai-soft/[0.06] font-mono text-sm">
                  <Sparkles className="w-5 h-5 text-ai-soft" />
                  <span className="font-bold text-ai-soft">3-Step Validation</span>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
