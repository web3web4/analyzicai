'use client';

import { useState, useEffect, type MouseEvent } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { scrollToSection } from '@/lib/scroll-config';
import { Logo } from '@web3web4/shared-platform';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [active, setActive] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleHash = () => {
      setActive(window.location.hash);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navLinks = [
    { href: '#apps', label: 'Apps' },
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
  ];

  const handleNav = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    scrollToSection(href);
    setActive(href);
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-surface-900/90 backdrop-blur-xl border-b border-white/10'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Logo prefix="Analyzic" containerSize="lg" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNav(e, link.href)}
                className={`relative font-mono text-fg-muted hover:text-ai transition-colors cursor-pointer ${
                  active === link.href
                    ? 'text-ai after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-[2px] after:bg-ai'
                    : ''
                }`}
              >
                {link.label}
              </a>
            ))}
            <a
              href="#cta"
              onClick={(e) => handleNav(e, '#cta')}
              className="px-6 py-2 border-2 border-ai text-ai font-mono font-bold transition-all hover:bg-ai hover:text-white cursor-pointer"
            >
              Get Started
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 border border-ai/40 bg-surface-800 text-ai transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="md:hidden fixed top-16 right-0 w-72 h-[calc(100vh-4rem)] bg-surface-900 border-l border-ai/20 z-50"
          >
            <div className="px-6 py-6 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block font-mono text-fg-secondary hover:text-ai transition-colors"
                  onClick={(e) => handleNav(e, link.href)}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="#cta"
                className="block px-6 py-2 border-2 border-ai text-ai font-mono font-bold transition-all hover:bg-ai hover:text-white text-center"
                onClick={(e) => handleNav(e, '#cta')}
              >
                Get Started
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

