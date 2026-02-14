import React from "react";
import { getScoreColor, type ThemeVariant } from "./utils/formatting";

export interface ScoreBadgeProps {
  score: number | null | undefined;
  variant?: ThemeVariant;
  size?: "sm" | "lg";
  showLabel?: boolean;
  status?: string;
  className?: string;
}

export function ScoreBadge({
  score,
  variant = "uxic",
  size = "sm",
  showLabel = true,
  status,
  className = "",
}: ScoreBadgeProps) {
  const scoreColor = getScoreColor(score, variant);
  const baseClasses =
    variant === "uxic"
      ? "rounded-xl bg-surface-light flex flex-col items-center justify-center shrink-0"
      : "rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5";

  const sizeClasses = size === "lg" ? "w-20 h-20" : "w-16 h-16";
  const textSize = size === "lg" ? "text-4xl" : "text-2xl";

  return (
    <div className={`${baseClasses} ${sizeClasses} ${className}`}>
      {score !== null && score !== undefined && status === "completed" ? (
        <>
          <span className={`${textSize} font-bold ${scoreColor}`}>{score}</span>
          {showLabel && (
            <span
              className={
                variant === "uxic"
                  ? "text-xs text-muted"
                  : "text-xs text-gray-500"
              }
            >
              /100
            </span>
          )}
        </>
      ) : (
        <span
          className={
            variant === "uxic"
              ? "text-muted text-sm capitalize"
              : "text-gray-500"
          }
        >
          {status || "..."}
        </span>
      )}
    </div>
  );
}
