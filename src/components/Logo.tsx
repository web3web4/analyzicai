import React from "react";

interface LogoProps {
  /** Size variant - affects both icon and text size */
  size?: "sm" | "md" | "lg";
  /** Optional className for custom styling */
  className?: string;
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

export function Logo({ size = "sm", className = "" }: LogoProps) {
  const classes = sizeClasses[size];

  return (
    <div
      className="w-13 h-13 rounded-xl bg-surface-light font-extrabold flex flex-col items-center justify-center 
              shadow-[0px_0px_5px_rgba(200,220,255,1)]
              text-shadow-[2px_2px_6px_rgba(0,0,0,1)]"
    >
      <div className="text-primary">UXic</div>
      <div className="text-brand-web4-purple">AI</div>
    </div>
  );
}
