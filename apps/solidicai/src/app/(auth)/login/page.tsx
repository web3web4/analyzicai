"use client";

import { createBrowserClient } from "@web3web4/shared-platform";
import {
  AUTH_NETWORK_ERROR_MESSAGE,
  isNetworkError,
} from "@/lib/constants/errors";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import {
  Logo,
  SocialAuthProviders,
  AuthDivider,
  getEnabledProviders,
  type SocialProvider,
} from "@web3web4/shared-platform";

// Filter providers at module level (env vars are embedded at build time)
const socialProviders = getEnabledProviders();

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";

  const supabase = createBrowserClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Supabase login error:", error);

      if (isNetworkError(error.message)) {
        setError(AUTH_NETWORK_ERROR_MESSAGE);
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleSocialLogin(provider: SocialProvider) {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/callback?redirect=${encodeURIComponent(redirect)}`,
      },
    });

    if (error) {
      console.error("Social login error:", error);

      if (isNetworkError(error.message)) {
        setError(AUTH_NETWORK_ERROR_MESSAGE);
      } else {
        setError(error.message);
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-black text-white">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Logo prefix="Solidic" containerSize="md" />
        </Link>

        <div className="glass-card rounded-2xl p-8 border border-white/10 bg-white/5 backdrop-blur-xl">
          <h1 className="text-2xl font-bold text-center mb-6">Welcome back</h1>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Social Login */}
          {socialProviders.length > 0 && (
            <>
              <SocialAuthProviders
                providers={socialProviders}
                onProviderClick={handleSocialLogin}
              />
              <AuthDivider />
            </>
          )}

          {/* Email Login */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-surface-light border border-border focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors text-foreground placeholder-muted"
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
                className="w-full px-4 py-3 rounded-lg bg-surface-light border border-border focus:border-primary focus:ring-2 focus:ring-primary/50 focus:outline-none transition-colors text-foreground placeholder-muted"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg btn-primary font-medium text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-primary hover:text-primary-light transition-colors"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          <div className="animate-pulse text-gray-500">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
