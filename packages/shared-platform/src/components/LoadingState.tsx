import React from "react";
import type { ThemeVariant } from "../utils/formatting";

export interface LoadingStateProps {
  message?: string;
  variant?: ThemeVariant;
  className?: string;
}

export function LoadingState({
  message = "Loading...",
  variant = "uxic",
  className = "",
}: LoadingStateProps) {
  const spinnerClasses =
    variant === "uxic"
      ? "w-5 h-5 border-2 border-warning/30 border-t-warning rounded-full animate-spin"
      : "w-5 h-5 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin";

  const textClasses = variant === "uxic" ? "text-warning" : "text-cyan-400";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={spinnerClasses} />
      <p className={textClasses}>{message}</p>
    </div>
  );
}
