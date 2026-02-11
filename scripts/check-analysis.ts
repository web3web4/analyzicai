import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAnalysis(analysisId: string) {
  console.log(`\n🔍 Checking analysis: ${analysisId}\n`);

  // Get analysis record
  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .single();

  if (analysisError) {
    console.error("❌ Error fetching analysis:", analysisError);
    return;
  }

  console.log("📊 Analysis Record:");
  console.log("  Status:", analysis.status);
  console.log("  Score:", analysis.final_score);
  console.log("  Providers:", analysis.providers_used);
  console.log("  Master Provider:", analysis.master_provider);
  console.log("  Created:", analysis.created_at);
  console.log("  Image Count:", analysis.image_count);

  // Get responses
  const { data: responses, error: responsesError } = await supabase
    .from("analysis_responses")
    .select("*")
    .eq("analysis_id", analysisId)
    .order("created_at");

  if (responsesError) {
    console.error("❌ Error fetching responses:", responsesError);
    return;
  }

  console.log(`\n📝 Analysis Responses (${responses?.length || 0} total):`);

  responses?.forEach((r, idx) => {
    console.log(`\n  Response ${idx + 1}:`);
    console.log("    Step:", r.step);
    console.log("    Provider:", r.provider);
    console.log("    Status:", r.status);
    console.log("    Latency:", r.latency_ms, "ms");
    console.log("    Has Result:", !!r.result);

    if (r.result) {
      const result = r.result as any;
      console.log("    Result Keys:", Object.keys(result));

      if (result.recommendations) {
        console.log("    Recommendations:", result.recommendations?.length);
      }
      if (result.categories) {
        console.log(
          "    Categories:",
          Object.keys(result.categories || {}).length,
        );
      }
      if (result.summary) {
        console.log("    Summary:", result.summary.substring(0, 100) + "...");
      }
    }

    if (r.error) {
      console.log("    Error:", r.error);
    }
  });

  // Focus on synthesis response
  const synthesisResponse = responses?.find((r) => r.step === "v3_synthesis");

  if (synthesisResponse) {
    console.log("\n✅ Synthesis Response Found:");
    const result = synthesisResponse.result as any;
    console.log("  Full Result Structure:", JSON.stringify(result, null, 2));
  } else {
    console.log("\n⚠️  No synthesis response found");
    console.log("  Available steps:", responses?.map((r) => r.step).join(", "));
  }
}

const analysisId = process.argv[2] || "8244a3fe-bbd0-45d4-9668-2d3a121d3754";
checkAnalysis(analysisId).then(() => process.exit(0));
