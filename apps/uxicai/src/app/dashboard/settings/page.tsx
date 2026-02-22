import { DashboardHeader } from "@web3web4/shared-platform/server-components";
import SettingsPageContent from "@web3web4/shared-platform/pages/SettingsPage";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader theme="uxic" prefix="UXic" />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <SettingsPageContent />
      </main>
    </div>
  );
}
