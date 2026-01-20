# AI Analysis Pipeline V2 - Enhanced Architecture

## Overview

Version 2 of the UXicAI analysis pipeline introduces two major enhancements that dramatically improve analysis quality and reliability:

1. **Multi-Sampling Strategy** - Call the same LLM multiple times to leverage non-determinism
2. **Iterative Refinement Loops** - Enable deep deliberation through repeated rethink cycles

![AI Analysis Pipeline V2](./ai-pipeline-v2.png)

---

## Architecture Changes from V1

### V1 (Current)
- Each provider called **once** per step
- **Single** rethink iteration
- **3 total steps**: Initial → Rethink → Synthesis
- Aggregation happens in synthesis only

### V2 (Enhanced)
- Each provider called **N times** per step (multi-sampling)
- **Multiple** rethink iterations (up to convergence)
- **3 + (N-1) steps**: Initial → Rethink₁ → Rethink₂ → ... → Rethinkₙ → Synthesis
- **Critical difference**: No aggregation in Steps 1-2, only individual results stored
- **Single aggregation point**: Master provider aggregates all results in Step 3 only

**Key Philosophy:** Preserve all individual analyses until final synthesis to avoid information loss from premature averaging.

---

## Enhanced Three-Step Process

### Step 1: Initial Analysis (Multi-Sampling, No Aggregation)
**Purpose:** Generate diverse independent evaluations

**Flow:**
1. User uploads screenshot
2. Call **all LLM models in parallel**, where each model can be called **x times**:
   - OpenAI GPT: **1 call** → 1 v1 analysis
   - Google Gemini: **1 call** → 1 v1 analysis
   - Anthropic Claude: **2 calls** → 2 separate v1 analyses
3. Each call receives:
   - The initial prompt
   - The website screenshot/materials
4. **NO aggregation** at this step - store all individual responses as-is
5. Total outputs: 4 individual v1 analysis results (1 + 1 + 2)

**Output:** 
- Raw v1 results from all model calls
- No aggregation or confidence calculation yet
- Each analysis is independent and stored separately

**Configuration Example:**
```typescript
{
  providers: [
    { name: 'openai', samples: 1 },  // 1 call
    { name: 'gemini', samples: 1 },  // 1 call
    { name: 'claude', samples: 2 }   // 2 independent calls
  ]
}
```

---

### Step 2: Cross-Model Collaborative Rethink (Iterative, No Aggregation)
**Purpose:** Structured peer review where each model rethinks itself AND critiques others' findings

**Key Concept:** Each model receives **all other models' outputs** and produces:
1. **Self-Rethinking**: Reconsider own analysis based on what others found
2. **Peer Feedback**: Provide explicit feedback on each other model's findings
3. **Additional Insights**: Any new observations triggered by the collaboration

**Flow:**
**Iterations (repeated until convergence or max iterations):**

- **Iteration 1** inputs:
  - The initial prompt and screenshot
  - ALL v1 results from Step 1 (cross-model context)
  
- **Iteration n** inputs:
  - The initial prompt and screenshot
  - ALL results from **previous iteration** (iteration n-1)

- **Each iteration**, every provider:
  1. **Rethinks its own analysis** from previous step/iteration
  2. **Provides feedback** on other models' findings (validate/invalidate/refine)
  3. **Shares additional insights** triggered by collaborative context
  4. Gets called again (same sample count as Step 1)
  5. Produces v2_r{n} results containing:
     - Revised own analysis
     - Feedback on other models' findings
     - New collaborative insights
  6. **NO aggregation** - store all v2_r{n} results individually

- **Convergence Check** (after each iteration):
  - Calculate average score change across all results
  - If scores stabilized → **Converged**, proceed to Step 3
  - Otherwise → Continue to next iteration (if max not reached)

- **Termination**:
  - Stop when **convergence achieved** OR **max iterations reached** (e.g., 3)

**Example Context Growth:**
- Iteration 1: Models see 4 v1 results (from Step 1) → produce 4 v2_r1 results
- Iteration 2: Models see 4 v2_r1 results (from Iteration 1) → produce 4 v2_r2 results
- Iteration 3: Models see 4 v2_r2 results (from Iteration 2) → produce 4 v2_r3 results

