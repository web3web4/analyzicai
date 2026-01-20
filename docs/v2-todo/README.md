# V2 Pipeline Documentation

This directory contains documentation and planning materials for the enhanced V2 AI analysis pipeline.

## Contents

1. **[MODIFICATION_PLAN.md](./MODIFICATION_PLAN.md)** - Detailed implementation plan
   - Database schema changes
   - Code modifications required
   - Implementation phases
   - Breaking changes and migration strategy

2. **[AI_PIPELINE_V2.md](./AI_PIPELINE_V2.md)** - Enhanced pipeline architecture
   - Multi-sampling strategy
   - Iterative refinement loops
   - Performance considerations
   - Cost-benefit analysis

3. **[ai-pipeline-v2.png](./ai-pipeline-v2.png)** - Visual diagram
   - Illustrates multi-sampling with ensemble aggregation
   - Shows iterative rethink loops with convergence detection
   - Depicts enhanced synthesis with confidence metrics

## Key Features

### Multi-Sampling
- Call the same LLM multiple times per step
- Leverage non-determinism for ensemble analysis
- Configurable sample count per provider
- Aggregate results with confidence metrics

### Iterative Refinement
- Repeat rethink step multiple times
- Each iteration builds on all previous results
- Convergence detection stops when scores stabilize
- Configurable max iterations

## Implementation Status

- [ ] Phase 1: Multi-Sampling (not started)
- [ ] Phase 2: Iterative Refinement (not started)
- [ ] Phase 3: Integration & Testing (not started)

## Estimated Timeline

- **Phase 1:** 2-3 days
- **Phase 2:** 2-3 days
- **Phase 3:** 1-2 days
- **Total:** ~1-2 weeks

## Questions for Review

1. Should multi-sampling be available on free tier (limited to 2 samples)?
2. What should default values be for samples and iterations?
3. Should we expose convergence threshold to users or keep it internal?
4. How should we display iteration history in the UI?

## Related Files

- Current Implementation: `src/lib/ai/orchestrator.ts`
- Database Schema: `supabase/migrations/001_analyses.sql`
- Types: `src/lib/ai/types.ts`
