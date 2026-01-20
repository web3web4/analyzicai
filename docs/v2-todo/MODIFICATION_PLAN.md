# V2 Modification Plan - Enhanced AI Analysis Pipeline

## Overview

This document outlines the planned modifications to upgrade the UXicAI analysis pipeline from v1 to v2, introducing two major enhancements:
1. **Multi-Sampling Strategy** - Leverage LLM non-determinism through ensemble analysis
2. **Iterative Refinement Loops** - Enable deep deliberation through multiple rethink cycles

---

## Modification 1: Multi-Sampling Strategy

### Current Behavior (v1)
- Each provider is called exactly once per step
- Single response per provider is used for analysis

### New Behavior (v2)
- Users configure how many times to sample each provider
- Multiple responses from the same provider are aggregated
- Ensemble methods identify high-confidence vs. uncertain observations

### Implementation Tasks

#### 1.1 Update Type Definitions
**File:** `src/lib/ai/types.ts`

```typescript
// Add new configuration types
export interface ProviderSampleConfig {
  name: AIProvider;
  samples: number;          // How many times to call this provider
  temperature?: number;     // Optional temperature variation
}

export interface AnalysisConfig {
  providers: ProviderSampleConfig[];  // Changed from AIProvider[]
  masterProvider: AIProvider;
  masterSamples?: number;   // Optional: sample master provider multiple times too
}
```

#### 1.2 Update Orchestrator
**File:** `src/lib/ai/orchestrator.ts`

- Modify `runPipeline()` to handle provider sampling
- Implement ensemble aggregation logic:
  - Average scores across samples
  - Merge observations (identify repeated vs. unique)
  - Calculate confidence metrics (variance, agreement)
- Store all sample results in database

**New method:**
```typescript
private async sampleProvider(
  provider: BaseAIProvider,
  imageBase64: string,
  systemPrompt: string,
  userPrompt: string,
  samples: number
): Promise<{
  aggregatedResult: AnalysisResult;
  individualSamples: AnalysisResult[];
  confidence: ConfidenceMetrics;
}>
```

#### 1.3 Database Schema Updates
**File:** `supabase/migrations/003_multi_sampling.sql`

```sql
-- Add support for storing individual samples
ALTER TABLE analysis_responses ADD COLUMN sample_index INTEGER DEFAULT 1;
ALTER TABLE analysis_responses ADD COLUMN is_aggregated BOOLEAN DEFAULT false;

-- Add confidence metrics
ALTER TABLE analysis_responses ADD COLUMN confidence_score NUMERIC;
ALTER TABLE analysis_responses ADD COLUMN score_variance NUMERIC;

-- Update indexes
CREATE INDEX idx_responses_sample ON analysis_responses(analysis_id, step, sample_index);
```

#### 1.4 UI Updates
**Files:** 
- `src/app/dashboard/analyze/page.tsx` - Add sample count input per provider
- `src/app/dashboard/results/[id]/page.tsx` - Display confidence metrics

---

## Modification 2: Iterative Refinement Loops

### Current Behavior (v1)
- Rethink step (Step 2) executes exactly once
- 3 steps total: Initial → Rethink → Synthesis

### New Behavior (v2)
- Rethink step can repeat N times (user-configurable)
- Each iteration builds on all previous results
- Convergence detection stops early if scores stabilize

### Implementation Tasks

#### 2.1 Update Type Definitions
**File:** `src/lib/ai/types.ts`

```typescript
export interface AnalysisConfig {
  providers: ProviderSampleConfig[];
  masterProvider: AIProvider;
  masterSamples?: number;
  maxRethinkIterations?: number;  // New: default 1 (v1 behavior)
  convergenceThreshold?: number;  // New: stop if score delta < threshold
}

// Update step type to support iterations
export type AnalysisStep = 
  | 'v1_initial' 
  | `v2_rethink_r${number}`  // v2_rethink_r1, v2_rethink_r2, etc.
  | 'v3_synthesis';
```

#### 2.2 Update Orchestrator
**File:** `src/lib/ai/orchestrator.ts`

- Modify `runPipeline()` to support iteration loop
- Implement convergence detection:
  - Calculate score deltas between iterations
  - Stop if all providers converge below threshold
- Pass all previous iteration results to each new iteration

