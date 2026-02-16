'use client';

import { Brain, Zap, Shield, Layers, Target, Workflow } from 'lucide-react';
import ScrollReveal, { StaggerContainer, StaggerItem } from './animations/ScrollReveal';

const features = [
  {
    icon: Brain,
    title: 'Multi-AI Intelligence',
    description: 'Harness OpenAI, Gemini, and Claude simultaneously for deeper, more accurate collective-thinking analysis.',
    accent: 'cyan' as const,
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Get expert-level feedback in minutes instead of hours of manual work.',
    accent: 'magenta' as const,
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Enterprise-grade encryption with privacy controls and BYOK (Bring Your Own Keys) support.',
    accent: 'cyan' as const,
  },
  {
    icon: Layers,
    title: 'Multi-Step Pipeline',
    description: 'Cross-provider validation and synthesis for maximum accuracy and a minimum bias.',
    accent: 'magenta' as const,
  },
  {
    icon: Target,
    title: 'Precision Analysis',
    description: 'Domain-specific analysis for UI/UX design, smart contracts security and efficiency, and more to come use-cases!',
    accent: 'cyan' as const,
  },
  {
    icon: Workflow,
    title: 'Seamless Integration',
    description: 'Upload UI screenshots or provide smart contract codes, and get actionable insights.',
    accent: 'magenta' as const,
  },
] as const;

export default function Features() {
  return (
    <section id="features" className="relative py-10 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <ScrollReveal className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
            Powerful <span className="text-cyan">Features</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto font-mono">
            Everything you need to analyze, optimize, and enhance your projects with AI
          </p>
        </ScrollReveal>

        {/* Feature cards */}
        <StaggerContainer stagger={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const isCyan = feature.accent === 'cyan';
            return (
              <StaggerItem key={index}>
                <div className="group relative p-8 bg-surface-700/50 border border-white/[0.08] transition-all duration-300 hover:-translate-y-1 hover:border-cyan/30">
                  {/* Top accent line */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[2px] transition-all duration-500 opacity-0 group-hover:opacity-100 ${
                      isCyan
                        ? 'bg-gradient-to-r from-cyan to-magenta'
                        : 'bg-gradient-to-r from-magenta to-cyan'
                    }`}
                  />

                  <div className="flex items-center gap-4 mb-6">
                    {/* Icon box */}
                    <div
                      className={`w-14 h-14 flex items-center justify-center border transition-all duration-300 flex-shrink-0 ${
                        isCyan
                          ? 'border-cyan/20 bg-cyan/[0.06] group-hover:border-cyan/40'
                          : 'border-magenta/20 bg-magenta/[0.06] group-hover:border-magenta/40'
                      }`}
                    >
                      <feature.icon
                        className={`w-7 h-7 transition-transform duration-300 group-hover:scale-110 ${
                          isCyan ? 'text-cyan' : 'text-magenta'
                        }`}
                      />
                    </div>

                    <h3 className="text-xl font-bold text-white">
                      {feature.title}
                    </h3>
                  </div>

                  <p className="text-white/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
