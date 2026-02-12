import {
  CATEGORY_LABELS,
  SEVERITY_STYLES,
  SCORE_THRESHOLDS,
} from "./constants";
import type { Recommendation } from "@web3web4/ai-core";

// Round score to integer for display
// AI providers sometimes return decimal scores (e.g., 86.5)
// We store them as decimals but display as integers
export function roundScore(score: number | undefined | null): number {
  if (score === undefined || score === null) return 0;
  return Math.round(score);
}

// Get score-based color (returns CSS variable or Tailwind class)
export function getScoreColorClass(
  score: number,
  type: "text" | "bg" = "text",
): string {
  const roundedScore = roundScore(score);
  if (type === "text") {
    if (roundedScore >= SCORE_THRESHOLDS.excellent) return "text-success";
    if (roundedScore >= SCORE_THRESHOLDS.good) return "text-warning";
    return "text-error";
  }
  // For bg, we return empty string and use getScoreColor for inline styles
  return "";
}

// Get score-based color value (for inline styles)
export function getScoreColor(score: number): string {
  const roundedScore = roundScore(score);
  if (roundedScore >= SCORE_THRESHOLDS.excellent) return "var(--success)";
  if (roundedScore >= SCORE_THRESHOLDS.good) return "var(--warning)";
  return "var(--error)";
}

// Get severity-based styles
export function getSeverityStyles(severity: string) {
  return (
    SEVERITY_STYLES[severity as keyof typeof SEVERITY_STYLES] ||
    SEVERITY_STYLES.low
  );
}

// Format camelCase to Title Case
export function formatCategoryName(key: string): string {
  return CATEGORY_LABELS[key] || key.replace(/([A-Z])/g, " $1").trim();
}

// Group recommendations by a given field
export function groupRecommendations(
  recommendations: Recommendation[],
  by: "category" | "severity",
): Record<string, Recommendation[]> {
  if (!recommendations || recommendations.length === 0) return {};

  return recommendations.reduce(
    (acc, rec) => {
      const key = rec[by];
      if (!acc[key]) acc[key] = [];
      acc[key].push(rec);
      return acc;
    },
    {} as Record<string, Recommendation[]>,
  );
}

// Sort recommendations by severity
export function sortRecommendationsBySeverity(
  recommendations: Recommendation[],
): Recommendation[] {
  if (!recommendations || recommendations.length === 0) return [];

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...recommendations].sort(
    (a, b) =>
      (severityOrder[a.severity as keyof typeof severityOrder] ?? 999) -
      (severityOrder[b.severity as keyof typeof severityOrder] ?? 999),
  );
}

// Calculate consensus score from provider agreement
export function calculateConsensusScore(
  agreement: Array<{ category: string; agreement: "high" | "medium" | "low" }>,
): number {
  if (!agreement || agreement.length === 0) return 0;

  const scoreMap = { high: 100, medium: 60, low: 30 };
  const total = agreement.reduce(
    (sum, item) => sum + scoreMap[item.agreement],
    0,
  );
  return Math.round(total / agreement.length);
}

// Count recommendations by severity
export function countBySeverity(
  recommendations: Recommendation[] | undefined | null,
): Record<string, number> {
  if (!recommendations) return {};
  return recommendations.reduce(
    (acc, rec) => {
      acc[rec.severity] = (acc[rec.severity] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
}

// Format duration in milliseconds to readable string
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}
