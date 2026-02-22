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
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black text-white">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="text-2xl font-bold mb-4">Check your email</h1>
          <p className="text-gray-400 mb-8">
            We&apos;ve sent a confirmation link to <strong>{email}</strong>.
            Click the link to verify your account.
          </p>
          <p className="text-xl mb-8">
            If you could not find the email, please <span className="text-warning">check your spam</span> folder or try signing up again with one of the available <span className="text-warning">social providers</span>.
          </p>
          <Link
            href="/login"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black text-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo prefix="Solidic" containerSize="md" />
        </Link>

        <div className="glass-card rounded-2xl p-8 border border-white/10 bg-white/5 backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-center mb-2">
            Create your account
          </h1>
          <p className="text-gray-400 text-center mb-6">
            Free to start • Use your own API keys or join waitlist
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Social Signup */}
          {socialProviders.length > 0 && (
            <>
              <SocialAuthProviders
                providers={socialProviders}
                onProviderClick={handleSocialSignup}
              />
              <AuthDivider />
            </>
          )}

          {/* Email Signup */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 text-gray-300"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors text-white placeholder-gray-500"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-2 text-gray-300"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors text-white placeholder-gray-500"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-2 text-gray-300"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-primary focus:outline-none transition-colors text-white placeholder-gray-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
