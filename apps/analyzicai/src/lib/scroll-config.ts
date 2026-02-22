/**
 * Scroll-driven section configuration.
 *
 * The landing page uses a single tall scroll runway (SCROLL_HEIGHT_VH).
 * A sticky viewport locks content to the screen. As the user scrolls,
 * scrollYProgress (0→1) controls which section is visible via cross-fade.
 */

export const SCROLL_HEIGHT_VH = 350;

export const SECTION_RANGES = {
  intro:      { fadeIn: 0.00, visStart: 0.00, visEnd: 0.04, fadeOut: 0.08 },
  hero:       { fadeIn: 0.06, visStart: 0.10, visEnd: 0.18, fadeOut: 0.22 },
  apps:       { fadeIn: 0.20, visStart: 0.24, visEnd: 0.36, fadeOut: 0.40 },
  features:   { fadeIn: 0.38, visStart: 0.42, visEnd: 0.54, fadeOut: 0.58 },
  howitworks: { fadeIn: 0.56, visStart: 0.60, visEnd: 0.72, fadeOut: 0.76 },
  cta:        { fadeIn: 0.74, visStart: 0.78, visEnd: 0.93, fadeOut: 0.98 },
} as const;

/** Maps anchor hash → scroll progress for programmatic navigation */
export const NAV_SCROLL_TARGETS: Record<string, number> = {
  '#hero': (SECTION_RANGES.hero.visStart + SECTION_RANGES.hero.visEnd) / 2,
  '#apps': SECTION_RANGES.apps.visStart,
  '#features': SECTION_RANGES.features.visStart,
  '#how-it-works': SECTION_RANGES.howitworks.visStart,
  '#cta': SECTION_RANGES.cta.visStart,
};

/**
 * Smoothly scroll to a section by its hash ID.
 * On desktop, calculates the exact scroll position within the runway.
 * Falls back to native scroll for mobile / non-driven layouts.
 */
export function scrollToSection(hash: string) {
  const progress = NAV_SCROLL_TARGETS[hash];
  if (progress === undefined) return;

  const runway = document.querySelector('[data-scroll-runway]') as HTMLElement;
  if (!runway) {
    // Mobile fallback — normal hash scroll
    const el = document.querySelector(hash);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const scrollableDistance = runway.clientHeight - window.innerHeight;
  window.scrollTo({
    top: runway.offsetTop + progress * scrollableDistance,
    behavior: 'smooth',
  });
}
