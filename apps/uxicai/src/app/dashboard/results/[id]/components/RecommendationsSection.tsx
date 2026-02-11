"use client";

import { useState } from "react";
import type { Recommendation } from "@web3web4/ai-core";
import { RecommendationCard } from "./RecommendationCard";
import {
  useFilteredRecommendations,
  useRecommendationFilters,
} from "../lib/hooks";
import { SEVERITY_ORDER } from "../lib/constants";
import { groupRecommendations, sortRecommendationsBySeverity } from "../lib/utils";

interface RecommendationsSectionProps {
  recommendations: Recommendation[];
}

export function RecommendationsSection({
  recommendations,
}: RecommendationsSectionProps) {
  const { filters, updateFilter, clearFilters } = useRecommendationFilters();
  const filteredRecs = useFilteredRecommendations(recommendations, filters);
  const [groupBy, setGroupBy] = useState<"none" | "category" | "severity">("severity");

  const hasActiveFilters =
    filters.severities.length > 0 ||
    filters.categories.length > 0 ||
    filters.search.trim() !== "";

  const toggleSeverityFilter = (severity: string) => {
    const current = filters.severities;
    const updated = current.includes(severity)
      ? current.filter((s) => s !== severity)
      : [...current, severity];
    updateFilter("severities", updated);
  };

  const renderRecommendations = () => {
    if (groupBy === "none") {
      const sorted = sortRecommendationsBySeverity(filteredRecs);
      return (
        <div className="space-y-4">
          {sorted.map((rec, i) => (
            <RecommendationCard key={i} recommendation={rec} />
          ))}
        </div>
      );
    }

    const grouped = groupRecommendations(filteredRecs, groupBy);
    const sortedKeys =
      groupBy === "severity"
        ? SEVERITY_ORDER.filter((s) => grouped[s])
        : Object.keys(grouped).sort();

    return (
      <div className="space-y-6">
        {sortedKeys.map((key) => (
          <div key={key}>
            <h4 className="font-semibold mb-3 capitalize">
              {key} ({grouped[key].length})
            </h4>
            <div className="space-y-4">
              {grouped[key].map((rec, i) => (
                <RecommendationCard key={i} recommendation={rec} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search recommendations..."
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-surface-light border border-border text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted self-center">Filter by:</span>
          {SEVERITY_ORDER.map((severity) => (
            <button
              key={severity}
              onClick={() => toggleSeverityFilter(severity)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                filters.severities.includes(severity)
                  ? "bg-primary text-white"
                  : "bg-surface-light text-muted hover:bg-surface"
              }`}
            >
              {severity}
            </button>
          ))}

          {/* Group By */}
          <div className="ml-auto flex gap-2">
            <span className="text-sm text-muted self-center">Group by:</span>
            <select
              value={groupBy}
              onChange={(e) =>
                setGroupBy(e.target.value as "none" | "category" | "severity")
              }
              className="px-3 py-1 rounded text-sm bg-surface-light border border-border text-foreground"
            >
              <option value="none">None</option>
              <option value="severity">Severity</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-primary hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted">
        Showing {filteredRecs.length} of {recommendations.length}{" "}
        recommendations
      </div>

      {/* Recommendations List */}
      {filteredRecs.length > 0 ? (
        renderRecommendations()
      ) : (
        <div className="text-center py-12">
          <p className="text-muted">No recommendations match your filters</p>
        </div>
      )}
    </div>
  );
}
