import React from "react";
import { LucideIcon } from "lucide-react";

interface InputOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface InputTypeToggleProps {
  options: InputOption[];
  selected: string;
  onSelect: (id: string) => void;
  accentColor?: string;
}

export function InputTypeToggle({
  options,
  selected,
  onSelect,
  accentColor = "cyan",
}: InputTypeToggleProps) {
  const accentClasses = {
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/20",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/20",
  }[accentColor] || "bg-cyan-500/20 text-cyan-400 border-cyan-500/20";

  return (
    <div className="flex bg-black/40 p-1 rounded-xl w-fit mx-auto border border-white/5">
      {options.map((option) => {
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selected === option.id
                ? `${accentClasses} shadow-sm border`
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="h-4 w-4" />
            {option.label}
          </button>
        );
      })}
    </div>
  );
}