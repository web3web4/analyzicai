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
  // Deprecated props kept for compatibility
  prefixSize?: string;
  suffixSize?: string;
}

const sizeClasses = {
  sm: {
    icon: 32,
    text: "text-xl",
    gap: "gap-2",
  },
  md: {
    icon: 48,
    text: "text-2xl",
    gap: "gap-3",
  },
  lg: {
    icon: 64,
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
}: LogoProps) {
  const classes = sizeClasses[containerSize];
  const variant = prefix.toLowerCase().replace("ic", "ic").replace("analyzic", "analyzic"); // "solidic", "uxic", "analyzic"
  
  const isSolidic = prefix === "Solidic";
  const isAnalyzic = prefix === "Analyzic";
  const isUXic = prefix === "UXic";

  const prefixColor = isSolidic ? "text-ai" : isAnalyzic ? "text-white" : "text-ux";

  return (
    <div className={`flex items-center ${classes.gap} ${className}`}>

      {isAnalyzic && (
        <svg width={classes.icon} height={classes.icon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <rect width="64" height="64" rx="4" fill="#0F0F18"/>
          <path d="M 14 48 L 32 14 L 50 48" stroke="#FFFFFF" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 32 24 C 32 33 41 38 46 38 C 41 38 32 43 32 52 C 32 43 23 38 18 38 C 23 38 32 33 32 24 Z" fill="#C044FF" />
        </svg>
      )}

      {isSolidic && (
        <svg width={classes.icon} height={classes.icon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <rect width="64" height="64" rx="4" fill="#0F0F18"/>
          <path d="M 26 14 L 19 14 C 13 14 13 18 13 22 L 13 28 C 13 32 10 32 10 32 C 13 32 13 32 13 36 L 13 42 C 13 46 13 50 19 50 L 26 50" stroke="#00FFD1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 38 14 L 45 14 C 51 14 51 18 51 22 L 51 28 C 51 32 54 32 54 32 C 51 32 51 32 51 36 L 51 42 C 51 46 51 50 45 50 L 38 50" stroke="#00FFD1" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 32 16 C 32 26 42 32 48 32 C 42 32 32 38 32 48 C 32 38 22 32 16 32 C 22 32 32 26 32 16 Z" fill="#C044FF" />
        </svg>
      )}

      {isUXic && (
        <svg width={classes.icon} height={classes.icon} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
          <rect width="64" height="64" rx="4" fill="#0F0F18"/>
          <path d="M 24 14 L 14 14 L 14 24 M 40 14 L 50 14 L 50 24 M 24 50 L 14 50 L 14 40 M 40 50 L 50 50 L 50 40" stroke="#FF2D9E" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 32 16 C 32 26 42 32 48 32 C 42 32 32 38 32 48 C 32 38 22 32 16 32 C 22 32 32 26 32 16 Z" fill="#C044FF" />
        </svg>
      )}

      {showText && (
        <div className={`font-sans font-black tracking-tight flex items-center ${classes.text}`}>
          <span className={prefixColor}>{prefix}</span>
          <span className="text-[#C044FF]">{suffix}</span>
        </div>
      )}
    </div>
  );
}
