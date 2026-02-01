interface ScoreCircleProps {
  score?: number;
}

export function ScoreCircle({ score }: ScoreCircleProps) {
  const displayScore = score ?? 0;

  return (
    <div className="relative w-40 h-40 shrink-0">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke="var(--surface-light)"
          strokeWidth="12"
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${displayScore * 4.4} 440`}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold">{score ?? "-"}</span>
        <span className="text-muted text-sm">/ 100</span>
      </div>
    </div>
  );
}
