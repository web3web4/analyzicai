import { createClient, createServiceClient } from "@web3web4/shared-platform/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@web3web4/shared-platform/server-components";
import { UXIC_SOURCE_TYPES } from "@web3web4/ai-core";
import { checkRateLimit } from "@web3web4/shared-platform/auth/rate-limit";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get recent analyses (UI/UX only)
  const { data: recentAnalyses } = await supabase
    .from("analyses")
    .select("*")
    .in("source_type", UXIC_SOURCE_TYPES)
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
    <div className="min-h-screen bg-background">
      <DashboardHeader theme="uxic" prefix="UXic" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, 
            
            <span className="text-brand-primary">
              {user.email?.split("@")[0]}
            </span>
          </h1>
          <p className="text-muted">
            {!hasAccess ? (
              <>
                <span className="text-warning">⚠️ No active access.</span>{" "}
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
              <span className="text-success">✓ Unlimited (using your own API keys)</span>
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
            className="glass-card rounded-2xl p-8 hover:border-primary/50 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">🔍</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">New Analysis</h2>
            <p className="text-muted">
              Upload a screenshot or capture your screen to start a new UI/UX
              analysis.
            </p>
          </Link>

          <Link
            href="/dashboard/history"
            className="glass-card rounded-2xl p-8 hover:border-primary/50 transition-colors group"
          >
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">View History</h2>
            <p className="text-muted">
              Browse your past analyses and compare results across different
              designs.
            </p>
          </Link>
        </div>

        {/* Recent Analyses */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Recent Analyses</h2>

          {!recentAnalyses || recentAnalyses.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🎨</span>
              </div>
              <h3 className="text-lg font-medium mb-2">No analyses yet</h3>
              <p className="text-muted mb-6">
                Start your first analysis to get AI-powered UI/UX feedback.
              </p>
              <Link
                href="/dashboard/analyze"
                className="btn-primary px-6 py-3 rounded-full text-white font-medium inline-block"
              >
                Start First Analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAnalyses.map((analysis: any) => (
                <Link
                  key={analysis.id}
                  href={`/dashboard/results/${analysis.id}`}
                  className="glass-card rounded-xl p-6 flex items-center gap-6 hover:border-primary/50 transition-colors"
                >
                  <div className="w-16 h-16 rounded-lg bg-surface-light flex items-center justify-center shrink-0">
                    {analysis.status === "completed" ? (
                      <span className="text-2xl font-bold text-primary">
                        {analysis.final_score ?? "-"}
                      </span>
                    ) : (
                      <span className="text-muted">...</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted capitalize">
                        {analysis.source_type.replace("_", " ")}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          analysis.status === "completed"
                            ? "bg-success/20 text-success"
                            : analysis.status === "failed"
                              ? "bg-error/20 text-error"
                              : "bg-warning/20 text-warning"
                        }`}
                      >
                        {analysis.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted truncate">
                      Providers: {analysis.providers_used?.join(", ")}
                    </p>
                  </div>
                  <div className="text-sm text-muted">
                    {new Date(analysis.created_at).toLocaleDateString()}
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
