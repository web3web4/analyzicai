'use client';

import dynamic from 'next/dynamic';

import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import AppsShowcase from '@/components/AppsShowcase';
import HowItWorks from '@/components/HowItWorks';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';


const CyberTerrain = dynamic(
  () => import('@/components/three/CyberTerrain'),
  { ssr: false },
);
const ParticleBackground = dynamic(
  () => import('@/components/animations/ParticleBackground'),
  { ssr: false },
);

export default function ClientPage() {
  return (
    <div className="relative min-h-screen bg-surface-900">
      {/* Fixed 3D terrain background */}
      <CyberTerrain />

      {/* Particle overlay */}
      <ParticleBackground />

      {/* Navigation */}
      <Navigation />

      {/* Page content — normal scroll flow */}
      <div className="relative z-10">
        <Hero />
        <AppsShowcase />
        <Features />
        <HowItWorks />
        <CTA />
      </div>


      {/* Spacer — roughly one footer-height, keeps content from scrolling up over the logo */}
      <div className="relative z-0 h-[20rem]" aria-hidden="true" />
      {/* Footer — normal scroll flow, transparent so canvas shows through */}
      <div className="relative z-10">
        <Footer />
      </div>
    </div>
  );
}
