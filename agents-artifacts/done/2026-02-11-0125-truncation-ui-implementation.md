# User-Controlled Code Truncation UI Implementation

**Date**: 2026-02-11 01:25  
**Status**: ✅ Complete  
**Type**: Feature Implementation

## Overview

Implemented UI controls in the analyze page to give users control over code truncation during synthesis, addressing token overflow issues while maintaining analysis accuracy.

## Problem Statement

Large contracts (>15,000 characters) cause token overflow during synthesis when the full contract code is included in the AI prompt. This results in:

- Truncated AI responses
- JSON parsing failures
- Invalid or incomplete synthesis results

## Solution

### Backend (Already Implemented)

- `truncateCodeForSynthesis` parameter in API
- Conditional truncation at 15,000 chars when enabled
- Truncation note added to prompt when activated
- Default: false (full code sent)

### Frontend (This Implementation)

#### 1. State Management

Added state variable to track user's truncation preference:

```typescript
const [truncateCodeForSynthesis, setTruncateCodeForSynthesis] = useState(false);
```

#### 2. Warning Banner

Conditional alert shown when `code.length > 15000`:

- Amber color scheme for warning
- AlertCircle icon for visibility
- Character count display with thousand separators
- Clear explanation of token overflow risk

#### 3. Truncation Checkbox

- Labeled checkbox for user opt-in
- Explains truncation behavior:
  - Limits synthesis prompt to 15,000 chars
  - Individual provider analyses still get full code
  - Trade-off: faster but may reduce synthesis accuracy
- Styled with cyan accent matching SolidicAI theme

#### 4. API Integration

Added `truncateCodeForSynthesis` to request body:

```typescript
body: JSON.stringify({
  // ...existing params
  truncateCodeForSynthesis,
});
```

## Files Modified

### apps/solidicai/app/dashboard/analyze/page.tsx

1. Added state variable (line ~33)
2. Added truncateCodeForSynthesis to API call (line ~223)
3. Added warning banner UI before submit button (line ~446-479)

## User Experience

### Small Contracts (≤15,000 chars)

- No warning shown
- Full code always sent to synthesis
- No user action needed

### Large Contracts (>15,000 chars)

1. Warning banner appears automatically
2. Shows exact character count
3. User can check "Truncate code in synthesis step"
   - Unchecked (default): Full code sent, may hit token limits
   - Checked: Code truncated, faster synthesis, potentially less accurate
4. User makes informed decision based on their priority (accuracy vs. reliability)

## Technical Details

**Threshold**: 15,000 characters

- Based on token limit analysis
- Provides buffer for prompt templates and context
- Matches backend truncation implementation

**Visual Design**:

- Amber warning color (non-critical alert)
- Clear visual hierarchy
- Responsive checkbox interaction
- Consistent with SolidicAI's cyan accent theme

## Testing Checklist

- [ ] Small contract (<15k chars) - no warning shown
- [ ] Large contract (>15k chars) - warning appears
- [ ] Checkbox unchecked - full code sent to API
- [ ] Checkbox checked - truncateCodeForSynthesis: true sent
- [ ] API receives parameter correctly
- [ ] Synthesis completes successfully with truncation
- [ ] Synthesis handles full code without truncation
- [ ] Character count displays correctly with formatting

## Next Steps

1. Test with real large contracts (e.g., UniswapV3Pool)
2. Monitor synthesis success rate with/without truncation
3. Consider adding similar UI to retry panel for synthesis retry
4. Add user documentation explaining the trade-off

## Related Issues

- Synthesis retry failures (ZodError) - Fixed by including code in prompt
- AI response truncation - Now user-controlled
- Token overflow - User can opt-in to prevention

## Notes

- Warning only shows for "code" input type (not GitHub repos)
- GitHub repos fetch code server-side, truncation handled automatically
- This gives users transparency and control over the accuracy/reliability trade-off
