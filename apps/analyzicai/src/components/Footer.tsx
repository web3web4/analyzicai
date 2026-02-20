import Link from 'next/link';
import { Github, Mail } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = {
    apps: [
      { name: 'UXicAI', href: 'https://UXicAI.com', accent: 'ux' },
      { name: 'SolidicAI', href: 'https://SolidicAI.com', accent: 'chain' },
    ],
    otherCompanyApps: [
      { name: 'NearGami', href: 'https://neargami.com' },
      { name: 'TACoSec', href: 'https://tacosec.com' },
    ],
  };

  const socialLinks = [
    { icon: Github, href: 'https://github.com/web3web4/analyzicai', label: 'GitHub' },
    { icon: Mail, href: 'mailto:hello+analyzicai@web3web4.com', label: 'Email' },
  ];

  return (
    <footer className="bg-surface-950 border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4 group">
              <div className="w-10 h-10 bg-surface-800 flex items-center justify-center border border-ai/40">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <span className="text-xl font-bold tracking-widest font-mono">
                <span className="text-white">Analyzic</span><span className="text-ai">AI</span>
              </span>
            </Link>
            <p className="text-white/60 mb-4 max-w-md text-sm">
              Empowering developers and designers with AI-powered analysis tools for UI/UX, smart contracts, and more.
            </p>
            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-surface-800 border border-white/10 flex items-center justify-center text-white/60 hover:text-ai hover:border-ai/30 transition-all"
                  aria-label={social.label}
                  target="_blank"
                >
                  <social.icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          <div />

          {/* Apps */}
          <div>
            <h3 className="text-white font-mono font-bold text-sm tracking-wider mb-4">Analyzic<span className="text-ai-soft">AI</span> Apps</h3>
            <ul className="space-y-2 font-bold">
              {links.apps.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="hover:opacity-80 transition-opacity text-sm"
                    target="_blank"
                  >
                    <span className={link.accent === 'ux' ? 'text-ux' : 'text-chain'}>{link.name.slice(0, -2)}</span><span className="text-ai-soft">AI</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-mono font-bold text-sm tracking-wider mb-4">More from Web3Web4</h3>
            <ul className="space-y-2">
              {links.otherCompanyApps.map((link, index) => (
                <li key={index}>
                  <Link
                    href={link.href}
                    className="text-white/60 hover:text-ai transition-colors text-sm"
                    target="_blank"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="border-t border-white/[0.08] pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/50 text-xs font-mono mb-4 md:mb-0">
            &copy; {currentYear} <span className='font-bold'><span className='text-white'>Analyzic</span><span className="text-ai-soft">AI</span></span>. All rights reserved.
          </p>
          <div className="flex items-center space-x-6 text-xs font-mono">
            <Link
              href="https://web3web4.com"
              target="_blank"
              className="text-white/50 hover:text-ai transition-colors"
            >
              Built by Web3Web4.com
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
