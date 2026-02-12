import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all analyses with pagination potential
  const { data: analyses } = await supabase
    .from("analyses")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analysis History</h1>
            <p className="text-muted">{analyses?.length ?? 0} analyses total</p>
          </div>
          <Link
            href="/dashboard/analyze"
            className="btn-primary px-6 py-3 rounded-full text-white font-medium"
          >
            New Analysis
          </Link>
        </div>

        {!analyses || analyses.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-lg font-medium mb-2">No analyses yet</h3>
            <p className="text-muted mb-6">
              Start your first analysis to see results here.
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
            {analyses.map((analysis) => (
              <Link
                key={analysis.id}
                href={`/dashboard/results/${analysis.id}`}
                className="glass-card rounded-xl p-6 flex items-center gap-6 hover:border-primary/50 transition-colors block"
              >
                {/* Score */}
                <div className="w-20 h-20 rounded-xl bg-surface-light flex flex-col items-center justify-center shrink-0">
                  {analysis.status === "completed" ? (
                    <>
                      <span
                        className={`text-2xl font-bold ${
                          (analysis.final_score ?? 0) >= 80
                            ? "text-success"
                            : (analysis.final_score ?? 0) >= 60
                              ? "text-warning"
                              : "text-error"
                        }`}
                      >
                        {analysis.final_score ?? "-"}
                      </span>
                      <span className="text-xs text-muted">/100</span>
                    </>
                  ) : (
                    <span className="text-muted text-sm capitalize">
                      {analysis.status}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
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
                    <span className="text-sm text-muted capitalize">
                      {analysis.source_type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-muted text-sm mb-1">
                    Providers: {analysis.providers_used?.join(", ")}
                  </p>
                  <p className="text-muted text-sm">
                    Master: {analysis.master_provider}
                  </p>
                </div>

                {/* Date */}
                <div className="text-right shrink-0">
                  <p className="text-sm">
                    {new Date(analysis.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(analysis.created_at).toLocaleTimeString()}
                  </p>
                </div>

                {/* Arrow */}
                <div className="text-muted">→</div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
