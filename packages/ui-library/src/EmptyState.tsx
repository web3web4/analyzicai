import React from "react";
import type { ThemeVariant } from "./utils/formatting";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  variant?: ThemeVariant;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  variant = "uxic",
  className = "",
}: EmptyStateProps) {
  const containerClasses =
    variant === "uxic"
      ? "glass-card rounded-2xl p-12 text-center"
      : "rounded-2xl bg-white/5 border border-white/10 p-12 text-center";

  const iconContainerClasses =
    variant === "uxic"
      ? "w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4"
      : "w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4";

  const titleClasses =
    variant === "uxic"
      ? "text-lg font-medium mb-2"
      : "text-lg font-medium mb-2 text-white";

  const descriptionClasses =
    variant === "uxic" ? "text-muted mb-6" : "text-gray-500 mb-6";

  const buttonClasses =
    variant === "uxic"
      ? "btn-primary px-6 py-3 rounded-full text-white font-medium inline-block"
      : "px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium inline-block hover:opacity-90 transition-opacity";

  return (
    <div className={`${containerClasses} ${className}`}>
      {icon && <div className={iconContainerClasses}>{icon}</div>}
      <h3 className={titleClasses}>{title}</h3>
      <p className={descriptionClasses}>{description}</p>
      {actionLabel && actionHref && (
        <a href={actionHref} className={buttonClasses}>
          {actionLabel}
        </a>
      )}
    </div>
  );
}
