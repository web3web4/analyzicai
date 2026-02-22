import { createClient } from "../supabase/server";
import { NextResponse } from "next/server";

/**
 * Shared handler for `GET /api/analysis-status/[id]`.
 *
 * Fetches the analysis record and its responses from Supabase, calculates
 * overall pipeline progress, and returns a JSON response.  Both solidicai and
 * uxicai route files delegate to this function.
 *
 * @example
 * ```ts
 * // apps/uxicai/src/app/api/analysis-status/[id]/route.ts
 * import { handleAnalysisStatusRequest } from "@web3web4/shared-platform/api-handlers";
 * export { handleAnalysisStatusRequest as GET };
 * ```
 */
export async function handleAnalysisStatusRequest(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: analysis, error: analysisError } = await supabase
      .from("analyses")
      .select("*")
      .eq("id", id)
      .single();

    if (analysisError || !analysis) {
      return NextResponse.json(
        { error: "Analysis not found" },
        { status: 404 },
      );
    }

    const { data: responses } = await supabase
      .from("analysis_responses")
      .select("*")
      .eq("analysis_id", id)
      .order("created_at");

    const v1Responses = responses?.filter((r) => r.step === "v1_initial") ?? [];
    const v2Responses = responses?.filter((r) => r.step === "v2_rethink") ?? [];
    const synthesisResponse = responses?.find((r) => r.step === "v3_synthesis");

    // Step 2 (v2_rethink) is currently skipped by the orchestrator.
    // Total = providers × v1  +  1 synthesis.
    // If v2 responses DO exist (future), they are counted as a bonus.
    const requestedProviders = (analysis.providers_used as string[]) || [];
    const hasV2 = v2Responses.length > 0;
    const totalSteps = hasV2
      ? requestedProviders.length * 2 + 1
      : requestedProviders.length + 1;
    const completedSteps =
      v1Responses.length + v2Responses.length + (synthesisResponse ? 1 : 0);
    const progress = Math.min(
      100,
      Math.round((completedSteps / totalSteps) * 100),
    );

    return NextResponse.json({
      analysis: {
        id: analysis.id,
        status: analysis.status,
        final_score: analysis.final_score,
        created_at: analysis.created_at,
        providers_used: analysis.providers_used,
        master_provider: analysis.master_provider,
      },
      responses: {
        v1Count: v1Responses.length,
        v2Count: v2Responses.length,
        hasSynthesis: !!synthesisResponse,
      },
      progress,
    });
  } catch (error) {
    console.error("[handleAnalysisStatusRequest] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
