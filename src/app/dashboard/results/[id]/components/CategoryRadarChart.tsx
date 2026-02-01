"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { CategoryScore } from "@/lib/ai/types";
import { formatCategoryName } from "../lib/utils";

interface CategoryRadarChartProps {
  categories: Record<string, CategoryScore>;
}

export function CategoryRadarChart({ categories }: CategoryRadarChartProps) {
  const data = Object.entries(categories).map(([key, category]) => ({
    category: formatCategoryName(key),
    score: category.score,
  }));

  return (
    <div className="w-full h-[400px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "var(--muted)" }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
