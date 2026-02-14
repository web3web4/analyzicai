import { DashboardHeader } from "@/components/DashboardHeader";
import SettingsPageContent from "@web3web4/shared-platform/pages/SettingsPage";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-cyan-500/30">
      <DashboardHeader />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <SettingsPageContent />
      </main>
    </div>
  );
}
