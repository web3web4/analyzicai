# Feature: Configurable Token Limits Per Method

**Priority**: Medium  
**Effort**: Medium  
**Created**: 2026-02-13

## Context

Currently, max token limits are hardcoded in each provider:
- OpenAI: 16384 tokens
- Anthropic: 16384 tokens
- Gemini: 16384 tokens

This works but is not optimal because different operations need different token budgets:

| Method | Typical Token Needs | Current Limit | Waste |
|--------|---------------------|---------------|-------|
| `analyze` | 2-4K tokens | 16K | ~75% |
| `rethink` | 3-5K tokens | 16K | ~70% |
| `synthesize` | 8-12K tokens | 16K | ~25% |

## Proposed Solution

### Phase 1: Make Limits Configurable

Update `AIProviderConfig` to accept optional token limits:

```typescript
interface AIProviderConfig {
  apiKey: string;
  modelTier?: "tier1" | "tier2" | "tier3";
  model?: string;
  logDir?: string;
  maxTokens?: number; // New: optional override
}
```

### Phase 2: Method-Specific Defaults

Add intelligent defaults based on method:

```typescript
private getMaxTokens(methodName: string): number {
  if (this.config.maxTokens) {
    return this.config.maxTokens; // User override
  }
  
  // Method-specific defaults
  const defaults = {
    analyze: 8192,
    rethink: 8192,
    synthesize: 16384,
  };
  
  return defaults[methodName] || 8192;
}
```

### Phase 3: Image-Count Scaling

For synthesis, scale tokens based on image count:

```typescript
private getSynthesisMaxTokens(imageCount: number): number {
  const baseTokens = 8192;
  const perImageTokens = 4096;
  return Math.min(
    baseTokens + (imageCount * perImageTokens),
    32768 // API max
  );
}
```

## Benefits

1. **Cost Optimization**: Use fewer tokens when possible
2. **Flexibility**: Users can override for special cases
3. **Scalability**: Auto-scale for large multi-image analyses
4. **Performance**: Faster responses with smaller token budgets

## Implementation Checklist

- [ ] Add `maxTokens` to `AIProviderConfig` interface
- [ ] Update `BaseAIProvider` to pass method name to `callAPI`
- [ ] Implement `getMaxTokens()` in each provider
- [ ] Add method-specific defaults
- [ ] Add image-count scaling for synthesis
- [ ] Update tests
- [ ] Update documentation
- [ ] Add metrics/logging for token usage vs limit

## Related

- Fixed in: [bug-2026-02-13-1935-synthesis-token-limit.md](../doing/bug-2026-02-13-1935-synthesis-token-limit.md)
- See also: Cost optimization strategy (future doc)
