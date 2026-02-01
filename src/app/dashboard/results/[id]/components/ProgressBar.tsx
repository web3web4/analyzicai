import { getScoreColorClass, getScoreColor } from "../lib/utils";

interface ProgressBarProps {
  score: number;
  showLabel?: boolean;
}

export function ProgressBar({ score, showLabel = false }: ProgressBarProps) {
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm font-medium ${getScoreColorClass(score)}`}>
            {score}
          </span>
        </div>
      )}
      <div className="h-2 bg-surface rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{ 
            width: `${score}%`,
            backgroundColor: getScoreColor(score)
          }}
        />
      </div>
    </div>
  );
}
