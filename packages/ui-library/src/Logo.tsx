export interface LogoProps {
  /** Size variant - affects both icon and text size */
  size?: "sm" | "md" | "lg";
  /** Optional className for custom styling */
  className?: string;
  /** The prefix text (e.g. "UXic" or "Solidic"). Default: "UXic" */
  prefix?: string;
  /** The suffix text. Default: "AI" */
  suffix?: string;
}

const sizeClasses = {
  sm: {
    container: "w-8 h-8 rounded-lg",
    letter: "text-sm",
    text: "text-base",
  },
  md: {
    container: "w-10 h-10 rounded-xl",
    letter: "text-lg",
    text: "text-xl",
  },
  lg: {
    container: "w-12 h-12 rounded-xl",
    letter: "text-xl",
    text: "text-2xl",
  },
};

export function Logo({
  size = "sm",
  className = "",
  prefix = "UXic",
  suffix = "AI",
}: LogoProps) {
  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        className={`rounded-xl bg-surface-light font-extrabold flex items-center justify-center 
                shadow-[0px_0px_5px_rgba(200,220,255,1)]
                text-shadow-[2px_2px_6px_rgba(0,0,0,1)] ${
                  size === "lg"
                    ? "w-16 h-16 p-2"
                    : size === "md"
                      ? "w-13 h-13 p-1"
                      : "w-12 h-12 p-1"
                }`}
      >
        <div className="flex flex-col items-center leading-none">
          <div
            className="text-primary uppercase tracking-tighter"
            style={{ fontSize: size === "lg" ? "1.2rem" : "0.9rem" }}
          >
            {prefix}
          </div>
          <div
            className="text-brand-web4-purple uppercase tracking-widest"
            style={{ fontSize: size === "lg" ? "1rem" : "0.7rem" }}
          >
            {suffix}
          </div>
        </div>
      </div>
      <div className="text-[10px] tracking-widest text-muted font-bold">
        Web3Web4
      </div>
    </div>
  );
}
