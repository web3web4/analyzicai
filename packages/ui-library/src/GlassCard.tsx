import React from "react";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`glass-card rounded-2xl border border-white/10 bg-white/5 p-8 ${className}`}
    >
      {children}
    </div>
  );
}