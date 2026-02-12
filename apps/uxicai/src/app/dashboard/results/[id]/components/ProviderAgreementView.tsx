import { AGREEMENT_STYLES } from "../lib/constants";
import { formatCategoryName } from "../lib/utils";

interface ProviderAgreementViewProps {
  agreement: Array<{
    category: string;
    agreement: "high" | "medium" | "low";
  }>;
}

export function ProviderAgreementView({
  agreement,
}: ProviderAgreementViewProps) {
  if (!agreement || agreement.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Provider Agreement</h3>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-success/30" />
            <span className="text-muted">High</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-warning/30" />
            <span className="text-muted">Medium</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-error/30" />
            <span className="text-muted">Low</span>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {agreement.map((item) => {
          const styles = AGREEMENT_STYLES[item.agreement];
          return (
            <div
              key={item.category}
              className={`p-3 rounded-lg ${styles.bg} border border-border`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  {formatCategoryName(item.category)}
                </span>
                <span className={`text-xs font-medium ${styles.text}`}>
                  {item.agreement.toUpperCase()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-sm text-muted">
        Provider agreement indicates how consistently all AI providers scored
        each category. High agreement suggests more reliable assessments.
      </p>
    </div>
  );
}
