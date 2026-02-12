import React from "react";
import { designAccentOptions } from "./utils/formatting";

export interface Provider {
  id: string;
  name: string;
  description: string;
}

interface ProviderSelectorProps {
  providers: Provider[];
  selectedProviders: string[];
  masterProvider: string;
  providerModelTiers?: Record<string, string>;
  onToggleProvider: (providerId: string) => void;
  onMasterChange: (providerId: string) => void;
  onModelTierChange?: (providerId: string, tier: string) => void;
  getModelTierOptions?: (providerId: string) => { value: string; label: string }[];
  accentColor?: "cyan" | "purple";
}

export function ProviderSelector({
  providers,
  selectedProviders,
  masterProvider,
  providerModelTiers,
  onToggleProvider,
  onMasterChange,
  onModelTierChange,
  getModelTierOptions,
  accentColor = "cyan" as const,
}: ProviderSelectorProps) {
  const accentClasses = designAccentOptions[accentColor] || designAccentOptions.cyan;

  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <div
          key={provider.id}
          className={`p-4 rounded-xl border transition-colors ${
            selectedProviders.includes(provider.id)
              ? accentClasses.border
              : "border-white/10"
          }`}
        >
          {/* Provider header with checkbox and master radio */}
          <label className="flex items-center gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedProviders.includes(provider.id)}
              onChange={() => onToggleProvider(provider.id)}
              className={`w-5 h-5 rounded ${accentClasses.accent}`}
            />
            <div className="flex-1">
              <p className="font-medium text-white">{provider.name}</p>
              <p className="text-sm text-gray-400">{provider.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Master:</span>
              <input
                type="radio"
                name="master"
                checked={masterProvider === provider.id}
                onChange={() => onMasterChange(provider.id)}
                className={`w-4 h-4 ${accentClasses.accent}`}
              />
            </div>
          </label>

          {/* Model Tier Dropdown */}
          {selectedProviders.includes(provider.id) &&
            providerModelTiers &&
            onModelTierChange &&
            getModelTierOptions && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <label className="block text-xs text-gray-400 mb-2">
                  Model Quality Tier
                </label>
                <select
                  value={providerModelTiers[provider.id]}
                  onChange={(e) =>
                    onModelTierChange(provider.id, e.target.value)
                  }
                  className={`w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-gray-300 focus:outline-none ${accentClasses.focus} transition-colors`}
                >
                  {getModelTierOptions(provider.id).map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
        </div>
      ))}
    </div>
  );
}