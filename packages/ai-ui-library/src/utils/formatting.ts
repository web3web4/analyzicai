/**
 * Utility functions for formatting and theming
 */

export type ThemeVariant = "uxic" | "solidic";

/**
 * Format date as locale date string
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString();
}

/**
 * Format time as locale time string
 */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString();
}

/**
 * Format full date and time
 */
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString();
}

/**
 * Get theme-specific color class for score
 */
export function getScoreColor(
  score: number | null | undefined,
  variant: ThemeVariant,
): string {
  if (score === null || score === undefined) {
    return variant === "uxic" ? "text-muted" : "text-gray-500";
  }

  if (variant === "uxic") {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-error";
  } else {
    // solidic
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  }
}

/**
 * Get theme-specific color classes for status
 */
export function getStatusColor(
  status: string,
  variant: ThemeVariant,
): { bg: string; text: string; border?: string } {
  if (variant === "uxic") {
    switch (status) {
      case "completed":
        return { bg: "bg-success/20", text: "text-success" };
      case "failed":
        return { bg: "bg-error/20", text: "text-error" };
      case "partial":
        return { bg: "bg-warning/20", text: "text-warning" };
      default:
        return { bg: "bg-warning/20", text: "text-warning" };
    }
  } else {
    // solidic
    switch (status) {
      case "completed":
        return { bg: "bg-green-500/20", text: "text-green-400" };
      case "failed":
        return { bg: "bg-red-500/20", text: "text-red-400" };
      case "partial":
        return { bg: "bg-yellow-500/20", text: "text-yellow-400" };
      default:
        return { bg: "bg-yellow-500/20", text: "text-yellow-400" };
    }
  }
}
export const designAccentOptions = {
  cyan: {
    border: "border-cyan-500/50 bg-cyan-500/10",
    accent: "accent-cyan-500",
    bg: "bg-cyan-500/10 border-cyan-500/20",
    text: "text-cyan-400",
    focus: "focus:border-cyan-500/50 focus:ring-cyan-500/50",
  },
  purple: {
    border: "border-purple-500/50 bg-purple-500/10",
    accent: "accent-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    text: "text-purple-400",
    focus: "focus:border-purple-500/50 focus:ring-purple-500/50",
  },
} as const;
