import { size } from "zod/v4";

export interface LogoProps {
  /** Size variant - affects both icon and text size */
  containerSize?: "sm" | "md" | "lg";
  /** Optional className for custom styling */
  className?: string;
  /** The prefix text (e.g. "UXic" or "Solidic"). Default: "UXic" */
  prefix?: string;
  /** The suffix text. Default: "AI" */
  suffix?: string;
  /** Whether to show the text next to the logo. Default: true */
  showText?: boolean;
  /** Optional subtitle shown below the logo text in smaller white text */
  subtitle?: string;
  // Deprecated props kept for compatibility
  prefixSize?: string;
  suffixSize?: string;
}

const sizeClasses = {
  sm: {
    icon: 48,
    text: "text-xl",
    gap: "gap-2",
    textSize: "text-sm",
  },
  md: {
    icon: 64,
    text: "text-xl",
    gap: "gap-3",
    textSize: "text-base",
  },
  lg: {
    icon: 96,
    text: "text-4xl",
    gap: "gap-4",
  },
};

export function Logo({
  containerSize = "md",
  className = "",
  prefix = "UXic",
  suffix = "AI",
  showText = true,
  subtitle,
}: LogoProps) {
  const classes = sizeClasses[containerSize];
  const isSolidic = prefix === "Solidic";
  const isAnalyzic = prefix === "Analyzic";
  const isUXic = prefix === "UXic";

  subtitle = subtitle ? subtitle : (showText && isAnalyzic ? "By Web3Web4.com" : "AnalyzicAI Tool");

  const prefixStyle = isAnalyzic
      ? { color: "var(--brand-white)" }
      : { color: "var(--primary)" };

  const suffixStyle = isAnalyzic
      ? { color: "var(--primary)" }
      : { color: "var(--brand-white)" };

  return (
    <div className={`flex items-center ${classes.gap} ${className}`}>

      {isAnalyzic && (
        <svg width={classes.icon} height={classes.icon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <rect width="64" height="64" rx="4" fill="transparent"/>
          <path d="M 8 56 L 32 8 L 56 56" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 32 26 C 32 35 43 40 50 40 C 43 40 32 45 32 54 C 32 45 21 40 14 40 C 21 40 32 35 32 26 Z" fill="#C044FF" />
        </svg>
      )}

      {isSolidic && (
        <svg width={classes.icon} height={classes.icon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <rect width="64" height="64" rx="4" fill="transparent"/>
          <path d="M 24 10 L 18 10 C 9 10 9 13 9 20 L 9 28 C 9 32 6 32 6 32 C 9 32 9 32 9 36 L 9 44 C 9 51 9 54 18 54 L 24 54" stroke="#00FFD1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 40 10 L 46 10 C 55 10 55 13 55 20 L 55 28 C 55 32 58 32 58 32 C 55 32 55 32 55 36 L 55 44 C 55 51 55 54 46 54 L 40 54" stroke="#00FFD1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 32 14 C 32 24 44 32 50 32 C 44 32 32 40 32 50 C 32 40 20 32 14 32 C 20 32 32 24 32 14 Z" fill="#C044FF" />

          {/* Alternative version for paths with more height. Kept in codebase for reference and potential future use */}
          {/* 
            <path d="M 28 8 L 18 8 C 9 8 9 13 9 20 L 9 28 C 9 32 6 32 6 32 C 9 32 9 32 9 36 L 9 44 C 9 51 9 56 18 56 L 28 56" stroke="#00FFD1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 36 8 L 46 8 C 55 8 55 13 55 20 L 55 28 C 55 32 58 32 58 32 C 55 32 55 32 55 36 L 55 44 C 55 51 55 56 46 56 L 36 56" stroke="#00FFD1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 32 14 C 32 24 44 32 50 32 C 44 32 32 40 32 50 C 32 40 20 32 14 32 C 20 32 32 24 32 14 Z" fill="#C044FF" /> 
           */}

        </svg>
      )}


      {isUXic && (
        <svg width={classes.icon} height={classes.icon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <rect width="64" height="64" rx="4" fill="transparent"/>
          <path d="M 22 8 L 8 8 L 8 22 M 42 8 L 56 8 L 56 22 M 22 56 L 8 56 L 8 42 M 42 56 L 56 56 L 56 42" stroke="#FF2D9E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 32 14 C 32 24 44 32 50 32 C 44 32 32 40 32 50 C 32 40 20 32 14 32 C 20 32 32 24 32 14 Z" fill="#C044FF" />
        </svg>
      )}

      {showText && (
        <div>
          <div className={`font-sans font-black tracking-tight flex items-center ${classes.text}`}>
            <span style={prefixStyle}>{prefix}</span>
            <span style={suffixStyle}>{suffix}</span>
          </div>
          {subtitle && (
            <div className="text-xs font-medium tracking-wide" style={{ color: isAnalyzic ? "var(--brand-white)" : "var(--brand-web4-purple-light)" }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
