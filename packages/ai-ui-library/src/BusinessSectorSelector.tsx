"use client";

import React, { useState } from "react";

const COMMON_SECTORS = [
  "E-commerce",
  "Fintech",
  "Healthcare",
  "Education",
  "SaaS",
  "AI/ML",
  "Social Media",
  "Gaming",
  "Real Estate",
  "Travel",
  "Food & Beverage",
  "Fashion",
];

interface BusinessSectorSelectorProps {
  selectedSectors: string[];
  onAdd: (sector: string) => void;
  onRemove: (sector: string) => void;
}

export function BusinessSectorSelector({
  selectedSectors,
  onAdd,
  onRemove,
}: BusinessSectorSelectorProps) {
  const [customInput, setCustomInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && customInput.trim()) {
      e.preventDefault();
      if (!selectedSectors.includes(customInput.trim())) {
        onAdd(customInput.trim());
      }
      setCustomInput("");
    }
  };

  const toggleSector = (sector: string) => {
    if (selectedSectors.includes(sector)) {
      onRemove(sector);
    } else {
      onAdd(sector);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">
        Business Sector/Industry
      </label>

      {/* Common sectors */}
      <div className="flex flex-wrap gap-2 mb-3">
        {COMMON_SECTORS.map((sector) => (
          <button
            key={sector}
            type="button"
            onClick={() => toggleSector(sector)}
            className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
              selectedSectors.includes(sector)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border hover:border-primary/50"
            }`}
          >
            {sector}
          </button>
        ))}
      </div>

      {/* Custom input */}
      <input
        type="text"
        value={customInput}
        onChange={(e) => setCustomInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Or type custom sector and press Enter..."
        className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition-colors text-sm"
      />

      {/* Selected sectors */}
      {selectedSectors.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {selectedSectors.map((sector) => (
            <span
              key={sector}
              className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2"
            >
              {sector}
              <button
                type="button"
                onClick={() => onRemove(sector)}
                className="hover:text-error transition-colors"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
