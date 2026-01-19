import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get recent analyses
  const { data: recentAnalyses } = await supabase
    .from("analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  // Get usage stats
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { count: todayCount } = await supabase
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .gte("created_at", today.toISOString());

  const remaining = Math.max(0, 10 - (todayCount ?? 0));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="font-semibold">UXicAI</span>
          </Link>

          <nav className="flex items-center gap-6">
            <Link
              href="/dashboard/history"
              className="text-muted hover:text-foreground transition-colors"
            >
              History
            </Link>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="text-muted hover:text-foreground transition-colors"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {user.email?.split("@")[0]}
          </h1>
          <p className="text-muted">
            You have {remaining} analyses remaining today.
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
              {recentAnalyses.map((analysis) => (
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
