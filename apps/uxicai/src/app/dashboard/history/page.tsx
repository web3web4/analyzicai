import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { EmptyState, AnalysisCard } from "@web3web4/ui-library";
import { UXIC_SOURCE_TYPES } from "@web3web4/ai-core";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all analyses with pagination potential (UI/UX only)
  const { data: analyses } = await supabase
    .from("analyses")
    .select("*")
    .in("source_type", UXIC_SOURCE_TYPES)
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
          <EmptyState
            variant="uxic"
            icon={<span className="text-3xl">📊</span>}
            title="No analyses yet"
            description="Start your first analysis to see results here."
            actionLabel="Start First Analysis"
            actionHref="/dashboard/analyze"
          />
        ) : (
          <div className="space-y-4">
            {analyses.map((analysis) => (
              <AnalysisCard
                key={analysis.id}
                id={analysis.id}
                score={analysis.final_score}
                status={analysis.status}
                sourceType={analysis.source_type}
                providers={analysis.providers_used || []}
                masterProvider={analysis.master_provider as string}
                createdAt={analysis.created_at}
                variant="uxic"
                href={`/dashboard/results/${analysis.id}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
