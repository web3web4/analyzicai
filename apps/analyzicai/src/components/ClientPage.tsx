'use client';

import { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';
import dynamic from 'next/dynamic';

import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import AppsShowcase from '@/components/AppsShowcase';
import HowItWorks from '@/components/HowItWorks';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';
import { SCROLL_HEIGHT_VH, SECTION_RANGES, scrollToSection } from '@/lib/scroll-config';
import { ScrollDrivenProvider } from '@/components/animations/ScrollDrivenContext';


const CyberTerrain = dynamic(
  () => import('@/components/three/CyberTerrain'),
  { ssr: false },
);
const ParticleBackground = dynamic(
  () => import('@/components/animations/ParticleBackground'),
  { ssr: false },
);

function useSectionStyle(
  progress: MotionValue<number>,
  range: { fadeIn: number; visStart: number; visEnd: number; fadeOut: number },
  disabled: boolean,
) {
  const opacity = useTransform(
    progress,
    [range.fadeIn, range.visStart, range.visEnd, range.fadeOut],
    disabled ? [1, 1, 1, 1] : [0, 1, 1, 0],
  );

  const scale = useTransform(
    progress,
    [range.fadeIn, range.visStart, range.visEnd, range.fadeOut],
    disabled ? [1, 1, 1, 1] : [0.85, 1, 1, 0.85],
  );
  return { opacity, scale };
}

export default function ClientPage() {
  const runwayRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [introVisible, setIntroVisible] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const disabled = !!prefersReducedMotion || isMobile;

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ['start start', 'end end'],
  });


  const sectionKeys = ['hero', 'apps', 'features', 'howitworks', 'cta'] as const;
  const sectionRanges = sectionKeys.map((k) => SECTION_RANGES[k]);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    // Hide intro once past its fade-out point
    const inIntro = v <= SECTION_RANGES.intro.fadeOut;
    setIntroVisible(inIntro);

    // Check main sections (hero through cta)
    for (let i = sectionRanges.length - 1; i >= 0; i--) {
      const s = sectionRanges[i];
      if (v >= s.fadeIn && v <= s.fadeOut) {
        setActiveIdx(i);
        return;
      }
    }
    // In intro zone
    if (inIntro) {
      setActiveIdx(-1);
    }
  });


  const hero = useSectionStyle(scrollYProgress, SECTION_RANGES.hero, disabled);
  const apps = useSectionStyle(scrollYProgress, SECTION_RANGES.apps, disabled);
  const features = useSectionStyle(scrollYProgress, SECTION_RANGES.features, disabled);
  const howItWorks = useSectionStyle(scrollYProgress, SECTION_RANGES.howitworks, disabled);
  const cta = useSectionStyle(scrollYProgress, SECTION_RANGES.cta, disabled);
 
  const bgOpacity = useTransform(
    scrollYProgress,
    [SECTION_RANGES.hero.fadeIn, SECTION_RANGES.hero.visStart, SECTION_RANGES.cta.visEnd, SECTION_RANGES.cta.fadeOut],
    disabled ? [1, 1, 1, 1] : [0, 1, 1, 0],
  );
  const introOpacity = useTransform(
    scrollYProgress,
    [SECTION_RANGES.intro.visStart, SECTION_RANGES.intro.visEnd, SECTION_RANGES.intro.fadeOut],
    disabled ? [0, 0, 0] : [1, 1, 0],
  );
  const introScale = useTransform(
    scrollYProgress,
    [SECTION_RANGES.intro.visStart, SECTION_RANGES.intro.visEnd, SECTION_RANGES.intro.fadeOut],
    disabled ? [1, 1, 1] : [1, 1, 1.15],
  );
  const introBorderOpacity = useTransform(
    scrollYProgress,
    [SECTION_RANGES.intro.visStart, SECTION_RANGES.intro.visEnd, SECTION_RANGES.intro.fadeOut],
    disabled ? [0, 0, 0] : [1, 1, 0],
  );

  /* ── Mobile: normal scrolling fallback ── */
  if (isMobile) {
    return (
      <div className="relative min-h-screen bg-surface-900">
        <ParticleBackground />
        <Navigation />
        <div className="relative z-10">
          <Hero />
          <AppsShowcase />
          <Features />
          <HowItWorks />
          <CTA />
        </div>
        <Footer />
      </div>
    );
  }

  const layers = [
    { style: hero, content: <Hero />, key: 'hero' },
    { style: apps, content: <AppsShowcase />, key: 'apps' },
    { style: features, content: <Features />, key: 'features' },
    { style: howItWorks, content: <HowItWorks />, key: 'howitworks' },
    { style: cta, content: <CTA />, key: 'cta' },
  ];

  return (
    <>
      {/* Scroll runway — creates the scrollable height */}
      <div
        ref={runwayRef}
        data-scroll-runway
        className="relative bg-surface-900"
        style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
      >
        {/* Fixed viewport — everything visible lives here */}
        <div className="sticky top-0 h-screen overflow-hidden">
          {/* 3D terrain background */}
          <CyberTerrain />

          {/* Particle overlay */}
          <ParticleBackground />

          {/* Navigation */}
          <Navigation />

          {/* Intro overlay — visible on initial load, fades into hero */}
          {introVisible && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center"
            style={{
              opacity: introOpacity,
              scale: introScale,
              pointerEvents: activeIdx === -1 ? 'auto' : 'none',
            }}
          >
            <motion.button
              onClick={() => scrollToSection('#hero')}
              className="relative px-10 py-6 cursor-pointer bg-transparent group"
              style={{ borderWidth: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <motion.div
                className="absolute inset-0 border-2 border-cyan/60"
                style={{ opacity: introBorderOpacity }}
              />
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight text-center">
                Transform Your Workflow
                <br />
                with{' '}
                <span className="text-cyan text-glow-subtle">AI Analysis</span>
              </h1>
              <div className="mt-4 text-white/50 text-sm font-mono text-center group-hover:text-white/70 transition-colors">
                Click to enter ▾
              </div>
            </motion.button>
          </motion.div>
          )}

          {/* Shared background overlay — single layer, no border conflicts */}
          <motion.div
            className="absolute inset-0 z-[5] bg-surface-900/60 backdrop-blur-sm pointer-events-none"
            style={{ opacity: bgOpacity }}
          />

          {/* Section layers — stacked absolutely, cross-fade in place */}
          <ScrollDrivenProvider value={true}>
          {layers.map((layer, i) => (
            <motion.div
              key={layer.key}
              className="absolute inset-0 z-10 flex items-center justify-center"
              style={{
                opacity: layer.style.opacity,
                scale: layer.style.scale,
                pointerEvents: activeIdx === i ? 'auto' : 'none',
                willChange: 'transform, opacity',
              }}
            >
              <div className="w-full h-full overflow-y-auto pt-16">
                {layer.content}
              </div>
            </motion.div>
          ))}
          </ScrollDrivenProvider>
        </div>
      </div>

      {/* Footer — normal flow after the scroll experience */}
      <div className="relative z-10 bg-surface-900">
        <Footer />
      </div>
    </>
  );
}
