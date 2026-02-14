import { createClient } from "@web3web4/shared-platform/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FileCode, Github, Code, Shield } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get recent analyses (Contract specific)
  // Filter by source_type to avoid mixing with UXicAI images
  const { data: recentAnalyses } = await supabase
    .from("analyses")
    .select("*")
    .in("source_type", ["code", "github"])
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Get usage stats
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const { count: todayCount } = await supabase
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .in("source_type", ["code", "github"])
    .gte("created_at", today.toISOString())
    .eq("user_id", user.id);

  const remaining = Math.max(0, 10 - (todayCount ?? 0));

  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <DashboardHeader />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Welcome back,{" "}
            <span className="text-brand-web3-cyan">
              {user.email?.split("@")[0]}
            </span>
          </h1>
          <p className="text-gray-400">
            You have {remaining} analyses remaining today.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link
            href="/dashboard/analyze"
            className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-8 transition-all hover:bg-white/10 hover:border-cyan-500/50"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Shield className="h-32 w-32 -rotate-12" />
            </div>
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Code className="h-6 w-6 text-cyan-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">
                New Smart Contract Scan
              </h2>
              <p className="text-gray-400">
                Paste Solidity code or provide a GitHub URL to detect
                vulnerabilities and gas optimizations.
              </p>
            </div>
          </Link>

          <Link
            href="/dashboard/history"
            className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-8 transition-all hover:bg-white/10 hover:border-blue-500/50"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileCode className="h-6 w-6 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-white">
                Audit History
              </h2>
              <p className="text-gray-400">
                Review past security reports and track your contract
                improvements over time.
              </p>
            </div>
          </Link>
        </div>

        {/* Recent Analyses */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-white">
            Recent Audits
          </h2>

          {!recentAnalyses || recentAnalyses.length === 0 ? (
            <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-medium mb-2 text-white">
                No audits yet
              </h3>
              <p className="text-gray-500 mb-6">
                Start your first smart contract analysis to secure your code.
              </p>
              <Link
                href="/dashboard/analyze"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium inline-block hover:opacity-90 transition-opacity"
              >
                Start First Scan
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAnalyses.map((analysis) => (
                <Link
                  key={analysis.id}
                  href={`/dashboard/results/${analysis.id}`}
                  className="block rounded-xl bg-white/5 border border-white/10 p-6 transition-all hover:bg-white/10 hover:border-cyan-500/30"
                >
                  <div className="flex items-center gap-6">
                    {/* Score Badge */}
                    <div className="w-16 h-16 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
                      {analysis.status === "completed" ? (
                        <span
                          className={`text-2xl font-bold ${
                            (analysis.final_score ?? 0) >= 80
                              ? "text-green-400"
                              : (analysis.final_score ?? 0) >= 60
                                ? "text-yellow-400"
                                : "text-red-400"
                          }`}
                        >
                          {analysis.final_score ?? "-"}
                        </span>
                      ) : (
                        <span className="text-gray-500">...</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="flex items-center gap-1 text-sm font-medium text-cyan-400 capitalize bg-cyan-500/10 px-2 py-0.5 rounded">
                          {analysis.source_type === "github" ? (
                            <Github className="h-3 w-3" />
                          ) : (
                            <Code className="h-3 w-3" />
                          )}
                          {analysis.source_type}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            analysis.status === "completed"
                              ? "bg-green-500/20 text-green-400"
                              : analysis.status === "failed"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {analysis.status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-300 font-mono truncate mb-1">
                        {analysis.source_type === "github"
                          ? (analysis.repo_info as any)?.url?.replace(
                              "https://github.com/",
                              "",
                            )
                          : "Pasted Contract Code"}
                      </div>

                      <p className="text-xs text-gray-500 truncate">
                        Providers: {analysis.providers_used?.join(", ")}
                      </p>
                    </div>

                    <div className="text-sm text-gray-500 tabular-nums">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
