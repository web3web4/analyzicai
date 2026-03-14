"use client";

import { SiGithub, SiGoogle, SiApple, SiFigma, SiNotion } from "react-icons/si";
import { Square } from "lucide-react";
import type { IconType } from "react-icons";

export type SocialProvider =
  | "github"
  | "google"
  | "azure"
  | "apple"
  | "figma"
  | "notion";

export interface SocialProviderConfig {
  id: SocialProvider;
  name: string;
  icon: IconType | typeof Square;
  envKey: string;
}

export const allProviders: SocialProviderConfig[] = [
  { id: "github", name: "GitHub", icon: SiGithub, envKey: "GITHUB" },
  { id: "google", name: "Google", icon: SiGoogle, envKey: "GOOGLE" },
  { id: "azure", name: "Microsoft", icon: Square, envKey: "AZURE" },
  { id: "apple", name: "Apple", icon: SiApple, envKey: "APPLE" },
  { id: "figma", name: "Figma", icon: SiFigma, envKey: "FIGMA" },
  { id: "notion", name: "Notion", icon: SiNotion, envKey: "NOTION" },
];

// Map provider IDs to their actual env var values (Next.js requires explicit references)
export const getProviderClientId = (providerId: SocialProvider): string | undefined => {
  switch (providerId) {
    case "github":
      return process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    case "google":
      return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    case "azure":
      return process.env.NEXT_PUBLIC_AZURE_CLIENT_ID;
    case "apple":
      return process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
    case "figma":
      return process.env.NEXT_PUBLIC_FIGMA_CLIENT_ID;
    case "notion":
      return process.env.NEXT_PUBLIC_NOTION_CLIENT_ID;
    default:
      return undefined;
  }
};

// Filter providers at module level (env vars are embedded at build time)
export const getEnabledProviders = (): SocialProviderConfig[] => {
  return allProviders.filter((provider) => {
    const clientId = getProviderClientId(provider.id);
    return clientId && clientId !== "ADD_TO_ENABLE" && clientId.trim() !== "";
  });
};

export interface SocialAuthProvidersProps {
  providers: SocialProviderConfig[];
  onProviderClick: (providerId: SocialProvider) => void;
  buttonClassName?: string;
  containerClassName?: string;
  layout?: "grid" | "stack";
}

/**
 * Renders social authentication provider buttons with official brand icons.
 * 
 * @example
 * ```tsx
 * const socialProviders = getEnabledProviders();
 * 
 * <SocialAuthProviders
 *   providers={socialProviders}
 *   onProviderClick={handleSocialLogin}
 *   buttonClassName="btn-primary"
 * />
 * ```
 */
export function SocialAuthProviders({
  providers,
  onProviderClick,
  buttonClassName = "flex items-center justify-center gap-2 px-4 py-3 w-full py-3 rounded-lg btn-primary font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed",
  containerClassName = "grid grid-cols-1 gap-3 mb-6",
  layout = "stack",
}: SocialAuthProvidersProps) {
  if (providers.length === 0) {
    return null;
  }

  return (
    <div className={containerClassName}>
      {providers.map((provider) => {
        const IconComponent = provider.icon;
        return (
          <button
            key={provider.id}
            onClick={() => onProviderClick(provider.id)}
            className={buttonClassName}
            type="button"
          >
            <IconComponent className="w-5 h-5" />
            <span className="text-sm">{provider.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export interface AuthDividerProps {
  text?: string;
  className?: string;
  borderClassName?: string;
  textClassName?: string;
}

/**
 * Renders a horizontal divider with optional text, commonly used between
 * social auth buttons and email form.
 */
export function AuthDivider({
  text = "or continue with email",
  className,
  borderClassName = "border-white/10",
  textClassName = "bg-black/50 text-gray-500",
}: AuthDividerProps) {
  return (
    <div className={`relative mb-6 ${className || ""}`}>
      <div className="absolute inset-0 flex items-center">
        <div className={`w-full border-t ${borderClassName}`} />
      </div>
      <div className="relative flex justify-center text-sm">
        <span className={`px-4 ${textClassName}`}>{text}</span>
      </div>
    </div>
  );
}
