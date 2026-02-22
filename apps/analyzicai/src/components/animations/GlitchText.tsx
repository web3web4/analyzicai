'use client';

import { useState, useCallback, useRef, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface GlitchTextProps {
  children: ReactNode;
  /** Trigger mode: 'hover' glitches on mouseover, 'viewport' glitches once on enter, 'loop' glitches continuously */
  trigger?: 'hover' | 'viewport' | 'loop';
  /** CSS classes applied to the wrapper */
  className?: string;
  /** AI purple or UX pink glitch color offset (default uses both) */
  variant?: 'ai' | 'ux' | 'dual';
  /** Intensity — controls how many times the glitch cycles. 1 = subtle, 3 = aggressive. Default: 1 */
  intensity?: 1 | 2 | 3;
  /** Render as a different HTML element (default: span) */
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'div';
}

export default function GlitchText({
  children,
  trigger = 'hover',
  className = '',
  variant = 'dual',
  intensity = 1,
  as = 'span',
}: GlitchTextProps) {
  const [isGlitching, setIsGlitching] = useState(trigger === 'loop');
  const hasTriggered = useRef(false);
  const prefersReducedMotion = useReducedMotion();

  const handleHoverStart = useCallback(() => {
    if (trigger === 'hover') setIsGlitching(true);
  }, [trigger]);

  const handleHoverEnd = useCallback(() => {
    if (trigger === 'hover') setIsGlitching(false);
  }, [trigger]);

  const glitchColors = {
    ai: { layer1: '#C044FF', layer2: '#C044FF' },
    ux: { layer1: '#FF2D9E', layer2: '#FF2D9E' },
    dual: { layer1: '#C044FF', layer2: '#FF2D9E' },
  };

  const colors = glitchColors[variant];
  const duration = 0.3 / intensity;
  const iterations = intensity;

  // If user prefers reduced motion, just render plain text
  if (prefersReducedMotion) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }

  const MotionComponent = motion.create(as);

  return (
    <MotionComponent
      className={`relative inline-block ${className}`}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      {...(trigger === 'viewport'
        ? {
            whileInView: { opacity: 1 },
            viewport: { once: true, amount: 0.5 },
            onViewportEnter: () => {
              if (hasTriggered.current) return;
              hasTriggered.current = true;
              setIsGlitching(true);
              setTimeout(() => setIsGlitching(false), duration * iterations * 1000 + 200);
            },
          }
        : {})}
    >
      {/* Base text */}
      <span className="relative z-10">{children}</span>

      {/* Glitch layer 1 — offset left, colored */}
      {isGlitching && (
        <span
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            color: colors.layer1,
            animation: `glitch-1 ${duration}s ease-in-out ${iterations}`,
            animationFillMode: 'none',
          }}
          aria-hidden="true"
        >
          {children}
        </span>
      )}

      {/* Glitch layer 2 — offset right, colored */}
      {isGlitching && (
        <span
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            color: colors.layer2,
            animation: `glitch-2 ${duration}s ease-in-out 0.05s ${iterations}`,
            animationFillMode: 'none',
          }}
          aria-hidden="true"
        >
          {children}
        </span>
      )}
    </MotionComponent>
  );
}
