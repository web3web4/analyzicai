import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import Link from "next/link";
import {
  ArrowLeft,
  Shield,
  FileText,
  CheckCircle,
  Zap,
  Code,
  AlertTriangle,
} from "lucide-react";
import { LoadingState, StatusBanner, RetryPanel } from "@web3web4/ui-library";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch analysis
  const { data: analysis } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();

  if (!analysis) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Analysis not found</h1>
          <Link href="/dashboard" className="text-cyan-400 hover:underline">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Get all responses for this analysis (similar to UXicAI)
  const { data: responses } = await supabase
    .from("analysis_responses")
    .select("*")
    .eq("analysis_id", id)
    .order("created_at");

  const v1Responses = responses?.filter((r) => r.step === "v1_initial") ?? [];
  const v2Responses = responses?.filter((r) => r.step === "v2_rethink") ?? [];
  const synthesisResponse = responses?.find((r) => r.step === "v3_synthesis");

  const resultData = synthesisResponse?.result;

  // Debug logging
  if (process.env.NODE_ENV !== "production") {
    console.log("[SolidicAI Results] Debug info:", {
      analysisId: id,
      v1ResponsesCount: v1Responses.length,
      v2ResponsesCount: v2Responses.length,
      hasSynthesis: !!synthesisResponse,
      resultData: resultData,
      resultDataKeys: resultData ? Object.keys(resultData) : [],
      hasSummary: !!resultData?.summary,
      hasRecommendations: !!resultData?.recommendations,
      recommendationsLength: resultData?.recommendations?.length || 0,
      hasSecurityFindings: !!resultData?.securityFindings,
      securityFindingsLength: resultData?.securityFindings?.length || 0,
      hasGasOptimizations: !!resultData?.gasOptimizations,
      gasOptimizationsLength: resultData?.gasOptimizations?.length || 0,
      v1Providers: v1Responses.map((r) => r.provider),
    });
    console.log("[SolidicAI Results] Synthesis Response:", synthesisResponse);
    console.log("[SolidicAI Results] Providers Used:", analysis.providers_used);
  }

  // Determine which providers failed
  const requestedProviders = (analysis.providers_used as string[]) || [];
  const successfulV1Providers = v1Responses.map((r) => r.provider);
  const failedProviders = requestedProviders.filter(
    (p) => !successfulV1Providers.includes(p),
  );

  // All available providers for retry (not just originally requested ones)
  const allAvailableProviders = ["openai", "gemini", "anthropic"];

  // Check if we have partial results
  // Only consider synthesis failed if status indicates failure AND we have v1 responses but no synthesis
  const synthesisFailed =
    v1Responses.length > 0 &&
    !synthesisResponse &&
    analysis.status !== "completed";
  const hasPartialResults =
    v1Responses.length > 0 &&
    (failedProviders.length > 0 || synthesisFailed);
  const isPartial = analysis.status === "partial" || hasPartialResults;

  console.log("[Results Page] Computed states:", {
    synthesisFailed,
    hasPartialResults,
    isPartial,
  });

  // Fallback if still pending
  if (!resultData && analysis.status === "pending") {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <div className="mb-4">
            <LoadingState message="Analysis in progress..." variant="solidic" />
          </div>
          <p className="text-gray-400 mt-2">Please wait or check back later.</p>
        </div>
      </div>
    );
  }

  // If completely failed
  if (analysis.status === "failed" && v1Responses.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <div className="h-16 w-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-red-500">Analysis Failed</h2>
          <p className="text-gray-400 mt-2">
            Something went wrong during the analysis.
          </p>
          <Link
            href="/dashboard/analyze"
            className="mt-6 inline-block px-6 py-2 bg-white/10 rounded-lg hover:bg-white/20"
          >
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>

        {/* Status Banners */}
        {isPartial && (
          <StatusBanner
            type="warning"
            title="Partial Results Available"
            icon={<AlertTriangle className="h-5 w-5" />}
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
            variant="solidic"
            className="mb-8"
          />
        )}

        {/* Retry Panel - Show only if there are actual failures to retry */}
        {(failedProviders.length > 0 || synthesisFailed) && (
          <RetryPanel
            analysisId={id}
            failedProviders={failedProviders}
            synthesisFailed={synthesisFailed}
            allProviders={allAvailableProviders}
            masterProvider={analysis.master_provider as string}
            variant="solidic"
            codeSize={analysis.input_context?.length || 0}
            showTruncationOption={true}
          />
        )}

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header with Score */}
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <h1 className="text-3xl font-bold">Security Audit Report</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-400 font-mono">
                  ID: {analysis.id.slice(0, 8)}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">
                  {new Date(analysis.created_at).toLocaleString()}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">
                  {requestedProviders.length} AI Provider
                  {requestedProviders.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-4xl font-bold ${
                  (analysis.final_score ?? 0) >= 80
                    ? "text-green-400"
                    : (analysis.final_score ?? 0) >= 60
                      ? "text-yellow-400"
                      : "text-red-400"
                }`}
              >
                {analysis.final_score ?? 0}/100
              </div>
              <div className="text-xs uppercase tracking-wider text-gray-500">
                Safety Score
              </div>
            </div>
          </div>

          {!resultData && v1Responses.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              No detailed results available.
            </div>
          ) : (
            <div className="space-y-8">
              {/* Show message if synthesis failed but we have v1 results */}
              {!resultData && v1Responses.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-yellow-300 mb-1">
                        Partial Results Available
                      </h3>
                      <p className="text-sm text-gray-300">
                        The synthesis step did not complete, but individual provider analyses are available below. 
                        You can retry the synthesis using the retry panel above.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {/* Summary */}
              {resultData?.summary && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="flex items-center gap-2 font-bold mb-4 text-white">
                    <FileText className="h-5 w-5 text-gray-400" />
                    Executive Summary
                  </h3>
                  <p className="text-gray-300 leading-relaxed text-sm">
                    {resultData.summary}
                  </p>
                </div>
              )}

              {/* Recommendations (if available from synthesis) */}
              {resultData?.recommendations &&
                resultData.recommendations.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="flex items-center gap-2 font-bold text-cyan-400">
                      <Code className="h-5 w-5" />
                      Key Recommendations
                    </h3>
                    <div className="grid gap-4">
                      {resultData.recommendations.map(
                        (rec: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold">
                                  {idx + 1}
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold text-cyan-300 mb-1">
                                  {rec.title}
                                </h4>
                                <p className="text-sm text-gray-400 mb-2">
                                  {rec.description}
                                </p>
                                {rec.priority && (
                                  <span
                                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                      rec.priority === "high"
                                        ? "bg-red-500/20 text-red-400"
                                        : rec.priority === "medium"
                                          ? "bg-yellow-500/20 text-yellow-400"
                                          : "bg-green-500/20 text-green-400"
                                    }`}
                                  >
                                    {rec.priority} priority
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}

              {/* Security Findings */}
              {resultData && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-bold text-red-400">
                    <Shield className="h-5 w-5" />
                    Security Vulnerabilities
                  </h3>
                  {resultData?.securityFindings?.map(
                    (finding: any, idx: number) => (
                    <div
                      key={idx}
                      className="bg-red-500/5 border border-red-500/20 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-red-300">
                          {finding.title}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            finding.severity === "critical"
                              ? "bg-red-500 text-white"
                              : finding.severity === "high"
                                ? "bg-orange-500 text-white"
                                : "bg-yellow-500/20 text-yellow-500"
                          }`}
                        >
                          {finding.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-3">
                        {finding.description}
                      </p>
                      {finding.snippet && (
                        <div className="bg-black/50 rounded p-2 font-mono text-xs text-red-200/70">
                          Line {finding.line}: {finding.snippet}
                        </div>
                      )}
                    </div>
                  ),
                )}
                  {(!resultData?.securityFindings ||
                    resultData.securityFindings.length === 0) && (
                    <div className="p-4 border border-green-500/20 bg-green-500/5 rounded-xl text-green-400 text-sm flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      No critical vulnerabilities detected.
                    </div>
                  )}
                </div>
              )}

              {/* Gas Optimizations */}
              {resultData && (
                <div className="space-y-4">
                  <h3 className="flex items-center gap-2 font-bold text-blue-400">
                    <Zap className="h-5 w-5" />
                    Gas Optimizations
                  </h3>
                  {resultData?.gasOptimizations?.map((opt: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4"
                  >
                    <h4 className="font-bold text-blue-300 mb-1">
                      {opt.title}
                    </h4>
                    <p className="text-sm text-gray-400 mb-2">
                      {opt.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-blue-400/70 font-mono">
                      <span>Est. Savings: {opt.estimatedSavings}</span>
                    </div>
                  </div>
                ))}
                  {(!resultData?.gasOptimizations ||
                    resultData.gasOptimizations.length === 0) && (
                    <div className="p-4 border border-white/10 bg-white/5 rounded-xl text-gray-400 text-sm">
                      No gas optimizations found.
                    </div>
                  )}
                </div>
              )}

              {/* Provider Details (if we have v1 responses) */}
              {v1Responses.length > 0 && (
                <div className="space-y-6">
                  <h3 className="flex items-center gap-2 font-bold text-white">
                    <Code className="h-5 w-5 text-gray-400" />
                    {!resultData ? "Provider Analysis Results" : "Provider Analysis Details"}
                  </h3>
                  
                  {/* Provider Comparison Table */}
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h4 className="font-bold text-sm text-gray-400 mb-4">Provider Comparison</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">
                              Provider
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                              Score
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                              Recommendations
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                              Tokens
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">
                              Latency
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {v1Responses.map((response) => {
                            const providerResult = response.result as any;
                            return (
                              <tr
                                key={response.id}
                                className="border-b border-white/5"
                              >
                                <td className="py-3 px-4 font-medium capitalize text-white">
                                  {response.provider}
                                </td>
                                <td className="py-3 px-4 text-center text-xl font-bold text-cyan-400">
                                  {providerResult?.overallScore ?? 0}
                                </td>
                                <td className="py-3 px-4 text-center text-gray-300">
                                  {providerResult?.recommendations?.length || 0}
                                </td>
                                <td className="py-3 px-4 text-center text-gray-400">
                                  {response.tokens_used?.toLocaleString() || "-"}
                                </td>
                                <td className="py-3 px-4 text-center text-gray-400">
                                  {response.latency_ms ? `${(response.latency_ms / 1000).toFixed(2)}s` : "-"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Individual Provider Cards */}
                  <div>
                    <h4 className="font-bold text-sm text-gray-400 mb-4">Step 1: Initial Analysis</h4>
                    <div className="space-y-4">
                      {v1Responses.map((response, idx) => {
                        const providerResult = response.result as any;
                        return (
                          <div
                            key={idx}
                            className="bg-white/5 border border-white/10 rounded-xl p-6"
                          >
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10">
                              <div>
                                <h5 className="font-bold text-white capitalize text-lg">
                                  {response.provider}
                                </h5>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(response.created_at).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-3xl font-bold text-cyan-400">
                                  {providerResult?.overallScore ?? 0}
                                </div>
                                <div className="text-xs text-gray-400">Overall Score</div>
                              </div>
                            </div>

                            {/* Summary */}
                            {providerResult?.summary && (
                              <div className="mb-6">
                                <h6 className="text-sm font-bold text-gray-300 mb-2">Summary</h6>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                  {providerResult.summary}
                                </p>
                              </div>
                            )}

                            {/* Security Findings */}
                            {providerResult?.securityFindings && providerResult.securityFindings.length > 0 && (
                              <div className="mb-6">
                                <h6 className="text-sm font-bold text-red-400 mb-3 flex items-center gap-2">
                                  <Shield className="h-4 w-4" />
                                  Security Findings ({providerResult.securityFindings.length})
                                </h6>
                                <div className="space-y-3">
                                  {providerResult.securityFindings.map((finding: any, fIdx: number) => (
                                    <div key={fIdx} className="bg-red-500/5 border border-red-500/20 rounded-lg p-3">
                                      <div className="flex items-start justify-between mb-1">
                                        <h6 className="font-medium text-red-300 text-sm">{finding.title}</h6>
                                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                          finding.severity === "critical"
                                            ? "bg-red-500 text-white"
                                            : finding.severity === "high"
                                              ? "bg-orange-500 text-white"
                                              : "bg-yellow-500/20 text-yellow-500"
                                        }`}>
                                          {finding.severity}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-400">{finding.description}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Gas Optimizations */}
                            {providerResult?.gasOptimizations && providerResult.gasOptimizations.length > 0 && (
                              <div className="mb-6">
                                <h6 className="text-sm font-bold text-blue-400 mb-3 flex items-center gap-2">
                                  <Zap className="h-4 w-4" />
                                  Gas Optimizations ({providerResult.gasOptimizations.length})
                                </h6>
                                <div className="space-y-3">
                                  {providerResult.gasOptimizations.map((opt: any, oIdx: number) => (
                                    <div key={oIdx} className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                                      <h6 className="font-medium text-blue-300 text-sm mb-1">{opt.title}</h6>
                                      <p className="text-xs text-gray-400 mb-1">{opt.description}</p>
                                      {opt.estimatedSavings && (
                                        <span className="text-xs text-blue-400/70 font-mono">
                                          Est. Savings: {opt.estimatedSavings}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Recommendations */}
                            {providerResult?.recommendations && providerResult.recommendations.length > 0 && (
                              <div className="mb-6">
                                <h6 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                                  <Code className="h-4 w-4" />
                                  Recommendations ({providerResult.recommendations.length})
                                </h6>
                                <div className="space-y-3">
                                  {providerResult.recommendations.map((rec: any, rIdx: number) => (
                                    <div key={rIdx} className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3">
                                      <div className="flex items-start gap-2">
                                        <div className="w-5 h-5 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 text-xs font-bold flex-shrink-0">
                                          {rIdx + 1}
                                        </div>
                                        <div className="flex-1">
                                          <h6 className="font-medium text-cyan-300 text-sm mb-1">{rec.title}</h6>
                                          <p className="text-xs text-gray-400 mb-1">{rec.description}</p>
                                          {rec.priority && (
                                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                              rec.priority === "high"
                                                ? "bg-red-500/20 text-red-400"
                                                : rec.priority === "medium"
                                                  ? "bg-yellow-500/20 text-yellow-400"
                                                  : "bg-green-500/20 text-green-400"
                                            }`}>
                                              {rec.priority} priority
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center gap-4 text-xs text-gray-500 pt-4 border-t border-white/10">
                              <span>Tokens: {response.tokens_used?.toLocaleString() || "-"}</span>
                              <span>•</span>
                              <span>Latency: {response.latency_ms ? `${(response.latency_ms / 1000).toFixed(2)}s` : "-"}</span>
                              <span>•</span>
                              <span className="text-green-400 font-medium">✓ Success</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
