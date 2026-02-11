import type { Recommendation } from "@/lib/ai-domains/ux-analysis/types";
import { getSeverityStyles } from "../lib/utils";
import { Badge } from "./Badge";

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const styles = getSeverityStyles(recommendation.severity);

  return (
    <div className={`p-4 rounded-xl border-l-4 ${styles.container}`}>
      <div className="flex items-center gap-2 mb-1">
        <Badge severity={recommendation.severity}>{recommendation.severity}</Badge>
        <span className="text-sm text-muted">{recommendation.category}</span>
      </div>
      <h3 className="font-medium mb-1">{recommendation.title}</h3>
      <p className="text-sm text-muted">{recommendation.description}</p>
    </div>
  );
}
