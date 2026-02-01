# Progress Bar Color Bug Fix

**Date**: 2026-02-01  
**Issue**: Progress bars showing black/empty when score < 80  
**Status**: ✅ Fixed

## Problem

When a score was below 80 (warning/yellow range) or below 60 (error/red range), the progress bar appeared as a black/empty bar instead of showing the appropriate color.

### Root Cause

Tailwind CSS cannot dynamically generate class names from template literals at build time. The code was using:

```typescript
const prefix = type === "text" ? "text-" : "bg-";
if (score >= 80) return `${prefix}success`;
if (score >= 60) return `${prefix}warning`;
return `${prefix}error`;
```

This resulted in classes like `bg-warning` and `bg-error` that Tailwind didn't recognize because they were constructed dynamically.

## Solution

Changed to use inline styles with CSS variables for background colors:

### Updated Files

**1. `lib/utils.ts`**
- Added new `getScoreColor()` function that returns CSS variable values
- Modified `getScoreColorClass()` to only handle text colors with static classes
- Text colors still use Tailwind classes: `text-success`, `text-warning`, `text-error`
- Background colors now use inline styles: `var(--success)`, `var(--warning)`, `var(--error)`

**2. `components/ProgressBar.tsx`**
- Updated to use inline styles with `backgroundColor: getScoreColor(score)`
- Removed dynamic `bg-` class generation
- Progress bar now correctly displays:
  - **Green** (var(--success): #22c55e) for scores ≥ 80
  - **Yellow/Orange** (var(--warning): #f59e0b) for scores 60-79
  - **Red** (var(--error): #ef4444) for scores < 60

## Code Changes

### Before
```typescript
<div
  className={`h-full transition-all duration-500 ${getScoreColorClass(score, "bg")}`}
  style={{ width: `${score}%` }}
/>
```

### After
```typescript
<div
  className="h-full transition-all duration-500"
  style={{ 
    width: `${score}%`,
    backgroundColor: getScoreColor(score)
  }}
/>
```

## Testing

Test all three color ranges:
- [ ] Score 85 → Green bar
- [ ] Score 70 → Yellow/orange bar
- [ ] Score 45 → Red bar
- [ ] Verify smooth color transitions
- [ ] Check text colors still work (score labels)

## Impact

- ✅ Visual bug fixed
- ✅ No breaking changes
- ✅ Better solution using CSS variables (theme-aware)
- ✅ Consistent with globals.css color definitions

## Notes

This is a better approach than using Tailwind's safelist feature because:
1. Uses existing CSS variables from globals.css
2. More maintainable
3. Works with dynamic values
4. Theme-aware (if colors change in CSS, bars update automatically)
