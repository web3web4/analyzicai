"use client";

import Link from "next/link";
import { useState } from "react";

interface NoApiKeysPromptProps {
  onRegisterInterest?: () => void;
}

export function NoApiKeysPrompt({ onRegisterInterest }: NoApiKeysPromptProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const handleRegisterInterest = async () => {
    if (!selectedPlan) return;

    setIsRegistering(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interested_plan: selectedPlan }),
      });

      if (res.ok) {
        setRegistered(true);
        onRegisterInterest?.();
      }
    } catch (error) {
      console.error("Failed to register interest:", error);
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔑</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Add API Keys to Start Analyzing</h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            UXicAI is currently in early alpha. To analyze designs, you need to provide 
            your own AI provider API keys.
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold mb-3">Option 1: Use Your Own API Keys</h2>
          <p className="text-muted mb-6">
            Add keys from OpenAI, Anthropic (Claude), or Google (Gemini) to start 
            analyzing immediately. Your keys are encrypted and never shared.
          </p>
          <Link 
            href="/dashboard/settings" 
            className="btn-primary px-8 py-3 rounded-xl inline-block"
          >
            Add API Keys →
          </Link>
        </div>

        <div className="glass-card rounded-2xl p-8 mb-8">
          <h2 className="text-xl font-semibold mb-3">Option 2: Wait for Subscription Plans</h2>
          <p className="text-muted mb-6">
            We're working on subscription plans with built-in credits. 
            {registered ? (
              <span className="block mt-2 text-success font-medium">
                ✓ You're on the waitlist! We'll notify you when plans are available.
              </span>
            ) : (
              " Register your interest to be notified when they launch."
            )}
          </p>

          {!registered ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                {["starter", "pro", "enterprise"].map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`glass-card p-4 rounded-xl border-2 transition-colors ${
                      selectedPlan === plan
                        ? "border-primary bg-primary/10"
                        : "border-transparent hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold mb-1 capitalize">{plan}</div>
                    <div className="text-sm text-muted">
                      {plan === "starter" && "Light usage"}
                      {plan === "pro" && "Regular use"}
                      {plan === "enterprise" && "Team/heavy use"}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={handleRegisterInterest}
                disabled={!selectedPlan || isRegistering}
                className="btn-secondary px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegistering ? "Registering..." : "Register Interest for Subscription Plans"}
              </button>
            </div>
          ) : null}
        </div>

        <div className="glass-card rounded-2xl p-6 border-border/50">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span>ℹ️</span>
            Why API Keys During Alpha?
          </h3>
          <p className="text-sm text-muted mb-3">
            During the alpha phase, we're focusing on perfecting the analysis quality:
          </p>
          <ul className="text-sm text-muted space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Full control over costs and usage</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Faster iteration without billing complexity</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Keeps platform accessible while we refine it</span>
            </li>
          </ul>
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-muted hover:text-foreground transition-colors">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}