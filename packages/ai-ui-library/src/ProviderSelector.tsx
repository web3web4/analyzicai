import React from "react";
import { Star } from "lucide-react";
import { designAccentOptions } from "./utils/formatting";

export interface Provider {
  id: string;
  name: string;
  description: string;
}

interface TierOption {
  value: string;
  label: string;
  description?: string;
  tierLabel?: string;
  modelName?: string;
  quality?: string;
}

interface ProviderSelectorProps {
  providers: Provider[];
  selectedProviders: string[];
  masterProvider: string;
  masterModelTier?: string;
  providerModelTiers?: Record<string, string>;
  onToggleProvider: (providerId: string) => void;
  onMasterChange: (providerId: string) => void;
  onMasterModelTierChange?: (tier: string) => void;
  onModelTierChange?: (providerId: string, tier: string) => void;
  getModelTierOptions?: (providerId: string) => TierOption[];
  accentColor?: "cyan" | "purple" | "primary";
}

function parseTierOption(option: TierOption) {
  if (option.tierLabel && option.modelName && option.quality) {
    return { tierLabel: option.tierLabel, modelName: option.modelName, quality: option.quality };
  }
  // Fallback: parse from label format "Tier 1: modelName (quality)"
  const match = option.label.match(/^(Tier \d+): (.+?) \(([^)]+)\)$/);
  if (match) {
    const q = match[3];
    return {
      tierLabel: match[1],
      modelName: match[2],
      quality: q.charAt(0).toUpperCase() + q.slice(1),
    };
  }
  return { tierLabel: option.value, modelName: option.label, quality: "" };
}

export function ProviderSelector({
  providers,
  selectedProviders,
  masterProvider,
  masterModelTier,
  providerModelTiers,
  onToggleProvider,
  onMasterChange,
  onMasterModelTierChange,
  onModelTierChange,
  getModelTierOptions,
  accentColor = "cyan",
}: ProviderSelectorProps) {
  const accentClasses = designAccentOptions[accentColor] ?? designAccentOptions.cyan;

  return (
    <div className="space-y-6">
      {/* 3a — Provider selection grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((provider) => {
          const isSelected = selectedProviders.includes(provider.id);
          const tierOptions = getModelTierOptions ? getModelTierOptions(provider.id) : [];
          return (
            <div
              key={provider.id}
              onClick={() => onToggleProvider(provider.id)}
              className={`relative p-4 rounded-xl border transition-colors cursor-pointer ${
                isSelected ? accentClasses.border : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Checkbox top-right */}
              <div className="absolute top-3 right-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleProvider(provider.id)}
                  onClick={(e) => e.stopPropagation()}
                  className={`w-5 h-5 rounded cursor-pointer ${accentClasses.accent}`}
                />
              </div>

              {/* Provider info */}
              <div className="pr-4">
                <p className="font-medium text-white">{provider.name}</p>
                <p className="text-sm text-fg-tertiary mt-1">{provider.description}</p>
              </div>

              {/* Model tier radio rows */}
              {isSelected && providerModelTiers && onModelTierChange && tierOptions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
                  <p className="text-xs text-fg-tertiary mb-2">Analysis model</p>
                  {tierOptions.map((option) => {
                    const isActive = providerModelTiers[provider.id] === option.value;
                    const { tierLabel, modelName, quality } = parseTierOption(option);
                    return (
                      <label
                        key={option.value}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                          isActive ? accentClasses.bg : "hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`tier-${provider.id}`}
                          value={option.value}
                          checked={isActive}
                          onChange={() => onModelTierChange(provider.id, option.value)}
                          className={`mt-0.5 shrink-0 ${accentClasses.accent}`}
                        />
                        <div className="min-w-0">
                          <p className={`text-xs font-medium leading-tight ${
                            isActive ? accentClasses.text : "text-fg-secondary"
                          }`}>
                            {tierLabel} · {quality}
                          </p>
                          <p className="text-xs text-fg-tertiary truncate leading-tight mt-0.5">
                            {modelName}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3b — Master synthesizer selection */}
      <div className="border-t border-white/10 pt-5">
        <p className="text-sm font-medium text-fg-secondary mb-1">
          Choose Master Synthesizer
        </p>
        <p className="text-xs text-fg-tertiary mb-4">
          The master provider synthesizes all results into the final report.
        </p>

        {/* Star tiles — expand inline when master */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {providers.map((provider) => {
            const isMaster = masterProvider === provider.id;
            const tierOptions =
              isMaster && masterModelTier !== undefined && onMasterModelTierChange && getModelTierOptions
                ? getModelTierOptions(provider.id)
                : [];
            return (
              <div
                key={provider.id}
                onClick={() => onMasterChange(provider.id)}
                className={`rounded-xl border transition-colors cursor-pointer ${
                  isMaster ? accentClasses.border : "border-white/10 hover:border-white/20"
                }`}
              >
                {/* Star header row */}
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-3 w-full p-3 text-left pointer-events-none"
                >
                  <Star
                    className={`w-5 h-5 shrink-0 transition-colors ${
                      isMaster ? accentClasses.text : "text-fg-tertiary"
                    }`}
                    fill={isMaster ? "currentColor" : "none"}
                  />
                  <span
                    className={`text-sm font-medium ${
                      isMaster ? "text-white" : "text-fg-secondary"
                    }`}
                  >
                    {provider.name}
                  </span>
                </button>

                {/* Synthesis tier options — inline, only for the active master */}
                {tierOptions.length > 0 && (
                  <div className="px-3 pb-3 pt-1 border-t border-white/10 space-y-1">
                    <p className="text-xs text-fg-tertiary mb-1">Synthesis model</p>
                    {tierOptions.map((option) => {
                      const isActive = masterModelTier === option.value;
                      const { tierLabel, modelName, quality } = parseTierOption(option);
                      return (
                        <label
                          key={option.value}
                          onClick={(e) => e.stopPropagation()}
                          className={`flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                            isActive ? accentClasses.bg : "hover:bg-white/5"
                          }`}
                        >
                          <input
                            type="radio"
                            name="master-tier"
                            value={option.value}
                            checked={isActive}
                            onChange={() => onMasterModelTierChange!(option.value)}
                            className={`mt-0.5 shrink-0 ${accentClasses.accent}`}
                          />
                          <div className="min-w-0">
                            <p className={`text-xs font-medium leading-tight ${
                              isActive ? accentClasses.text : "text-fg-secondary"
                            }`}>
                              {tierLabel} · {quality}
                            </p>
                            <p className="text-xs text-fg-tertiary truncate leading-tight mt-0.5">
                              {modelName}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}