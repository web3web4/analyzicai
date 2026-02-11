import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/DashboardHeader";
import { FileCode, Github, Code, Shield } from "lucide-react";

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
          <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium mb-2 text-white">
              No audits found
            </h3>
            <p className="text-gray-500 mb-6">
              You haven't analyzed any smart contracts yet.
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
            {analyses.map((analysis) => (
              <Link
                key={analysis.id}
                href={`/dashboard/results/${analysis.id}`}
                className="block rounded-xl bg-white/5 border border-white/10 p-6 transition-all hover:bg-white/10 hover:border-cyan-500/30 group"
              >
                <div className="flex items-center gap-6">
                  {/* Score Badge */}
                  <div className="w-16 h-16 rounded-lg bg-black/40 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-cyan-500/50 transition-colors">
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

                  <div className="text-sm text-gray-500 tabular-nums text-right">
                    <div>
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs opacity-50">
                      {new Date(analysis.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
