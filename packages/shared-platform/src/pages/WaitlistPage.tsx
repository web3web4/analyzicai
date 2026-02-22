"use client";

import { createBrowserClient } from "../supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "../components/Logo";
import type { ThemeVariant } from "../utils/formatting";

const PLANS = [
  { id: "starter", label: "Starter", description: "Light usage" },
  { id: "pro", label: "Pro", description: "Regular use" },
  { id: "enterprise", label: "Enterprise", description: "Team / heavy use" },
] as const;

type Plan = (typeof PLANS)[number]["id"];

const themeStyles = {
  uxic: {
    wrapper: "min-h-screen bg-background flex items-center justify-center px-4 py-16",
    successIcon: "bg-success/20",
    successBodyText: "text-muted",
    successHighlight: "text-foreground font-medium",
    successLink: "text-primary hover:underline transition-colors",
    card: "glass-card rounded-2xl p-8",
    descText: "text-muted",
    errorBox: "bg-error/10 border border-error/20 text-error",
    labelColor: "",
    emailDisplay: "bg-surface-light border border-border text-muted",
    emailDisplayHighlight: "text-xs text-success",
    emailInput: "bg-surface-light border border-border focus:border-primary focus:outline-none transition-colors",
    emailInputExtra: "",
    planLabelColor: "",
    planSelected: "border-primary bg-primary/10",
    planUnselected: "border-border hover:border-primary/50 bg-surface-light",
    planLabelText: "",
    planDescText: "text-xs text-muted",
    submitBtn: "w-full btn-primary py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed",
    footerText: "text-center text-sm text-muted mt-6",
    footerLink: "text-primary hover:underline",
    prefix: "UXic" as const,
  },
  solidic: {
    wrapper: "min-h-screen bg-black text-white flex items-center justify-center px-4 py-16",
    successIcon: "bg-green-500/20",
    successBodyText: "text-gray-400",
    successHighlight: "text-white font-medium",
    successLink: "text-cyan-400 hover:text-cyan-300 transition-colors",
    card: "rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-8",
    descText: "text-gray-400",
    errorBox: "bg-red-500/10 border border-red-500/20 text-red-400",
    labelColor: "text-gray-300",
    emailDisplay: "bg-white/5 border border-white/10 text-gray-400",
    emailDisplayHighlight: "text-xs text-green-400",
    emailInput: "bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors text-white placeholder-gray-500",
    emailInputExtra: "",
    planLabelColor: "text-gray-300",
    planSelected: "border-cyan-500 bg-cyan-500/10",
    planUnselected: "border-white/10 hover:border-white/30 bg-white/5",
    planLabelText: "text-white",
    planDescText: "text-xs text-gray-500",
    submitBtn: "w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed",
    footerText: "text-center text-sm text-gray-500 mt-6",
    footerLink: "text-cyan-400 hover:text-cyan-300 transition-colors",
    prefix: "Solidic" as const,
  },
};

export interface WaitlistPageProps {
  theme?: ThemeVariant;
}

export default function WaitlistPage({ theme = "uxic" }: WaitlistPageProps) {
  const supabase = createBrowserClient();
  const s = themeStyles[theme];

  const [userEmail, setUserEmail] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<Plan | "">("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setUserEmail(user.email);
        setEmail(user.email);
        setIsLoggedIn(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interested_plan: selectedPlan,
        email: isLoggedIn ? undefined : email,
      }),
    });

    setLoading(false);

    if (res.ok) {
      setSubmitted(true);
    } else {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className={s.wrapper}>
        <div className="w-full max-w-md text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${s.successIcon}`}>
            <span className="text-4xl">🎉</span>
          </div>
          <h1 className="text-2xl font-bold mb-3">You&apos;re on the list!</h1>
          <p className={`mb-8 ${s.successBodyText}`}>
            We&apos;ll email{" "}
            <span className={s.successHighlight}>
              {isLoggedIn ? userEmail : email}
            </span>{" "}
            when subscription plans are available.
          </p>
          <Link href={isLoggedIn ? "/dashboard" : "/"} className={s.successLink}>
            ← {isLoggedIn ? "Back to dashboard" : "Back to home"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={s.wrapper}>
      <div className="w-full max-w-lg">
        <Link href="/" className="flex items-center justify-center mb-8">
          <Logo prefix={s.prefix} containerSize="md" />
        </Link>

        <div className={s.card}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Join the Waitlist</h1>
            <p className={s.descText}>
              Subscription plans with built-in credits are coming soon. Register
              your interest and we&apos;ll notify you first.
            </p>
          </div>

          {error && (
            <div className={`px-4 py-3 rounded-lg mb-6 text-sm ${s.errorBox}`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className={`block text-sm font-medium mb-2 ${s.labelColor}`}
              >
                Email
              </label>
              {isLoggedIn ? (
                <div className={`w-full px-4 py-3 rounded-lg text-sm ${s.emailDisplay}`}>
                  {userEmail}
                  <span className={`ml-2 ${s.emailDisplayHighlight}`}>
                    ✓ from your account
                  </span>
                </div>
              ) : (
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg ${s.emailInput}`}
                  placeholder="you@example.com"
                  required
                />
              )}
            </div>

            <div>
              <label className={`block text-sm font-medium mb-3 ${s.planLabelColor}`}>
                Which plan are you interested in?
              </label>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    type="button"
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`p-4 rounded-xl border-2 transition-colors text-left ${
                      selectedPlan === plan.id ? s.planSelected : s.planUnselected
                    }`}
                  >
                    <div className={`font-semibold mb-1 ${s.planLabelText}`}>
                      {plan.label}
                    </div>
                    <div className={s.planDescText}>{plan.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedPlan || loading || (!isLoggedIn && !email)}
              className={s.submitBtn}
            >
              {loading ? "Joining..." : "Join Waitlist"}
            </button>
          </form>

          <p className={s.footerText}>
            Want immediate access?{" "}
            {isLoggedIn ? (
              <Link href="/dashboard/settings" className={s.footerLink}>
                Add your own API keys →
              </Link>
            ) : (
              <Link href="/signup" className={s.footerLink}>
                Create a free account →
              </Link>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