**New method:**
```typescript
private hasConverged(
  previousResults: Map<AIProvider, AnalysisResult>,
  currentResults: Map<AIProvider, AnalysisResult>,
  threshold: number
): boolean
```

#### 2.3 Database Schema Updates
**File:** `supabase/migrations/004_iterative_refinement.sql`

```sql
-- Update step column to support iteration numbers
ALTER TABLE analysis_responses 
  ALTER COLUMN step TYPE TEXT;

-- Add iteration metrics
ALTER TABLE analyses ADD COLUMN rethink_iterations INTEGER DEFAULT 1;
ALTER TABLE analyses ADD COLUMN converged BOOLEAN DEFAULT false;
ALTER TABLE analyses ADD COLUMN convergence_delta NUMERIC;

-- Track iteration history
CREATE TABLE iteration_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  iteration_number INTEGER NOT NULL,
  avg_score_delta NUMERIC,
  max_score_delta NUMERIC,
  converged BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.4 UI Updates
**Files:**
- `src/app/dashboard/analyze/page.tsx` - Add iteration count slider
- `src/app/dashboard/results/[id]/page.tsx` - Show iteration history and convergence

---

## Combined Configuration Example

```typescript
const config: AnalysisConfig = {
  providers: [
    { name: 'openai', samples: 1 },      // Call GPT 1 time per step
    { name: 'gemini', samples: 1 },      // Call Gemini 1 time per step
    { name: 'claude', samples: 2 }       // Call Claude 2 times per step
  ],
  masterProvider: 'claude',              // User selects Claude as master
  maxRethinkIterations: 3,
  convergenceThreshold: 2.0
};
```

---

## Implementation Phases

### Phase 1: Multi-Sampling (Estimated: 2-3 days)
- [ ] Update type definitions
- [ ] Implement ensemble aggregation logic
- [ ] Create database migration
- [ ] Update orchestrator
- [ ] Add UI controls
- [ ] Test with multiple samples

### Phase 2: Iterative Refinement (Estimated: 2-3 days)
- [ ] Update type definitions for iterations
- [ ] Implement iteration loop in orchestrator
- [ ] Create convergence detection
- [ ] Create database migration
- [ ] Update UI to show iteration history
- [ ] Test with multiple iterations

### Phase 3: Integration & Testing (Estimated: 1-2 days)
- [ ] Test combined features (multi-sampling + iterations)
- [ ] Performance optimization (parallel sampling)
- [ ] Cost analysis and budget controls
- [ ] Documentation updates
- [ ] User acceptance testing

---

## Breaking Changes

### API Changes
- `AnalysisConfig.providers` changes from `AIProvider[]` to `ProviderSampleConfig[]`
- Backward compatibility: Auto-convert `AIProvider[]` to `{ name, samples: 1 }[]`

### Database Changes
- `analysis_responses.step` column changes from ENUM to TEXT
- Migration handles existing data automatically
- New columns are optional (NULL allowed)

---

## Performance Considerations

### Token Usage
- Multi-sampling increases token usage linearly with sample count
- Example: 3 providers × 3 samples × 3 iterations = 27 API calls vs. 3 in v1
- Mitigation: Add budget controls and cost estimation UI

### Latency
- Samples can be parallelized (no dependency between samples)
- Iterations are sequential (dependent on previous results)
- Estimated latency: ~30s for 3 samples × 3 iterations (with parallelization)

### Database
- Storage increases with samples and iterations
- Add retention policies for old analyses
- Consider archiving sample-level data after N days

---

## Cost-Benefit Analysis

### Benefits
- **Quality**: Higher confidence, reduced variance, deeper insights
- **Reliability**: Catch edge cases and ambiguous areas
- **Flexibility**: Users control cost vs. quality trade-off

### Costs
- **API Costs**: 3-9x increase depending on configuration
- **Latency**: 2-5x increase for iterations
- **Storage**: 3-9x increase in database

### Recommendation
- Default: 1 sample, 1 iteration (v1 behavior) - **Free tier**
- Premium: 2-3 samples, 2 iterations - **Pro tier ($)**
- Power: 3+ samples, 3+ iterations - **Enterprise tier ($$$)**

---

## Next Steps

1. Review this plan with stakeholders
2. Create detailed technical specs for each phase
3. Set up feature flags for gradual rollout
4. Begin Phase 1 implementation
5. Monitor costs and quality metrics during beta
