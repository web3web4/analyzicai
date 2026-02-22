import { DashboardHeader } from "@web3web4/shared-platform/server-components";
import { AnalyzeForm } from "./AnalyzeForm";

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <DashboardHeader theme="solidic" prefix="Solidic" />
      <AnalyzeForm />
    </div>
  );
}
