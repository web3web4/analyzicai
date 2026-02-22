'use client';

import { createContext, useContext } from 'react';

/**
 * When true, sections are inside a scroll-driven sticky layout
 * (desktop terrain fly-through). In this mode, whileInView-based
 * animations should be skipped because all sections live in the
 * same viewport simultaneously.
 */
const ScrollDrivenContext = createContext(false);

export const ScrollDrivenProvider = ScrollDrivenContext.Provider;

export function useIsScrollDriven() {
  return useContext(ScrollDrivenContext);
}
