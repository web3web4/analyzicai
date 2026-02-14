import { createClient } from "@web3web4/shared-platform/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { UXIC_SOURCE_TYPES } from "@web3web4/ai-core";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    // Build query (UI/UX analyses only)
    let query = supabase
      .from("analyses")
      .select("*, analysis_responses(*)")
      .in("source_type", UXIC_SOURCE_TYPES)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (
      status &&
      ["pending", "step1", "step2", "step3", "completed", "failed"].includes(
        status,
      )
    ) {
      query = query.eq("status", status);
    }

    const { data: analyses, error, count } = await query;

    if (error) {
      console.error("History fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch history" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      analyses: analyses || [],
      pagination: {
        limit,
        offset,
        total: count,
        hasMore: (analyses?.length ?? 0) === limit,
      },
    });
  } catch (error) {
    console.error("History error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
