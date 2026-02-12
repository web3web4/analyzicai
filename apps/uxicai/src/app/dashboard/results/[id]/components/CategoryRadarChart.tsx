"use client";

import { useEffect, useRef, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis } from "recharts";
import type { CategoryScore } from "@web3web4/ai-core";
import { formatCategoryName } from "../lib/utils";

interface CategoryRadarChartProps {
  categories: Record<string, CategoryScore>;
}

export function CategoryRadarChart({ categories }: CategoryRadarChartProps) {
  const data = Object.entries(categories).map(([key, category]) => ({
    category: formatCategoryName(key),
    score: category.score,
  }));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 360, height: 360 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const rect = entry.contentRect;
        // ensure positive integer sizes for Recharts
        const w = Math.max(1, Math.floor(rect.width));
        const h = Math.max(1, Math.floor(rect.height));
        setSize({ width: w, height: h });
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[400px] flex items-center justify-center"
      style={{ minWidth: 0 }}
    >
      <RadarChart width={size.width} height={size.height} data={data}>
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="category" tick={{ fill: "var(--muted)", fontSize: 12 }} />
        <Radar name="Score" dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.6} />
      </RadarChart>
    </div>
  );
}
