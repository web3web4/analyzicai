"use client";

import { createBrowserClient } from "@web3web4/shared-platform";
import {
  AUTH_NETWORK_ERROR_MESSAGE,
  isNetworkError,
} from "@/lib/constants/errors";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Logo,
  SocialAuthProviders,
  AuthDivider,
  getEnabledProviders,
  type SocialProvider,
} from "@web3web4/shared-platform";

// Filter providers at module level (env vars are embedded at build time)
const socialProviders = getEnabledProviders();

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabase = createBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      console.error("Supabase signup error:", error);

      if (isNetworkError(error.message)) {
        setError(AUTH_NETWORK_ERROR_MESSAGE);
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  async function handleSocialSignup(provider: SocialProvider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });

    if (error) {
      console.error("Social signup error:", error);

      if (isNetworkError(error.message)) {
        setError(AUTH_NETWORK_ERROR_MESSAGE);
      } else {
        setError(error.message);
      }
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">Check your email</h1>
          <p className="text-muted mb-8">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Click the link to verify your account.
          </p>
          <p className="text-xl mb-8">
            If you could not find the email, please <span className="text-warning">check your spam</span> folder or try signing up again with one of the available <span className="text-warning">social providers</span>.
          </p>
          <Link
            href="/login"
            className="text-primary hover:text-primary-light transition-colors"
          >
            Back to log in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo prefix="UXic" containerSize="md" />
        </Link>

        <div className="glass-card rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-center mb-2">
            Create your account
          </h1>
          <p className="text-muted text-center mb-6">
            Free to start • Use your own API keys or join waitlist
          </p>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Social Signup */}
          {socialProviders.length > 0 && (
            <>
              <SocialAuthProviders
                providers={socialProviders}
                onProviderClick={handleSocialSignup}
                buttonClassName="flex items-center justify-center gap-2 px-4 py-3 w-full btn-primary py-3 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <AuthDivider borderClassName="border-border" textClassName="bg-surface text-muted" />
            </>
          )}

          {/* Email Signup */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-light border border-border focus:border-primary focus:outline-none transition-colors"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-light border border-border focus:border-primary focus:outline-none transition-colors"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-light border border-border focus:border-primary focus:outline-none transition-colors"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-primary hover:text-primary-light transition-colors"
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
