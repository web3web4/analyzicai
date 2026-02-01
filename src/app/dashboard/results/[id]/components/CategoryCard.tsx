import type { CategoryScore } from "@/lib/ai/types";
import { formatCategoryName, getScoreColorClass, roundScore } from "../lib/utils";
import { ProgressBar } from "./ProgressBar";

interface CategoryCardProps {
  categoryKey: string;
  category: CategoryScore;
}

export function CategoryCard({ categoryKey, category }: CategoryCardProps) {
  const displayScore = roundScore(category.score);
  
  return (
    <div className="p-4 rounded-xl bg-surface-light">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium">{formatCategoryName(categoryKey)}</span>
        <span className={`font-bold ${getScoreColorClass(category.score)}`}>
          {displayScore}
        </span>
      </div>
      <ProgressBar score={category.score} />
      {category.observations?.length > 0 && (
        <ul className="mt-3 space-y-1">
          {category.observations.map((obs, i) => (
            <li key={i} className="text-sm text-muted">
              • {obs}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
