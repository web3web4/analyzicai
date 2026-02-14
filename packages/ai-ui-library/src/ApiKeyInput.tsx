import React from "react";
import { AlertCircle } from "lucide-react";
import { designAccentOptions } from "./utils/formatting";


interface ApiKeyInputProps {
  apiKeys: Record<string, string>;
  onApiKeyChange: (provider: string, value: string) => void;
  providers: {
    id: string;
    label: string;
    placeholder: string;
  }[];
  accentColor?: "cyan" | "purple";
}

export function ApiKeyInput({
  apiKeys,
  onApiKeyChange,
  providers,
  accentColor = "cyan" as const,
}: ApiKeyInputProps) {
  const accentClasses =designAccentOptions[accentColor] || designAccentOptions.cyan;

  return (
    <div className="space-y-6">
      <div className={`${accentClasses.bg} border rounded-lg p-4`}>
        <div className="flex items-start gap-3">
          <AlertCircle
            className={`w-5 h-5 ${accentClasses.text} mt-0.5 flex-shrink-0`}
          />
          <div className="text-sm">
            <p className="font-medium mb-1 text-white">Privacy & Security</p>
            <ul className="text-gray-400 space-y-1">
              <li>
                • Your keys are sent directly to AI providers (OpenAI,
                Anthropic, Google)
              </li>
              <li>• We do not store or log your API keys</li>
              <li>• Keys are only used for this single analysis</li>
              <li>• If not provided, we'll use our server keys instead</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {providers.map((provider) => (
          <div key={provider.id}>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              {provider.label}
              <span className="text-gray-500 font-normal ml-2">
                (optional)
              </span>
            </label>
            <input
              type="password"
              placeholder={provider.placeholder}
              value={apiKeys[provider.id] || ""}
              onChange={(e) => onApiKeyChange(provider.id, e.target.value)}
              className={`w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl focus:outline-none ${accentClasses.focus} focus:ring-1 transition-colors font-mono text-sm text-gray-300`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}