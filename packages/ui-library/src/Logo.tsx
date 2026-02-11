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
    container: "w-12 h-12 p-0 rounded-xl",
    prefixSize: "small",
    suffixSize: "small",
  },
  md: {
    container: "w-16 h-16 p-1 rounded-xl",
    prefixSize: "large",
    suffixSize: "large",
  },
  lg: {
    container: "w-22 h-22 p-2 rounded-xl",
    prefixSize: "x-large",
    suffixSize: "x-large",
  },
};

export function Logo({
  size = "md",
  className = "",
  prefix = "UXic",
  suffix = "AI",
}: LogoProps) {
  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        className={`bg-surface-light font-sans font-black leading-normal flex items-center justify-center 
                shadow-[0px_0px_5px_rgba(200,220,255,1)]
                text-shadow-[2px_2px_6px_rgba(0,0,0,1)] ${classes.container}`}
      >
        <div className="flex flex-col items-center">
          <div
            className="text-primary font-black"
            style={{ fontSize: classes.prefixSize }}
          >
            {prefix}
          </div>
          <div
            className="text-brand-web4-purple font-black tracking-widest"
            style={{ fontSize: classes.suffixSize }}
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
