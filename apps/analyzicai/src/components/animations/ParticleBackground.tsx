'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { loadSlim } from '@tsparticles/slim';
import type { ISourceOptions } from '@tsparticles/engine';

export default function ParticleBackground() {
  const [init, setInit] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setInit(true));

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const options: ISourceOptions = useMemo(
    () => ({
      fullScreen: false,
      fpsLimit: isMobile ? 30 : 60,
      detectRetina: true,
      particles: {
        color: {
          value: '#C044FF',
        },
        links: {
          color: '#FF2D9E',
          distance: isMobile ? 100 : 140,
          enable: true,
          opacity: isMobile ? 0.08 : 0.12,
          width: 1,
        },
        move: {
          enable: true,
          speed: isMobile ? 0.3 : 0.5,
          direction: 'none' as const,
          random: true,
          straight: false,
          outModes: {
            default: 'out' as const,
          },
        },
        number: {
          density: {
            enable: true,
            width: 1920,
            height: 1080,
          },
          value: isMobile ? 15 : 35,
        },
        opacity: {
          value: { min: 0.1, max: 0.5 },
          animation: {
            enable: true,
            speed: 0.3,
            sync: false,
          },
        },
        shape: {
          type: 'circle',
        },
        size: {
          value: { min: 1, max: isMobile ? 2 : 2.5 },
        },
      },
      interactivity: {
        events: {
          onHover: {
            enable: false,
          },
          resize: {
            enable: true,
          },
        },
      },
    }),
    [isMobile]
  );

  if (!init) return null;

  return (
    <div className="fixed inset-0 z-[1] pointer-events-none" aria-hidden="true">
      <Particles
        id="cyber-particles"
        className="h-full w-full"
        options={options}
      />
    </div>
  );
}
