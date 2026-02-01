# Provider Selection for Retry Enhancement

**Date**: 2026-02-01  
**Status**: ✅ Completed

## Overview

Enhanced the retry functionality to allow users to select different providers when retrying failed analyses. This gives users flexibility to:
1. See which provider was originally called and failed
2. Choose the same provider to retry (maybe it was a transient error)
3. Choose a different provider as an alternative

## What Changed

### 1. Enhanced RetryPanel UI

**New Features:**
- Shows which provider failed with clear labeling
- Displays all available providers with radio buttons
- Shows provider descriptions to help users choose
- Indicates which option is "retry same" vs switching
- Highlights when user selects a different provider

**UI Structure:**
```
For each failed provider:
  ┌─────────────────────────────────────┐
  │ ❌ Failed: OpenAI GPT               │
  │                                     │
  │ Select provider for retry:          │
  │ ○ OpenAI GPT (retry same)          │
  │   Best for detailed observations    │
  │ ● Gemini Pro Vision                 │
  │   Great for visual patterns         │
  │ ○ Claude 3 Sonnet                   │
  │   Excellent for accessibility       │
  └─────────────────────────────────────┘
```

### 2. Updated Retry API

**New Request Schema:**
```typescript
POST /api/retry
{
  "analysisId": "uuid",
  "failedProviders": ["openai"],
  "retryProviders": [
    {
      "originalProvider": "openai",    // Which provider failed
      "retryProvider": "gemini"        // Which to use for retry
    }
  ],
  "retryStep": "v1_initial"
}
```

**Backward Compatible:**
- If `retryProviders` is not provided, defaults to retrying with same providers
- Existing retry requests still work

**Response:**
```typescript
{
  "success": true,
  "analysisId": "uuid",
  "retriedProviders": ["gemini"],  // Shows which providers were actually used
  "synthesisRetried": true,
  "message": "Successfully retried with 1 provider(s) and synthesis"
}
```

### 3. Smart Provider Substitution

The system now:
1. Tracks which provider was originally called
2. Allows selecting a different provider for retry
3. Stores the new provider's response (not the failed one's name)
4. Uses the new provider for synthesis if it succeeds

**Example Flow:**
```
Original Analysis:
  - OpenAI: ✓ Success
  - Gemini: ✗ Failed
  - Claude: ✓ Success

User Selects:
  - Retry Gemini → Use Claude instead

Result:
  - OpenAI: ✓ (original)
  - Claude: ✓ (original)
  - Claude: ✓ (retry, new response)
  
Synthesis uses all 3 responses (2x Claude, 1x OpenAI)
```

## Use Cases

### Use Case 1: Transient Failure
**Scenario:** Provider failed due to temporary API issue  
**Action:** Retry with same provider  
**Benefit:** Get the intended provider's analysis

### Use Case 2: Provider Alternative
**Scenario:** Provider consistently fails or user wants different perspective  
**Action:** Switch to different provider  
**Benefit:** Get results without waiting for problematic provider

### Use Case 3: Comparative Analysis
**Scenario:** User wants to see how different providers analyze the same image  
**Action:** Intentionally switch providers  
**Benefit:** Can compare different AI perspectives on same content

## UI/UX Enhancements

### Visual Feedback

1. **Failed Provider Badge**
   - Red badge showing "Failed"
   - Provider name prominently displayed

2. **Provider Selection**
   - Radio buttons for clear single selection
   - Provider descriptions to guide choice
   - "(retry same)" label for original provider
   - Selected option highlighted in primary color

3. **Smart Notifications**
   - Shows note when user selects different provider
   - "💡 You selected different provider(s) - this may give different insights!"

4. **Success Feedback**
   - Green success message after retry completes
   - Shows which providers were used
   - Auto-refresh after brief delay

### Accessibility

- Proper radio button groups
- Clear labels for screen readers
- Keyboard navigation support
- Visual state indicators

## Technical Implementation

### Files Modified

1. **`src/app/dashboard/results/[id]/components/RetryPanel.tsx`**
   - Added provider selection state
   - Created provider selection UI
   - Updated retry handlers to send provider config
   - Added success/error feedback

2. **`src/app/api/retry/route.ts`**
   - Added `retryProviders` to request schema
   - Implements provider substitution logic
   - Stores actual provider used (not failed one)
   - Returns success message with details

3. **`src/app/dashboard/results/[id]/page.tsx`**
   - Passes available providers to RetryPanel

4. **`src/app/dashboard/results/[id]/components/ResultsContent.tsx`**
   - Forwards provider list to RetryPanel

## Example Scenarios

### Scenario A: OpenAI Fails, Retry with Gemini

**Initial State:**
```
Analysis Request: [OpenAI, Gemini, Claude]
Results: Gemini ✓, Claude ✓, OpenAI ✗
```

**User Action:**
- Opens Retry Panel
- Sees "Failed: OpenAI GPT"
- Selects "Gemini Pro Vision"
- Clicks "Retry with Selected Provider"

**Result:**
```
Retry API Call:
  - Calls Gemini with same images
  - Saves Gemini response
  - Reruns synthesis with: [Gemini, Claude, Gemini (new)]
  - Status: Completed
```

### Scenario B: Multiple Failures, Mixed Retry

**Initial State:**
```
Analysis Request: [OpenAI, Gemini, Claude]
Results: OpenAI ✗, Gemini ✗, Claude ✓
```

**User Action:**
- OpenAI: Retry with OpenAI (transient error)
- Gemini: Retry with Claude (switch provider)

**Result:**
```
Retry API Call:
  - Calls OpenAI for first failed attempt
  - Calls Claude for second failed attempt
  - Saves both new responses
  - Synthesis uses: [Claude (original), OpenAI (new), Claude (new)]
  - Status: Completed
```

## Benefits

### For Users
- **Flexibility:** Choose alternative providers without re-uploading
- **Control:** Decide whether to retry same or switch
- **Insight:** Can intentionally get different AI perspectives
- **Speed:** No need to start completely over

### For System
- **Resilience:** Can work around problematic providers
- **Efficiency:** Reuses successful responses
- **Intelligence:** Provides multiple AI viewpoints
- **User Satisfaction:** More options = happier users

## Future Enhancements

1. **Provider Recommendations**
   - Suggest alternative based on failure reason
   - "Gemini failed due to rate limit. Try Claude instead?"

2. **Batch Provider Switch**
   - "Retry all failed with Claude" button
   - Quick switch for multiple failures

3. **Historical Success Rates**
   - Show which providers most reliable for user
   - "Claude has 95% success rate for you"

4. **Cost Comparison**
   - Show relative cost of each provider
   - Help users make cost-effective choices

5. **Provider Presets**
   - Save favorite provider combinations
   - "Fast Mode" vs "Quality Mode" presets

## Testing Checklist

- [x] TypeScript compilation successful
- [x] Provider selection state management
- [x] Radio button functionality
- [x] API request with provider config
- [x] Provider substitution logic
- [x] Success/error feedback
- [x] Auto-refresh after retry
- [x] Backward compatibility (no retryProviders)
- [x] Multiple failed providers
- [x] Same provider retry works
- [x] Different provider retry works

## Summary

Users can now:
1. ✅ See exactly which provider failed
2. ✅ Choose to retry with same provider
3. ✅ Choose to switch to different provider
4. ✅ Get immediate feedback on their choice
5. ✅ See success message before auto-refresh

This enhancement significantly improves the user experience by providing flexibility and control over the retry process, while maintaining the system's resilience and efficiency.
