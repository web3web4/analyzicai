"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

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

interface ApiKeysFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  compact?: boolean;
}

export default function ApiKeysForm({
  onSuccess,
  onCancel,
  compact = false,
}: ApiKeysFormProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // API Key form state
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [geminiKey, setGeminiKey] = useState("");

  // Visibility toggles
  const [showOpenai, setShowOpenai] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showGemini, setShowGemini] = useState(false);

  // Track which keys are stored
  const [hasOpenaiKey, setHasOpenaiKey] = useState(false);
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setHasOpenaiKey(!!data.apiKeys.openai);
        setHasAnthropicKey(!!data.apiKeys.anthropic);
        setHasGeminiKey(!!data.apiKeys.gemini);
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

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const updateData: Record<string, string | null> = {};

      // Only include keys that have been modified
      if (openaiKey) updateData.openaiKey = openaiKey;
      if (anthropicKey) updateData.anthropicKey = anthropicKey;
      if (geminiKey) updateData.geminiKey = geminiKey;

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: data.message });
        // Clear input fields
        setOpenaiKey("");
        setAnthropicKey("");
        setGeminiKey("");
        // Refresh profile
        await fetchProfile();
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save API keys",
        });
      }
    } catch (error) {
      console.error("Error saving keys:", error);
      setMessage({ type: "error", text: "Failed to save API keys" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteKey(keyType: "openai" | "anthropic" | "gemini") {
    if (
      !confirm(
        `Are you sure you want to delete your ${keyType.toUpperCase()} API key?`
      )
    ) {
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const updateData: Record<string, null> = {};
      updateData[`${keyType}Key`] = null;

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({
          type: "success",
          text: `${keyType.toUpperCase()} API key deleted`,
        });
        await fetchProfile();
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to delete API key",
        });
      }
    } catch (error) {
      console.error("Error deleting key:", error);
      setMessage({ type: "error", text: "Failed to delete API key" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {message && (
        <div
          className={`mb-6 rounded-xl p-4 ${message.type === "success" ? "bg-success/10 border border-success/20" : "bg-error/10 border border-error/20"}`}
        >
          <div className="flex">
            {message.type === "success" ? (
              <CheckCircle className="h-5 w-5 text-success" />
            ) : (
              <AlertCircle className="h-5 w-5 text-error" />
            )}
            <p
              className={`ml-3 text-sm font-medium ${message.type === "success" ? "text-success" : "text-error"}`}
            >
              {message.text}
            </p>
          </div>
        </div>
      )}

      {!compact && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6 space-y-3">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-primary mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <div className="text-sm space-y-2">
              <p className="font-bold">Your API keys are secure</p>
              <ul className="space-y-1.5 ml-1">
                <li>
                  • <strong>Encrypted at rest:</strong> Keys are stored
                  encrypted using AES-256-GCM encryption
                </li>
                <li>
                  • <strong>Never logged:</strong> We never log or store your
                  keys in plain text
                </li>
                <li>
                  • <strong>Direct transmission:</strong> Keys are sent directly
                  to AI providers (OpenAI, Anthropic, Google)
                </li>
                <li>
                  • <strong>Bypass rate limits:</strong> Using your own keys
                  gives you unlimited analysis with your provider credits
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* OpenAI API Key */}
        <div>
          <label htmlFor="openai-key" className="block text-sm font-medium mb-2">
            OpenAI API Key
            {hasOpenaiKey && (
              <span className="ml-2 text-success text-xs">
                (Saved: {profile?.apiKeys.openai})
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="openai-key"
                type={showOpenai ? "text" : "password"}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                placeholder={
                  hasOpenaiKey ? "Enter new key to update" : "sk-proj-..."
                }
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition-colors font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowOpenai(!showOpenai)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showOpenai ? (
                  <EyeOff className="h-5 w-5 text-muted" />
                ) : (
                  <Eye className="h-5 w-5 text-muted" />
                )}
              </button>
            </div>
            {hasOpenaiKey && (
              <button
                onClick={() => handleDeleteKey("openai")}
                disabled={saving}
                className="rounded-md bg-error px-3 py-2 text-sm font-semibold text-white hover:bg-error/80 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Anthropic API Key */}
        <div>
          <label
            htmlFor="anthropic-key"
            className="block text-sm font-medium mb-2"
          >
            Anthropic API Key
            {hasAnthropicKey && (
              <span className="ml-2 text-success text-xs">
                (Saved: {profile?.apiKeys.anthropic})
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="anthropic-key"
                type={showAnthropic ? "text" : "password"}
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                placeholder={
                  hasAnthropicKey ? "Enter new key to update" : "sk-ant-..."
                }
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition-colors font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowAnthropic(!showAnthropic)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showAnthropic ? (
                  <EyeOff className="h-5 w-5 text-muted" />
                ) : (
                  <Eye className="h-5 w-5 text-muted" />
                )}
              </button>
            </div>
            {hasAnthropicKey && (
              <button
                onClick={() => handleDeleteKey("anthropic")}
                disabled={saving}
                className="rounded-md bg-error px-3 py-2 text-sm font-semibold text-white hover:bg-error/80 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        {/* Gemini API Key */}
        <div>
          <label htmlFor="gemini-key" className="block text-sm font-medium mb-2">
            Google Gemini API Key
            {hasGeminiKey && (
              <span className="ml-2 text-success text-xs">
                (Saved: {profile?.apiKeys.gemini})
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="gemini-key"
                type={showGemini ? "text" : "password"}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                placeholder={hasGeminiKey ? "Enter new key to update" : "AIza..."}
                className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-primary transition-colors font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowGemini(!showGemini)}
                className="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                {showGemini ? (
                  <EyeOff className="h-5 w-5 text-muted" />
                ) : (
                  <Eye className="h-5 w-5 text-muted" />
                )}
              </button>
            </div>
            {hasGeminiKey && (
              <button
                onClick={() => handleDeleteKey("gemini")}
                disabled={saving}
                className="rounded-md bg-error px-3 py-2 text-sm font-semibold text-white hover:bg-error/80 disabled:opacity-50"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
        <p className="text-xs text-muted flex items-center gap-1">
          🔒 Keys are always saved securely with AES-256-GCM encryption
        </p>
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={saving}
              className="px-6 py-3 rounded-xl text-sm font-semibold border border-border hover:bg-surface-light transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || (!openaiKey && !anthropicKey && !geminiKey)}
            className="btn-primary px-6 py-3 rounded-xl text-sm font-semibold text-white shadow-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {saving ? "Saving..." : "Save API Keys"}
          </button>
        </div>
      </div>
    </div>
  );
}
