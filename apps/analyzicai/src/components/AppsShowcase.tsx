'use client';

import { Palette, Code2, ArrowRight, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import ScrollReveal from './animations/ScrollReveal';

const apps = [
  {
    name: 'UXicAI',
    tagline: 'AI-Powered UI/UX Analysis',
    description: 'Upload screenshots or capture screens to get comprehensive design feedback from multiple AI providers. Analyze visual hierarchy, accessibility, user experience, and design consistency.',
    icon: Palette,
    accent: 'cyan' as const,
    features: [
      'Screenshot analysis with WebRTC capture',
      'Multi-provider AI vision analysis',
      'Design system recommendations',
      'Accessibility compliance checks',
      'Real-time feedback',
    ],
    url: 'https://UXicAI.com',
    status: 'Live',
  },
  {
    name: 'SolidicAI',
    tagline: 'Smart Contract Intelligence',
    description: 'Analyze Solidity smart contracts for security vulnerabilities, gas optimization opportunities, and best practice compliance. Get expert-level code review powered by AI.',
    icon: Code2,
    accent: 'magenta' as const,
    features: [
      'Security vulnerability detection',
      'Gas optimization analysis',
      'Best practice compliance',
      'Code quality assessment',
      'Automated documentation',
    ],
    url: 'https://SolidicAI.com',
    status: 'Live',
  },
];

export default function AppsShowcase() {
  return (
    <section id="apps" className="relative py-10">
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section heading */}
        <ScrollReveal className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-white">
            AnalyzicAI <span className="text-magenta">Apps</span> Family
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto font-mono">
            Specialized AI-powered analysis tools for different domains
          </p>
        </ScrollReveal>

        {/* App cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {apps.map((app, index) => {
            const isCyan = app.accent === 'cyan';
            return (
              <ScrollReveal
                key={index}
                direction={isCyan ? 'left' : 'right'}
                delay={index * 0.15}
              >
                <div className="group relative h-full bg-surface-800/60 border border-white/[0.08] transition-all duration-300 hover:border-cyan/20 overflow-hidden">
                  {/* Left accent border */}
                  <div
                    className={`absolute top-0 left-0 w-[2px] h-full ${
                      isCyan ? 'bg-cyan' : 'bg-magenta'
                    }`}
                  />

                  <div className="p-8 lg:p-10">
                    {/* Header */}
                    <div className="flex items-center space-x-4 mb-6">
                      <div
                        className={`w-14 h-14 flex items-center justify-center border ${
                          isCyan
                            ? 'border-cyan/30 bg-cyan/[0.08]'
                            : 'border-magenta/30 bg-magenta/[0.08]'
                        }`}
                      >
                        <app.icon className={`w-7 h-7 ${isCyan ? 'text-cyan' : 'text-magenta'}`} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{app.name}</h3>
                        <p className={`text-sm font-mono ${isCyan ? 'text-cyan' : 'text-magenta'}`}>
                          {app.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-white/70 leading-relaxed mb-6">
                      {app.description}
                    </p>

                    {/* Features */}
                    <ul className="space-y-2 mb-8">
                      {app.features.map((feature, fi) => (
                        <li key={fi} className="flex items-start space-x-3">
                          <span
                            className={`mt-2 w-1.5 h-1.5 flex-shrink-0 ${
                              isCyan ? 'bg-cyan' : 'bg-magenta'
                            }`}
                          />
                          <span className="text-white/70 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Actions */}
                    <div className="flex items-center space-x-4">
                      <Link
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`group/btn px-6 py-3 font-mono font-bold text-sm flex items-center space-x-2 transition-all border-2 ${
                          isCyan
                            ? 'border-cyan bg-cyan text-black hover:bg-cyan/90'
                            : 'border-magenta bg-magenta text-white hover:bg-magenta/90'
                        }`}
                      >
                        <span>Visit {app.name}</span>
                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                      <span
                        className={`px-3 py-1 text-xs font-mono border ${
                          isCyan
                            ? 'border-cyan/30 text-cyan bg-cyan/[0.06]'
                            : 'border-magenta/30 text-magenta bg-magenta/[0.06]'
                        }`}
                      >
                        {app.status}
                      </span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
