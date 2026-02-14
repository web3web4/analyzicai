import { createClient } from "@web3web4/shared-platform/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Shield, Github, Code } from "lucide-react";
import { EmptyState } from "@web3web4/shared-platform";
import { AnalysisCard } from "@web3web4/ai-ui-library";

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get all contract analyses
  const { data: analyses } = await supabase
    .from("analyses")
    .select("*")
    .in("source_type", ["code", "github"])
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2 text-white">Audit History</h1>
          <p className="text-gray-400">
            Review your past smart contract analyses and security scores.
          </p>
        </div>

        {!analyses || analyses.length === 0 ? (
          <EmptyState
            variant="solidic"
            icon={<Shield className="h-8 w-8 text-gray-500" />}
            title="No audits found"
            description="You haven't analyzed any smart contracts yet."
            actionLabel="Start First Scan"
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
                sourceIcon={
                  analysis.source_type === "github" ? (
                    <Github className="h-3 w-3" />
                  ) : (
                    <Code className="h-3 w-3" />
                  )
                }
                sourceLabel={
                  analysis.source_type === "github"
                    ? (analysis.repo_info as any)?.url?.replace(
                        "https://github.com/",
                        "",
                      )
                    : "Pasted Contract Code"
                }
                providers={analysis.providers_used || []}
                createdAt={analysis.created_at}
                variant="solidic"
                href={`/dashboard/results/${analysis.id}`}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
