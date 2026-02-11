"use client";

import { useMemo, useState } from "react";
import type { Recommendation } from "@web3web4/ai-core";

export interface RecommendationFilters {
  severities: string[];
  categories: string[];
  search: string;
}

export function useFilteredRecommendations(
  recommendations: Recommendation[],
  filters: RecommendationFilters
) {
  return useMemo(() => {
    let filtered = recommendations;

    // Filter by severity
    if (filters.severities.length > 0) {
      filtered = filtered.filter((rec) =>
        filters.severities.includes(rec.severity)
      );
    }

    // Filter by category
    if (filters.categories.length > 0) {
      filtered = filtered.filter((rec) =>
        filters.categories.includes(rec.category)
      );
    }

    // Filter by search
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (rec) =>
          rec.title.toLowerCase().includes(searchLower) ||
          rec.description.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [recommendations, filters]);
}

export function useRecommendationFilters() {
  const [filters, setFilters] = useState<RecommendationFilters>({
    severities: [],
    categories: [],
    search: "",
  });

  const updateFilter = <K extends keyof RecommendationFilters>(
    key: K,
    value: RecommendationFilters[K]
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ severities: [], categories: [], search: "" });
  };

  return { filters, updateFilter, clearFilters };
}
