'use client';

import { type ReactNode } from 'react';
import {
  motion,
  type Variant,
  useReducedMotion,
} from 'framer-motion';
import { useIsScrollDriven } from './ScrollDrivenContext';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  threshold?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'span' | 'li' | 'header' | 'footer';
  once?: boolean;
}

const directionOffset: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 40 },
  down: { x: 0, y: -40 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
};

export default function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  threshold = 0.15,
  className = '',
  as = 'div',
  once = true,
}: ScrollRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const isScrollDriven = useIsScrollDriven();

  if (isScrollDriven || prefersReducedMotion) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  const offset = directionOffset[direction];

  const hidden: Variant = {
    opacity: 0,
    x: offset.x,
    y: offset.y,
    filter: 'blur(4px)',
  };

  const visible: Variant = {
    opacity: 1,
    x: 0,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration,
      delay,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  };

  const MotionComponent = motion.create(as);

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      variants={{ hidden, visible }}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </MotionComponent>
  );
}


interface StaggerContainerProps {
  children: ReactNode;
  stagger?: number;
  className?: string;
  as?: 'div' | 'section' | 'ul' | 'ol';
  threshold?: number;
  once?: boolean;
}

export function StaggerContainer({
  children,
  stagger = 0.1,
  className = '',
  as = 'div',
  threshold = 0.1,
  once = true,
}: StaggerContainerProps) {
  const isScrollDriven = useIsScrollDriven();

  // In scroll-driven mode, render plain container
  if (isScrollDriven) {
    const Component = as;
    return <Component className={className}>{children}</Component>;
  }

  const MotionComponent = motion.create(as);

  return (
    <MotionComponent
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: stagger,
          },
        },
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  direction?: Direction;
}

export function StaggerItem({
  children,
  className = '',
  direction = 'up',
}: StaggerItemProps) {
  const prefersReducedMotion = useReducedMotion();
  const isScrollDriven = useIsScrollDriven();
  const offset = directionOffset[direction];

  // In scroll-driven mode, render plain div
  if (isScrollDriven || prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, x: offset.x, y: offset.y, filter: 'blur(4px)' },
        visible: {
          opacity: 1,
          x: 0,
          y: 0,
          filter: 'blur(0px)',
          transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] },
        },
      }}
      className={className}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}
