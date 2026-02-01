"use client";

import type { CategoryScore } from "@/lib/ai/types";
import { CategoryCard } from "./CategoryCard";
import { CategoryRadarChart } from "./CategoryRadarChart";
import { ProviderAgreementView } from "./ProviderAgreementView";

interface CategorySectionProps {
  categories: Record<string, CategoryScore>;
  providerAgreement?: Array<{
    category: string;
    agreement: "high" | "medium" | "low";
  }>;
}

export function CategorySection({
  categories,
  providerAgreement,
}: CategorySectionProps) {
  return (
    <div className="space-y-8">
      {/* Radar Chart */}
      <div className="glass-card rounded-2xl p-8">
        <h3 className="text-lg font-semibold mb-4">Category Overview</h3>
        <CategoryRadarChart categories={categories} />
      </div>

      {/* Provider Agreement */}
      {providerAgreement && providerAgreement.length > 0 && (
        <div className="glass-card rounded-2xl p-8">
          <ProviderAgreementView agreement={providerAgreement} />
        </div>
      )}

      {/* Category Details */}
      <div className="glass-card rounded-2xl p-8">
        <h3 className="text-lg font-semibold mb-6">Category Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {Object.entries(categories).map(([key, category]) => (
            <CategoryCard key={key} categoryKey={key} category={category} />
          ))}
        </div>
      </div>
    </div>
  );
}
