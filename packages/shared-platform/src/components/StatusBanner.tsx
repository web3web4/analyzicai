import React from "react";
import type { ThemeVariant } from "../utils/formatting";

export interface StatusBannerProps {
  type: "warning" | "error" | "info";
  title?: string;
  message: string | React.ReactNode;
  icon?: React.ReactNode;
  variant?: ThemeVariant;
  className?: string;
}

export function StatusBanner({
  type,
  title,
  message,
  icon,
  variant = "uxic",
  className = "",
}: StatusBannerProps) {
  const getColorClasses = () => {
    if (variant === "uxic") {
      switch (type) {
        case "error":
          return "bg-error/10 border-error/20";
        case "warning":
          return "bg-warning/10 border-warning/20";
        case "info":
          return "bg-primary/10 border-primary/20";
      }
    } else {
      // solidic
      switch (type) {
        case "error":
          return "bg-red-500/10 border-red-500/20";
        case "warning":
          return "bg-yellow-500/10 border-yellow-500/20";
        case "info":
          return "bg-cyan-500/10 border-cyan-500/20";
      }
    }
  };

  const getTextColor = () => {
    if (variant === "uxic") {
      switch (type) {
        case "error":
          return "text-error";
        case "warning":
          return "text-warning";
        case "info":
          return "text-primary";
      }
    } else {
      switch (type) {
        case "error":
          return "text-red-400";
        case "warning":
          return "text-yellow-400";
        case "info":
          return "text-cyan-400";
      }
    }
  };

  return (
    <div
      className={`px-6 py-4 rounded-xl border ${getColorClasses()} ${className}`}
    >
      {title && icon ? (
        <div>
          <div className="flex items-center gap-3 mb-2">
            {icon}
            <p className={`${getTextColor()} font-medium`}>{title}</p>
          </div>
          <div
            className={
              variant === "uxic"
                ? "text-sm text-muted"
                : "text-sm text-fg-tertiary"
            }
          >
            {message}
          </div>
        </div>
      ) : (
        <p className={getTextColor()}>{message}</p>
      )}
    </div>
  );
}
