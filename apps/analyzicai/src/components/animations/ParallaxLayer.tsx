'use client';

import { type ReactNode, useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;
  direction?: 'vertical' | 'horizontal';
  zDepth?: number;
  className?: string;
  scaleRange?: [number, number];
  opacityRange?: [number, number];
  rotateRange?: [number, number];
}

export default function ParallaxLayer({
  children,
  speed = 0.5,
  direction = 'vertical',
  zDepth = 0,
  className = '',
  scaleRange,
  opacityRange,
  rotateRange,
}: ParallaxLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const yRange = speed * 200;
  const xRange = speed * 200;

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'vertical' ? [yRange, -yRange] : [0, 0]
  );

  const x = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'horizontal' ? [xRange, -xRange] : [0, 0]
  );

  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    scaleRange ?? [1, 1]
  );

  const opacity = useTransform(
    scrollYProgress,
    [0, 1],
    opacityRange ?? [1, 1]
  );

  const rotate = useTransform(
    scrollYProgress,
    [0, 1],
    rotateRange ?? [0, 0]
  );

  if (prefersReducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className} style={{ perspective: zDepth > 0 ? 1200 : undefined }}>
      <motion.div
        style={{
          y,
          x,
          scale,
          opacity,
          rotate,
          translateZ: zDepth,
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/**
 * Parallax container that provides a CSS perspective context.
 * Wrap multiple ParallaxLayer children to get depth separation.
 */
interface ParallaxSceneProps {
  children: ReactNode;
  /** Perspective value in px (default: 1200) */
  perspective?: number;
  className?: string;
}

export function ParallaxScene({
  children,
  perspective = 1200,
  className = '',
}: ParallaxSceneProps) {
  return (
    <div
      className={className}
      style={{
        perspective: `${perspective}px`,
        perspectiveOrigin: '50% 50%',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  );
}
