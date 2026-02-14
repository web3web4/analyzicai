"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import ApiKeysForm from "../components/ApiKeysForm";

interface ProfileData {
  userId: string;
  status: string;
  subscriptionTier: string;
  dailyTokenLimit: number | null;
  isAdmin: boolean;
  apiKeys: {
    openai: string | null;
    anthropic: string | null;
    gemini: string | null;
  };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      } else {
        setMessage({ type: "error", text: "Failed to load profile" });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  const tierTokenLimits = {
    free: 50_000,
    pro: 1_000_000,
    enterprise: 10_000_000,
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
    if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
    return tokens.toString();
  };

  const hasAnyKey = !!(profile?.apiKeys.openai || profile?.apiKeys.anthropic || profile?.apiKeys.gemini);
  const effectiveLimit = profile?.dailyTokenLimit ?? tierTokenLimits[profile?.subscriptionTier as keyof typeof tierTokenLimits] ?? 50_000;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-sm text-muted">Manage your account settings and API keys</p>
      </div>

      {message && (
        <div className={`mb-6 rounded-md p-4 ${message.type === "success" ? "bg-success/10 border border-success/20" : "bg-error/10 border border-error/20"}`}>
          <div className="flex">
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertCircle className="h-5 w-5 text-error" />
            )}
            <p className={`ml-3 text-sm font-medium ${message.type === "success" ? "text-success" : "text-error"}`}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Account Status */}
      <div className="mb-8 glass-card rounded-2xl p-8">
        <h2 className="text-lg font-semibold mb-4">Account Status</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {profile?.isAdmin && (
            <div>
              <dt className="text-sm font-medium text-muted">Role</dt>
              <dd className="mt-1 text-sm">
                <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
                Admin
                </span>
              </dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-muted">Subscription Tier</dt>
            <dd className="mt-1 text-sm capitalize">{profile?.subscriptionTier}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted">Daily Token Limit</dt>
            <dd className="mt-1 text-sm">
              {hasAnyKey ? "Unlimited (using own API keys)" : `${formatTokens(effectiveLimit)} tokens/day`}
            </dd>
          </div>
        </dl>
      </div>

      {/* Privacy & Security - API Keys Section */}
      <div className="glass-card rounded-2xl p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Privacy & Security</h2>
          <p className="text-sm text-muted mb-4">
            Manage your API keys and understand how we protect your data.
          </p>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-base font-semibold mb-4">Your API Keys</h3>
          <ApiKeysForm />
        </div>
      </div>
    </div>
  );
}
