import { DashboardHeader } from "@web3web4/shared-platform/server-components";
import { AnalyzeForm } from "./AnalyzeForm";

export default function AnalyzePage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader theme="uxic" prefix="UXic" />
      <AnalyzeForm />
    </div>
  );
}
