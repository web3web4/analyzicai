// Category display names
export const CATEGORY_LABELS: Record<string, string> = {
  colorContrast: "Color Contrast",
  typography: "Typography",
  layoutComposition: "Layout & Composition",
  navigation: "Navigation",
  accessibility: "Accessibility",
  visualHierarchy: "Visual Hierarchy",
  whitespace: "Whitespace",
  consistency: "Consistency",
};

// Severity order for sorting
export const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const;

// Severity styles configuration
export const SEVERITY_STYLES = {
  critical: {
    container: "border-error bg-error/10",
    badge: "bg-error/20 text-error",
    label: "Critical",
  },
  high: {
    container: "border-warning bg-warning/10",
    badge: "bg-warning/20 text-warning",
    label: "High",
  },
  medium: {
    container: "border-accent bg-accent/10",
    badge: "bg-accent/20 text-accent",
    label: "Medium",
  },
  low: {
    container: "border-muted bg-surface-light",
    badge: "bg-muted/20 text-muted",
    label: "Low",
  },
} as const;

// Agreement level styles
export const AGREEMENT_STYLES = {
  high: {
    bg: "bg-success/20",
    text: "text-success",
    label: "High Agreement",
    description: "All providers strongly agree",
  },
  medium: {
    bg: "bg-warning/20",
    text: "text-warning",
    label: "Medium Agreement",
    description: "Some differences between providers",
  },
  low: {
    bg: "bg-error/20",
    text: "text-error",
    label: "Low Agreement",
    description: "Significant disagreement between providers",
  },
} as const;

// Score thresholds
export const SCORE_THRESHOLDS = {
  excellent: 80,
  good: 60,
  poor: 0,
} as const;
