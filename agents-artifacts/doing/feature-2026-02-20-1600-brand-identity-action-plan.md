# Brand Identity Action Plan
`2026-02-20`

## Context

Defined a unified color identity system across the AnalyzicAI product family. The system uses a two-token approach (brand + text) for each color role, scoped per product. Decisions were made through iterative HTML preview files in `temp/`.

Reference files:
- `temp/brand-colors.html` — full palette, wordmarks, usage contexts
- `temp/ux-color-check.html` — UX pink color comparison across all contexts

---

## Decisions Made

### Two-Token Pattern
Each color role has two values:
- **Brand token** → wordmarks, filled buttons, large display UI
- **Text token** → inline text, badges, outline buttons, labels, separators, score labels

### Color Roles Confirmed

| Role | Brand Token | Text Token | Status |
|---|---|---|---|
| AI (all products) | `#C044FF` | `#C084FC` | ✅ confirmed |
| Blockchain · SolidicAI | `#00FFD1` | `#5FFAE0` | ✅ confirmed |
| UX · UXicAI | `#FF2D9E` | `#FF79C6` | ✅ confirmed |
| Analyzic anchor | `#FFFFFF` | — | ✅ confirmed |

### Filled Button Text Rule
| Color | Button text |
|---|---|
| AI Purple `#C044FF` | `#ffffff` white |
| Blockchain Cyan `#00FFD1` | `#08080D` dark ← cyan is bright enough |
| UX Pink `#FF2D9E` | `#ffffff` white |

### Background Scale
| Token | Value |
|---|---|
| bg-900 (base) | `#08080D` |
| bg-800 (card) | `#0F0F18` |
| bg-700 (elevated) | `#16162A` |
| bg-600 (hover) | `#1E1E38` |

---

## Pending Decision

### "Analyzic" wordmark color — ✅ RESOLVED

**Chosen**: `#FFFFFF` Pure White

---

## Implementation Steps

### Step 1 — Update CSS variables
Update in each app:
- `apps/analyzicai/src/app/globals.css`
- `apps/uxicai/src/` (globals/theme)
- `apps/solidicai/src/` (globals/theme)

Add all tokens:
```css
:root {
  --color-ai-brand:    #C044FF;
  --color-ai-text:     #C084FC;
  --color-chain-brand: #00FFD1;
  --color-chain-text:  #5FFAE0;
  --color-ux-brand:    #FF2D9E;
  --color-ux-text:     #FF79C6;
  --color-analyzic:    #FFFFFF;
  --bg-900: #08080D;
  --bg-800: #0F0F18;
  --bg-700: #16162A;
  --bg-600: #1E1E38;
}
```

### Step 2 — Update Tailwind configs
Add tokens to each app's `tailwind.config.ts` under `theme.extend.colors`. Current `apps/analyzicai/tailwind.config.ts` has `cyan` and `magenta` — migrate to the new role-named tokens.

### Step 3 — Update SVG logos
Update gradient/fill colors in:
- `apps/analyzicai/public/logo.svg`
- `apps/solidicai/public/logo.svg`
- `apps/uxicai/public/logo.svg`

### Step 4 — Apply to components
Audit and update:
- Navbar/header wordmarks
- CTA buttons (primary per product)
- Badge/tag components
- Score display components (UXicAI)
- Section separators / dividers
- Hardcoded `#E500CE` usages → replace with `#FF2D9E` / `#FF79C6`

### Step 5 — Finalize temp HTML preview
Once "Analyzic" option is chosen, update `temp/brand-colors.html` to reflect final state.

### Step 6 — Move to done
Move this file to `agents-artifacts/done/` when all steps complete.

---

## Notes

The existing AnalyzicAI landing uses `#00FFD1` as primary and `#E500CE` as secondary. Under the new system, cyan becomes exclusively the blockchain/SolidicAI role, and magenta is replaced by `#FF2D9E`. The landing page will adopt `#C044FF` (AI purple) as its primary identity color. No backward compatibility required per `AGENTS.md`.
