'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@web3web4/shared-platform';
import ScrollReveal from './animations/ScrollReveal';

const apps = [
  {
    name: 'SolidicAI',
    tagline: 'Smart Contract Intensive AI Analysis',
    description: 'Analyze Solidity smart contracts for security vulnerabilities, gas optimization opportunities, and best practice compliance. Get expert-level code review powered by AI.',
    logoPrefix: 'Solidic' as const,
    accent: 'chain' as const,
    features: [
      'Security vulnerability detection',
      'Gas optimization analysis',
      'Code quality assessment',
      'Multi-provider AI code analysis',
    ],
    url: 'https://SolidicAI.com',
    status: 'Live',
  },
  {
    name: 'UXicAI',
    tagline: 'AI-Powered UI/UX Analysis',
    description: 'Upload or capture screenshots to get comprehensive design feedback from multiple AI providers. Analyze visual hierarchy, accessibility, user experience, and design consistency.',
    logoPrefix: 'UXic' as const,
    accent: 'ux' as const,
    features: [
      'Screenshot analysis with WebRTC capture',
      'Design system recommendations',
      'Accessibility compliance checks',
      'Multi-provider AI vision analysis',
    ],
    url: 'https://UXicAI.com',
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
            Analyzic<span className="text-ai">AI</span> <span className="text-ai-soft">Apps</span> Family
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto font-mono">
            Specialized AI-powered analysis tools for different domains
          </p>
        </ScrollReveal>

        {/* App cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {apps.map((app, index) => {
            const isUx = app.accent === 'ux';
            return (
              <ScrollReveal
                key={index}
                direction={isUx ? 'left' : 'right'}
                delay={index * 0.15}
              >
                <div className="group relative h-full bg-surface-800/60 border border-white/[0.08] transition-all duration-300 hover:border-ai/20 overflow-hidden">
                  {/* Left accent border */}
                  <div
                    className={`absolute top-0 left-0 w-[2px] h-full ${
                      isUx ? 'bg-ux' : 'bg-chain'
                    }`}
                  />

                  <div className="p-8 lg:p-10">
                    {/* Header */}
                    <div className="flex items-center space-x-4 mb-6">
                      <Logo prefix={app.logoPrefix} containerSize="lg" showText={false} />
                      <div>
                        <h3 className="text-2xl font-bold">
                          <span className={isUx ? 'text-ux' : 'text-chain'}>{app.name.slice(0, -2)}</span><span className="text-ai-soft">AI</span>
                        </h3>
                        <p className={`text-sm font-mono ${isUx ? 'text-ux' : 'text-chain'}`}>
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
                              isUx ? 'bg-ux' : 'bg-chain'
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
                          isUx
                            ? 'border-ux bg-ux text-white hover:bg-ux/90'
                            : 'border-chain bg-chain text-black hover:bg-chain/90'
                        }`}
                      >
                        <span>Visit {app.name}</span>
                        <ExternalLink className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                      <span
                        className={`px-3 py-1 text-xs font-mono border ${
                          isUx
                            ? 'border-ux/30 text-ux bg-ux/[0.06]'
                            : 'border-chain/30 text-chain bg-chain/[0.06]'
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
