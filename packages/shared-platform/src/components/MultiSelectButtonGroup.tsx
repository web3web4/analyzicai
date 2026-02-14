"use client";

import React from "react";

interface MultiSelectButtonGroupProps<T extends string> {
  label: string;
  options: { id: T; label: string }[];
  selectedValues: T[];
  onToggle: (value: T) => void;
  onSetAll?: (values: T[]) => void; // Batch setter for Select All/Clear All
}

export function MultiSelectButtonGroup<T extends string>({
  label,
  options,
  selectedValues,
  onToggle,
  onSetAll,
}: MultiSelectButtonGroupProps<T>) {
  const hasSelection = selectedValues.length > 0;

  const handleToggleAll = () => {
    if (onSetAll) {
      // Use batch setter if provided
      if (hasSelection) {
        onSetAll([]); // Clear all
      } else {
        onSetAll(options.map((o) => o.id)); // Select all
      }
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {/* All button - visually distinct */}
        {onSetAll && (
          <>
            <button
              type="button"
              onClick={handleToggleAll}
              className="px-4 py-2 w-24 rounded-lg border border-dashed border-border hover:border-primary/50 transition-colors text-sm text-muted hover:text-foreground"
            >
              {hasSelection ? "✕ Clear" : "✓ All"}
            </button>
            <div className="flex items-center">
              <div className="h-8 w-px bg-border" />
            </div>
          </>
        )}
        {/* Regular option buttons */}
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onToggle(option.id)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              selectedValues.includes(option.id)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
