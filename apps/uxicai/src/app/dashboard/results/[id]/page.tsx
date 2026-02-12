import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import type { SynthesizedResult } from "@web3web4/ai-core";
import { ResultsHeader } from "./components/ResultsHeader";
import { ScoreOverview } from "./components/ScoreOverview";
import { ResultsContent } from "./components/ResultsContent";
import { StatusBanner, LoadingState } from "@web3web4/ui-library";

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

  // Debug logging (development only)
  if (process.env.NODE_ENV !== "production") {
    console.log("[Results Page] Analysis record:", {
      id: analysis.id,
      has_image_paths: !!analysis.image_paths,
      has_image_path: !!(analysis as any).image_path,
      image_count: analysis.image_count,
    });
  }

  // Get all image URLs (multi-image support)
  // Support both old (image_path) and new (image_paths) schema
  let imagePaths: string[] = [];

  if (analysis.image_paths) {
    imagePaths = analysis.image_paths as string[];
    if (process.env.NODE_ENV !== "production") {
      console.log("[Results Page] Using image_paths:", imagePaths);
    }
  } else if ((analysis as any).image_path) {
    // Fallback for old analyses before migration
    imagePaths = [(analysis as any).image_path];
    if (process.env.NODE_ENV !== "production") {
      console.log("[Results Page] Using legacy image_path:", imagePaths);
    }
  } else {
    console.warn("[Results Page] No image paths found in analysis record!");
  }

  const imageCount = analysis.image_count || imagePaths.length || 1;

  // Get signed URLs (valid for 1 hour) instead of public URLs
  const imageUrls = await Promise.all(
    imagePaths.map(async (path: string) => {
      const { data, error } = await supabase.storage
        .from("analysis-images")
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) {
        console.error(
          `[Results Page] Failed to get signed URL for ${path}:`,
          error,
        );
        return ""; // Return empty string if fetch fails
      }

      return data?.signedUrl || "";
    }),
  );

  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[Results Page] Loaded ${imageUrls.filter((url) => url).length}/${imagePaths.length} image URLs for analysis ${id}`,
    );
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

  // Debug logging (development only)
  if (process.env.NODE_ENV !== "production") {
    console.log("[Results Page] Data Debug:", {
      analysisId: id,
      analysisStatus: analysis.status,
      finalScore: analysis.final_score,
      totalResponses: responses?.length,
      v1ResponsesCount: v1Responses.length,
      v2ResponsesCount: v2Responses.length,
      hasSynthesisResponse: !!synthesisResponse,
      hasFinalResult: !!finalResult,
    });

    if (synthesisResponse) {
      console.log("[Results Page] Synthesis Response:", {
        step: synthesisResponse.step,
        provider: synthesisResponse.provider,
        status: synthesisResponse.status,
        hasResult: !!synthesisResponse.result,
      });
    }

    if (finalResult) {
      console.log("[Results Page] Final Result Structure:", {
        hasRecommendations: !!finalResult.recommendations,
        recommendationsCount: finalResult.recommendations?.length,
        hasCategories: !!finalResult.categories,
        categoriesKeys: finalResult.categories
          ? Object.keys(finalResult.categories)
          : [],
        hasSummary: !!finalResult.summary,
        hasProviderAgreement: !!finalResult.providerAgreement,
      });
    } else {
      console.warn("[Results Page] No final result available!");
      if (v1Responses.length > 0) {
        console.log(
          "[Results Page] V1 Responses available:",
          v1Responses.map((r) => ({
            provider: r.provider,
            step: r.step,
            hasResult: !!r.result,
          })),
        );
      }
    }
  }

  // Determine which providers failed
  const requestedProviders = (analysis.providers_used as string[]) || [];
  const successfulV1Providers = v1Responses.map((r) => r.provider);
  const failedProviders = requestedProviders.filter(
    (p) => !successfulV1Providers.includes(p),
  );

  // All available providers for retry (not just originally requested ones)
  const allAvailableProviders = ["openai", "gemini", "anthropic"];

  // Check if we have partial results (some providers succeeded)
  const hasPartialResults =
    v1Responses.length > 0 &&
    (failedProviders.length > 0 || !synthesisResponse);

  // Check if synthesis failed but we have v1 results
  const synthesisFailed = v1Responses.length > 0 && !synthesisResponse;

  const isPartial = analysis.status === "partial" || hasPartialResults;

  return (
    <div className="min-h-screen bg-background">
      <ResultsHeader />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Status Banner - Updated to show partial results */}
        {analysis.status === "failed" && v1Responses.length === 0 && (
          <StatusBanner
            type="error"
            message="Analysis failed completely. Please try again."
            variant="uxic"
            className="mb-8"
          />
        )}
        {isPartial && (
          <StatusBanner
            type="warning"
            title="Partial Results Available"
            icon={<span className="text-2xl">⚠️</span>}
            message={
              <>
                {failedProviders.length > 0 && (
                  <>Failed providers: {failedProviders.join(", ")}. </>
                )}
                {synthesisFailed && "Synthesis step failed. "}
                Showing results from {v1Responses.length} successful
                provider(s).
              </>
            }
            variant="uxic"
            className="mb-8"
          />
        )}
        {analysis.status !== "completed" &&
          !isPartial &&
          v1Responses.length === 0 && (
            <div className="mb-8">
              <LoadingState
                message={`Analysis in progress: ${analysis.status.replace("step", "Step ")}${imageCount > 1 ? ` (${imageCount} images)` : ""}`}
                variant="uxic"
              />
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
        {finalResult || v1Responses.length > 0 ? (
          <ResultsContent
            finalResult={finalResult}
            v1Responses={v1Responses}
            v2Responses={v2Responses}
            imageUrls={imageUrls}
            imageCount={imageCount}
            analysisId={id}
            failedProviders={failedProviders}
            synthesisFailed={synthesisFailed}
            hasPartialResults={isPartial}
            allProviders={allAvailableProviders}
            masterProvider={analysis.master_provider as string}
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
