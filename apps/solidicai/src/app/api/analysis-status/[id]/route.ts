import { createClient } from "@web3web4/shared-platform/supabase/server";
import { NextResponse } from "next/server";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch analysis
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

    // Get all responses for this analysis
    const { data: responses } = await supabase
      .from("analysis_responses")
      .select("*")
      .eq("analysis_id", id)
      .order("created_at");

    const v1Responses = responses?.filter((r) => r.step === "v1_initial") ?? [];
    const v2Responses = responses?.filter((r) => r.step === "v2_rethink") ?? [];
    const synthesisResponse = responses?.find((r) => r.step === "v3_synthesis");

    // Calculate progress
    const requestedProviders = (analysis.providers_used as string[]) || [];
    const totalSteps = requestedProviders.length * 2 + 1; // v1 + v2 + synthesis
    const completedSteps =
      v1Responses.length + v2Responses.length + (synthesisResponse ? 1 : 0);
    const progress = Math.round((completedSteps / totalSteps) * 100);

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
    console.error("[API] Error fetching analysis status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
