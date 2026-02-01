import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { SynthesizedResult } from "@/lib/ai/types";
import { ResultsHeader } from "./components/ResultsHeader";
import { ScoreOverview } from "./components/ScoreOverview";
import { ResultsContent } from "./components/ResultsContent";

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

  // Get all image URLs (multi-image support)
  const imagePaths = (analysis.image_paths as string[]) || [];
  const imageCount = analysis.image_count || imagePaths.length || 1;
  
  const imageUrls = imagePaths.map((path: string) => {
    const { data } = supabase.storage
      .from("analysis-images")
      .getPublicUrl(path);
    return data.publicUrl;
  });

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
      <ResultsHeader />

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
                  {imageCount > 1 && ` (${imageCount} images)`}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Score Overview */}
        <div className="mb-8">
          <ScoreOverview
            score={analysis.final_score}
            createdAt={analysis.created_at}
            providers={analysis.providers_used || []}
            finalResult={finalResult}
            responses={responses || []}
            imageCount={imageCount}
          />
        </div>

        {/* Main Content with Tabs */}
        {finalResult ? (
          <ResultsContent
            finalResult={finalResult}
            v1Responses={v1Responses}
            v2Responses={v2Responses}
            imageUrls={imageUrls}
            imageCount={imageCount}
          />
        ) : (
          /* Empty State for Pending */
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