**Example Structured Feedback:**
**Model A** (OpenAI) in Step 1 found: "Poor color contrast in header"

**Model B** (Gemini) in Step 2 produces:
- **Self-Rethinking**: "I initially said navigation was clear, but seeing Model A's contrast findings, I now notice the nav links also have readability issues"
- **Feedback on Model A**: 
  - ✅ "Validated: WCAG AA contrast ratio is indeed 2.8:1 (Model A is correct)"
  - 💡 "Better insight: The root cause is not just contrast but also font weight being too light"
- **Additional Insights**: "The contrast issue extends to the footer as well, which none of us initially caught"

**Output:**
- All individual v2_r1, v2_r2, ..., v2_rN results stored separately
- No aggregation until Step 3
- Rich cross-pollination of insights across models and iterations

**Configuration Example:**
```typescript
{
  maxRethinkIterations: 3,
  convergenceThreshold: 2.0  // Stop if average score change < threshold
}
```

**Benefits:**
- Providers see the full spectrum of perspectives from all samples
- Each iteration enriches the context exponentially
- No information loss from premature aggregation

---

### Step 3: Master Aggregation & Synthesis
**Purpose:** Single comprehensive aggregation of all analyses

**Flow:**
1. **Master provider** (user-selected) receives **ALL outputs from ALL iterations**:
   - All v1 results (e.g., 4 analyses)
   - All v2_r1 results (e.g., 4 analyses)  
   - All v2_r2 results (e.g., 4 analyses)
   - Total context: 12 individual analyses if 2 iterations with 4 samples
2. Master provider's task:
   - **Aggregate** all individual analyses
   - Identify consensus observations (high confidence)
   - Identify divergent observations (uncertainty areas)
   - Calculate weighted scores
   - Synthesize final recommendations
3. Store final aggregated result to database

**Output:**
- **Single** final comprehensive report with:
  - Overall aggregated score with confidence metrics
  - Category breakdown showing agreement across samples
  - Consensus vs. divergent observations clearly marked
  - Prioritized recommendations based on multi-sample agreement

---

## Key Enhancements

### 1. Multi-Sampling Without Premature Aggregation

**Philosophy:** Preserve all information until final synthesis

Instead of aggregating after each step, V2 keeps all individual responses:
- **Step 1**: 4 independent analyses (1+1+2 samples)
- **Step 2 (Iter 1)**: 4 more analyses that considered all 4 v1 results
- **Step 2 (Iter 2)**: 4 more analyses that considered all 4 v2_r1 results
- **Step 3**: Master provider sees all 12 analyses (from 3 iterations) and aggregates once

**Benefits:**
- No information loss from premature averaging
- Preserves nuance and minority perspectives
- Allows master provider to make informed aggregation decisions

### 2. Iterative Context Rethinking

Each iteration builds upon the previous:
- **Iteration 1**: Each provider sees 4 v1 analyses
- **Iteration 2**: Each provider sees 4 v2_r1 analyses from Iteration 1
- **Iteration 3**: Each provider sees 4 v2_r2 analyses from Iteration 2

**Benefits:**
- Providers can reconsider based on complete picture
- Emergent insights from seeing multiple perspectives
- Cross-pollination of ideas across samples and iterations

### 3. Smart Final Aggregation

Master provider performs sophisticated aggregation in Step 3:
- **Consensus Detection**: Observations mentioned by multiple samples
- **Confidence Scoring**: Based on agreement rate across samples
- **Uncertainty Flagging**: Divergent observations for human review
- **Weighted Scoring**: Scores weighted by convergence and agreement

**Example aggregation output:**
```json
{
  "overallScore": 85,
  "confidence": "high",
  "scoreRange": [82, 88],  // Min/max across samples
  "consensusObservations": [
    { "text": "Poor color contrast in header", "agreement": 0.75 }  // 3/4 samples
  ],
  "uncertainObservations": [
    { "text": "Navigation may be confusing", "agreement": 0.25 }  // 1/4 samples
  ],
  "totalAnalysesConsidered": 12
}
```

Users control the depth of analysis:

| Tier | Samples | Iterations | Time | Cost | Quality |
|------|---------|-----------|------|------|---------|
| **Free** | 1 | 1 | ~10s | $ | Good |
| **Pro** | 2 | 2 | ~30s | $$$ | Great |
| **Enterprise** | 3 | 3 | ~60s | $$$$$ | Excellent |

