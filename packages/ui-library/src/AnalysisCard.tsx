import React from "react";
import Link from "next/link";
import { ScoreBadge } from "./ScoreBadge";
import { StatusBadge } from "./StatusBadge";
import { formatDate, formatTime, type ThemeVariant } from "./utils/formatting";

export interface AnalysisCardProps {
  id: string;
  score: number | null | undefined;
  status: string;
  sourceType: string;
  sourceIcon?: React.ReactNode;
  sourceLabel?: string;
  providers?: string[];
  masterProvider?: string;
  createdAt: string;
  variant?: ThemeVariant;
  href: string;
  className?: string;
}

export function AnalysisCard({
  id,
  score,
  status,
  sourceType,
  sourceIcon,
  sourceLabel,
  providers,
  masterProvider,
  createdAt,
  variant = "uxic",
  href,
  className = "",
}: AnalysisCardProps) {
  const containerClasses =
    variant === "uxic"
      ? "glass-card rounded-xl p-6 flex items-center gap-6 hover:border-primary/50 transition-colors block"
      : "block rounded-xl bg-white/5 border border-white/10 p-6 transition-all hover:bg-white/10 hover:border-cyan-500/30 group";

  const sourceTypeClasses =
    variant === "uxic"
      ? "text-sm text-muted capitalize"
      : "flex items-center gap-1 text-sm font-medium text-cyan-400 capitalize bg-cyan-500/10 px-2 py-0.5 rounded";

  const providersTextClasses =
    variant === "uxic"
      ? "text-muted text-sm"
      : "text-xs text-gray-500 truncate";

  const dateContainerClasses =
    variant === "uxic"
      ? "text-right shrink-0"
      : "text-sm text-gray-500 tabular-nums text-right";

  const dateClasses = variant === "uxic" ? "text-sm" : "";
  const timeClasses =
    variant === "uxic" ? "text-xs text-muted" : "text-xs opacity-50";

  return (
    <Link href={href} className={`${containerClasses} ${className}`}>
      {variant === "uxic" ? (
        <>
          {/* Score */}
          <ScoreBadge score={score} status={status} variant={variant} />

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={status} variant={variant} />
              <span className={sourceTypeClasses}>
                {sourceType.replace("_", " ")}
              </span>
            </div>
            {providers && providers.length > 0 && (
              <p className={providersTextClasses}>
                Providers: {providers.join(", ")}
              </p>
            )}
            {masterProvider && (
              <p className={providersTextClasses}>Master: {masterProvider}</p>
            )}
          </div>

          {/* Date */}
          <div className={dateContainerClasses}>
            <p className={dateClasses}>{formatDate(createdAt)}</p>
            <p className={timeClasses}>{formatTime(createdAt)}</p>
          </div>

          {/* Arrow */}
          <div className="text-muted">→</div>
        </>
      ) : (
        <div className="flex items-center gap-6">
          {/* Score Badge */}
          <ScoreBadge score={score} status={status} variant={variant} />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              {sourceIcon && (
                <span className={sourceTypeClasses}>
                  {sourceIcon}
                  {sourceType}
                </span>
              )}
              <StatusBadge status={status} variant={variant} />
            </div>

            {sourceLabel && (
              <div className="text-sm text-gray-300 font-mono truncate mb-1">
                {sourceLabel}
              </div>
            )}

            {providers && providers.length > 0 && (
              <p className={providersTextClasses}>
                Providers: {providers.join(", ")}
              </p>
            )}
          </div>

          <div className={dateContainerClasses}>
            <div className={dateClasses}>{formatDate(createdAt)}</div>
            <div className={timeClasses}>{formatTime(createdAt)}</div>
          </div>
        </div>
      )}
    </Link>
  );
}
