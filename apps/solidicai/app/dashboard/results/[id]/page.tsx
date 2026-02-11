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
} from "lucide-react";

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

  // Fetch synthesis response
  const { data: responses } = await supabase
    .from("analysis_responses")
    .select("*")
    .eq("analysis_id", id)
    .eq("step", "v3_synthesis")
    .single();

  const resultData = responses?.result;

  // Fallback if still pending
  if (!resultData && analysis.status === "pending") {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto mt-12 text-center">
          <div className="h-12 w-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold">Analysis in progress...</h2>
          <p className="text-gray-400 mt-2">Please wait or check back later.</p>
        </div>
      </div>
    );
  }

  // If failed
  if (analysis.status === "failed") {
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

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between border-b border-white/10 pb-6">
            <div>
              <h1 className="text-3xl font-bold">Analysis Report</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-sm text-gray-400 font-mono">
                  ID: {analysis.id.slice(0, 8)}
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-sm text-gray-400">
                  {new Date(analysis.created_at).toLocaleString()}
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

          {!resultData ? (
            <div className="p-8 text-center text-gray-400">
              No detailed results available.
            </div>
          ) : (
            <div className="space-y-8">
              {/* Summary */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <h3 className="flex items-center gap-2 font-bold mb-4 text-white">
                  <FileText className="h-5 w-5 text-gray-400" />
                  Executive Summary
                </h3>
                <p className="text-gray-300 leading-relaxed text-sm">
                  {resultData.summary}
                </p>
              </div>

              {/* Security Findings */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-bold text-red-400">
                  <Shield className="h-5 w-5" />
                  Security Vulnerabilities
                </h3>
                {resultData.securityFindings?.map(
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
                {(!resultData.securityFindings ||
                  resultData.securityFindings.length === 0) && (
                  <div className="p-4 border border-green-500/20 bg-green-500/5 rounded-xl text-green-400 text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    No critical vulnerabilities detected.
                  </div>
                )}
              </div>

              {/* Gas Optimizations */}
              <div className="space-y-4">
                <h3 className="flex items-center gap-2 font-bold text-blue-400">
                  <Zap className="h-5 w-5" />
                  Gas Optimizations
                </h3>
                {resultData.gasOptimizations?.map((opt: any, idx: number) => (
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
                {(!resultData.gasOptimizations ||
                  resultData.gasOptimizations.length === 0) && (
                  <div className="p-4 border border-white/10 bg-white/5 rounded-xl text-gray-400 text-sm">
                    No gas optimizations found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