---

## Technical Implementation

### Updated Orchestrator API

```typescript
const orchestrator = new AnalysisOrchestrator({
  openai: process.env.OPENAI_API_KEY,
  gemini: process.env.GOOGLE_GEMINI_API_KEY,
  claude: process.env.ANTHROPIC_API_KEY,
});

const results = await orchestrator.runPipeline(
  imageBase64,
  {
    providers: [
      { name: 'openai', samples: 1 },
      { name: 'gemini', samples: 1 },
      { name: 'claude', samples: 2 }
    ],
    masterProvider: 'openai',
    masterSamples: 1,
    maxRethinkIterations: 3,
    convergenceThreshold: 2.0
  },
  (step, detail) => {
    // Progress callback
    console.log(`${step}: ${detail}`);
  }
);

// Results structure
results = {
  v1Results: Map<AIProvider, {
    aggregatedResult: AnalysisResult,
    samples: AnalysisResult[],
    confidence: ConfidenceMetrics
  }>,
  v2Results: Map<number, Map<AIProvider, {
    aggregatedResult: AnalysisResult,
    samples: AnalysisResult[],
    confidence: ConfidenceMetrics
  }>>,  // Keyed by iteration number
  synthesisResult: {
    aggregatedResult: AnalysisResult,
    samples: AnalysisResult[],
    confidence: ConfidenceMetrics
  },
  convergenceMetrics: {
    converged: boolean,
    totalIterations: number,
    iterationDeltas: number[]
  },
  finalScore: number
}
```

### Database Schema Changes

**New columns in `analysis_responses`:**
```sql
ALTER TABLE analysis_responses ADD COLUMN sample_index INTEGER DEFAULT 1;
ALTER TABLE analysis_responses ADD COLUMN is_aggregated BOOLEAN DEFAULT false;
ALTER TABLE analysis_responses ADD COLUMN confidence_score NUMERIC;
ALTER TABLE analysis_responses ADD COLUMN score_variance NUMERIC;
```

**New table for iteration tracking:**
```sql
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

---

## Performance Considerations

### Parallelization Strategy
- **Within Step**: All samples for a provider run in parallel
- **Across Providers**: All providers run in parallel
- **Across Iterations**: Sequential (must wait for previous iteration)

### Estimated Latency
- V1: ~10 seconds (3 providers × 1 sample × 1 iteration)
- V2 (2 samples, 2 iterations): ~30 seconds
- V2 (3 samples, 3 iterations): ~60 seconds

### Cost Optimization
- Early convergence detection saves unnecessary iterations
- Smart sampling: Reduce samples in later iterations if confidence is high
- Budget controls: Hard stop at token limit

---

## Migration Path from V1

### Backward Compatibility
All V1 configurations remain valid:
```typescript
// V1 config (still works)
{ providers: ['openai', 'gemini'], masterProvider: 'openai' }

// Auto-converted to V2
{ 
  providers: [
    { name: 'openai', samples: 1 },
    { name: 'gemini', samples: 1 }
  ],
  masterProvider: 'openai',
  maxRethinkIterations: 1
}
```

### Gradual Rollout
1. Feature flag: `ENABLE_V2_PIPELINE`
2. UI toggle: "Use Enhanced Analysis (Beta)"
3. Default to V1, opt-in to V2
4. After testing period, make V2 default

---

## Success Metrics

Track the following to validate V2 improvements:

1. **Quality Metrics:**
   - User satisfaction scores
   - Report accuracy (compared to expert reviews)
   - Reduction in false positives/negatives

2. **Confidence Metrics:**
   - Average confidence scores
   - Percentage of high-confidence results
   - Uncertainty flag accuracy

3. **Convergence Metrics:**
   - Average iterations to convergence
   - Convergence rate (% of analyses that converge)
   - Score improvement from v1 to final

4. **Cost Metrics:**
   - Average tokens per analysis (V1 vs V2)
   - Cost per quality point improvement
   - User retention by tier

---

## See Also

- [Modification Plan](./MODIFICATION_PLAN.md) - Detailed implementation tasks
- [V1 Pipeline](../AI_PIPELINE.md) - Current production architecture
