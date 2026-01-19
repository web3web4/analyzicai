import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AnalysisResult, SynthesizedResult } from "@/lib/ai/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get analysis
  const { data: analysis } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (!analysis) {
    notFound();
  }

  // Get all responses for this analysis
  const { data: responses } = await supabase
    .from("analysis_responses")
    .select("*")
    .eq("analysis_id", id)
    .order("created_at");

  const v1Responses = responses?.filter((r) => r.step === "v1_initial") ?? [];
  const v2Responses = responses?.filter((r) => r.step === "v2_rethink") ?? [];
  const synthesisResponse = responses?.find((r) => r.step === "v3_synthesis");

  const finalResult = synthesisResponse?.result as
    | SynthesizedResult
    | undefined;

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

          <Link
            href="/dashboard"
            className="text-muted hover:text-foreground transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Status Banner */}
        {analysis.status !== "completed" && (
          <div
            className={`mb-8 px-6 py-4 rounded-xl ${
              analysis.status === "failed"
                ? "bg-error/10 border border-error/20"
                : "bg-warning/10 border border-warning/20"
            }`}
          >
            {analysis.status === "failed" ? (
              <p className="text-error">Analysis failed. Please try again.</p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />
                <p className="text-warning">
                  Analysis in progress:{" "}
                  {analysis.status.replace("step", "Step ")}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Score Overview */}
        <div className="glass-card rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Score Circle */}
            <div className="relative w-40 h-40 shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="var(--surface-light)"
                  strokeWidth="12"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(analysis.final_score ?? 0) * 4.4} 440`}
                />
                <defs>
                  <linearGradient
                    id="scoreGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--accent)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">
                  {analysis.final_score ?? "-"}
                </span>
                <span className="text-muted text-sm">/ 100</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold mb-2">Analysis Results</h1>
              <p className="text-muted mb-4">
                Analyzed on {new Date(analysis.created_at).toLocaleDateString()}{" "}
                using {analysis.providers_used?.join(", ")}
              </p>
              {finalResult?.summary && (
                <p className="text-muted">{finalResult.summary}</p>
              )}
            </div>
          </div>
        </div>

        {/* Category Scores */}
        {finalResult?.categories && (
          <div className="glass-card rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-semibold mb-6">Category Scores</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {Object.entries(finalResult.categories).map(([key, category]) => (
                <div key={key} className="p-4 rounded-xl bg-surface-light">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium capitalize">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                    <span
                      className={`font-bold ${
                        category.score >= 80
                          ? "text-success"
                          : category.score >= 60
                            ? "text-warning"
                            : "text-error"
                      }`}
                    >
                      {category.score}
                    </span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        category.score >= 80
                          ? "bg-success"
                          : category.score >= 60
                            ? "bg-warning"
                            : "bg-error"
                      }`}
                      style={{ width: `${category.score}%` }}
                    />
                  </div>
                  {category.observations?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {category.observations.slice(0, 2).map((obs, i) => (
                        <li key={i} className="text-sm text-muted">
                          • {obs}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {finalResult?.recommendations &&
          finalResult.recommendations.length > 0 && (
            <div className="glass-card rounded-2xl p-8 mb-8">
              <h2 className="text-xl font-semibold mb-6">Recommendations</h2>
              <div className="space-y-4">
                {finalResult.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border-l-4 ${
                      rec.severity === "critical"
                        ? "border-error bg-error/10"
                        : rec.severity === "high"
                          ? "border-warning bg-warning/10"
                          : rec.severity === "medium"
                            ? "border-accent bg-accent/10"
                            : "border-muted bg-surface-light"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium uppercase ${
                          rec.severity === "critical"
                            ? "bg-error/20 text-error"
                            : rec.severity === "high"
                              ? "bg-warning/20 text-warning"
                              : rec.severity === "medium"
                                ? "bg-accent/20 text-accent"
                                : "bg-muted/20 text-muted"
                        }`}
                      >
                        {rec.severity}
                      </span>
                      <span className="text-sm text-muted">{rec.category}</span>
                    </div>
                    <h3 className="font-medium mb-1">{rec.title}</h3>
                    <p className="text-sm text-muted">{rec.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Provider Responses (Collapsible) */}
        {(v1Responses.length > 0 || v2Responses.length > 0) && (
          <details className="glass-card rounded-2xl overflow-hidden">
            <summary className="p-6 cursor-pointer hover:bg-surface-light transition-colors">
              <span className="font-semibold">View All Provider Responses</span>
            </summary>
            <div className="p-6 pt-0 space-y-6">
              {v1Responses.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 text-muted">
                    Initial Analysis (v1)
                  </h3>
                  <div className="space-y-2">
                    {v1Responses.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-lg bg-surface-light"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">
                            {r.provider}
                          </span>
                          <span className="text-muted text-sm">
                            Score: {(r.result as AnalysisResult).overallScore}
                          </span>
                        </div>
                        <p className="text-sm text-muted">
                          {(r.result as AnalysisResult).summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {v2Responses.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 text-muted">
                    Rethink Analysis (v2)
                  </h3>
                  <div className="space-y-2">
                    {v2Responses.map((r) => (
                      <div
                        key={r.id}
                        className="p-4 rounded-lg bg-surface-light"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">
                            {r.provider}
                          </span>
                          <span className="text-muted text-sm">
                            Score: {(r.result as AnalysisResult).overallScore}
                          </span>
                        </div>
                        <p className="text-sm text-muted">
                          {(r.result as AnalysisResult).summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Empty State for Pending */}
        {analysis.status === "pending" && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mx-auto mb-4 animate-pulse">
              <span className="text-3xl">🔍</span>
            </div>
            <h3 className="text-lg font-medium mb-2">Analysis Starting...</h3>
            <p className="text-muted">
              Your analysis is being processed. Results will appear here
              shortly.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
