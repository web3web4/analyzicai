import { createClient, createServiceClient } from "@web3web4/shared-platform/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@web3web4/shared-platform/server-components";
import { FileCode, Github, Code, Shield } from "lucide-react";
import { checkRateLimit } from "@web3web4/shared-platform/auth/rate-limit";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get recent analyses (Contract specific)
  // Filter by source_type to avoid mixing with UXicAI images
  const { data: recentAnalyses } = await supabase
    .from("analyses")
    .select("*")
    .in("source_type", ["code", "github"])
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get user profile to check access
  const serviceSupabase = createServiceClient();
  const { data: profile } = await serviceSupabase
    .from("user_profiles")
    .select("encrypted_openai_key, encrypted_anthropic_key, encrypted_gemini_key, is_admin, subscription_tier, status, daily_token_limit")
    .eq("user_id", user.id)
    .single();

  // Check if user has access (BYOK or allocated tokens)
  const hasApiKeys = !!(
    profile?.encrypted_openai_key ||
    profile?.encrypted_anthropic_key ||
    profile?.encrypted_gemini_key
  );
  
  // Check allocated tokens (from tier OR custom admin assignment)
  const tierTokens: Record<string, number> = {
    free: 0,
    pro: 1_000_000,
    enterprise: 10_000_000,
  };
  
  const allocatedTokens = 
    profile?.daily_token_limit ?? 
    tierTokens[profile?.subscription_tier ?? 'free'] ?? 
    0;
  
  const hasAccess = hasApiKeys || allocatedTokens > 0;

  // Get token-based rate limit info
  const rateLimit = await checkRateLimit(user.id);
  const remainingTokens = rateLimit.remaining;
  const usedTokens = rateLimit.used;
  const totalTokens = rateLimit.limit;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <DashboardHeader theme="solidic" prefix="Solidic" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Welcome back,{" "}
            <span className="text-brand-web3-cyan">
              {user.email?.split("@")[0]}
            </span>
          </h1>
          <p className="text-fg-secondary">
            {!hasAccess ? (
              <>
                <span className="text-yellow-400">⚠️ No active access.</span>{" "}
                <Link href="/dashboard/settings" className="text-primary hover:underline">
                  Provide API keys
                </Link>{" "}
                or{" "}
                <Link href="/waitlist" className="text-primary hover:underline">
                  join waitlist
                </Link>{" "}
                for paid plans.
              </>
            ) : hasApiKeys ? (
              <span className="text-green-400">✓ Unlimited (using your own API keys)</span>
            ) : (
              <>
                {remainingTokens.toLocaleString()} tokens remaining today ({usedTokens.toLocaleString()} / {totalTokens.toLocaleString()} used)
              </>
            )}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/dashboard/analyze"
            className="group relative overflow-hidden rounded-2xl bg-surface border border-border p-8 transition-all hover:bg-surface-light hover:border-primary/50"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="h-32 w-32 -rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">
                New Smart Contract Scan
              </h2>
              <p className="text-fg-secondary">
                Paste Solidity code or provide a GitHub URL to detect
                vulnerabilities and gas optimizations.
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/history"
            className="group relative overflow-hidden rounded-2xl bg-surface border border-border p-8 transition-all hover:bg-surface-light hover:border-accent/50"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileCode className="h-6 w-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">
                Audit History
              </h2>
              <p className="text-fg-secondary">
                Review past security reports and track your contract
                improvements over time.
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Analyses */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-white">
            Recent Audits
          </h2>

          {!recentAnalyses || recentAnalyses.length === 0 ? (
            <div className="rounded-2xl bg-surface border border-border p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-fg-tertiary" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-white">
                No audits yet
              </h3>
              <p className="text-fg-tertiary mb-6">
                Start your first smart contract analysis to secure your code.
              </p>
              <Link
                href="/dashboard/analyze"
                className="px-6 py-3 rounded-xl btn-primary text-white font-medium inline-block hover:opacity-90 transition-opacity"
              >
                Start First Scan
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAnalyses.map((analysis) => (
                <Link
                  key={analysis.id}
                  href={`/dashboard/results/${analysis.id}`}
                  className="block rounded-xl bg-surface border border-border p-6 transition-all hover:bg-surface-light hover:border-primary/30"
                >
                  <div className="flex items-center gap-6">
                    {/* Score Badge */}
                    <div className="w-16 h-16 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-border">
                      {analysis.status === "completed" ? (
                        <span
                          className={`text-2xl font-bold ${
                            (analysis.final_score ?? 0) >= 80
                              ? "text-green-400"
                              : (analysis.final_score ?? 0) >= 60
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          {analysis.final_score ?? "-"}
                        </span>
                      ) : (
                        <span className="text-fg-tertiary">...</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="flex items-center gap-1 text-sm font-medium text-primary capitalize bg-primary/10 px-2 py-0.5 rounded">
                          {analysis.source_type === "github" ? (
                            <Github className="h-3 w-3" />
                          ) : (
                            <Code className="h-3 w-3" />
                          )}
                          {analysis.source_type}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            analysis.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : analysis.status === "failed"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {analysis.status}
                        </span>
                      </div>

                      <div className="text-sm text-fg-secondary font-mono truncate mb-1">
                        {analysis.source_type === "github"
                          ? (analysis.repo_info as any)?.url?.replace(
                              "https://github.com/",
                              "",
                            )
                          : "Pasted Contract Code"}
                      </div>

                      <p className="text-xs text-fg-tertiary truncate">
                        Providers: {analysis.providers_used?.join(", ")}
                      </p>
                    </div>

                    <div className="text-sm text-fg-tertiary tabular-nums">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
