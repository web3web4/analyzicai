import React from "react";
import { getStatusColor, type ThemeVariant } from "./utils/formatting";

export interface StatusBadgeProps {
  status: string;
  variant?: ThemeVariant;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({
  status,
  variant = "uxic",
  size = "md",
  className = "",
}: StatusBadgeProps) {
  const colors = getStatusColor(status, variant);

  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-2 py-0.5 rounded-full text-xs";

  const variantClasses =
    variant === "solidic" ? "text-[10px] font-bold uppercase" : "capitalize";

  return (
    <span
      className={`${sizeClasses} ${variantClasses} ${colors.bg} ${colors.text} rounded-full ${className}`}
    >
      {status}
    </span>
  );
}
