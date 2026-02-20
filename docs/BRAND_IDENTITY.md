# Brand Identity — AnalyzicAI Family

> Color system, typography anchors, and wordmark rules for AnalyzicAI, SolidicAI, and UXicAI.
> Last updated: 2026-02-20

---

## Products & Color Roles

| Product | Domain | Brand color role |
|---|---|---|
| **AnalyzicAI** | AI-powered analysis platform (landing) | Analyzic anchor + AI purple |
| **SolidicAI** | Smart contract / blockchain auditor | Blockchain cyan |
| **UXicAI** | UI/UX screenshot analysis | UX pink |

---

## Two-Token Color System

Each color role has two tokens:

| Token type | Purpose |
|---|---|
| **Brand** | Wordmarks, filled buttons, large display elements, score values |
| **Text** | Inline text highlights, badges, outline buttons, labels, nav items, separators |

---

## Color Tokens

### AI Purple — all products
```
--color-ai-brand:  #C044FF
--color-ai-text:   #C084FC
```
Used on the `AI` suffix in every product wordmark. Also the primary accent for the AnalyzicAI landing.

### Blockchain Cyan — SolidicAI
```
--color-chain-brand:  #00FFD1
--color-chain-text:   #5FFAE0
```
Used on the `Solidic` prefix and all blockchain/smart contract UI.

### UX Pink — UXicAI
```
--color-ux-brand:  #FF2D9E
--color-ux-text:   #FF79C6
```
Used on the `UXic` prefix and all UX analysis UI.

### Analyzic Anchor — AnalyzicAI
```
--color-analyzic:  #FFFFFF
```
Pure white — crisp, neutral anchor that lets the AI purple suffix stand out cleanly.

---

## Wordmarks

```
AnalyzicAI  →  [Analyzic: #FFFFFF]  [AI: #C044FF]
SolidicAI   →  [Solidic:  #00FFD1]  [AI: #C044FF]
UXicAI      →  [UXic:     #FF2D9E]  [AI: #C044FF]
```

---

## Background Scale

```
--bg-900:  #08080D   ← base / page background
--bg-800:  #0F0F18   ← cards, panels
--bg-700:  #16162A   ← elevated surfaces, score cards
--bg-600:  #1E1E38   ← hover states, active items
```

---

## Filled Button Rules

| CTA type | Background | Text color |
|---|---|---|
| AI actions | `#C044FF` | `#ffffff` |
| Blockchain actions | `#00FFD1` | `#08080D` ← dark text, cyan is bright |
| UX actions | `#FF2D9E` | `#ffffff` |

---

## Gradient Combinations

| Name | Value |
|---|---|
| AI → Blockchain | `linear-gradient(135deg, #C044FF, #00FFD1)` |
| AI → UX | `linear-gradient(135deg, #C044FF, #FF2D9E)` |
| Blockchain → UX | `linear-gradient(135deg, #00FFD1, #FF2D9E)` |
| Full Spectrum (brand) | `linear-gradient(135deg, #C044FF, #00FFD1, #FF2D9E)` |
| Full Spectrum (text) | `linear-gradient(135deg, #C084FC, #5FFAE0, #FF79C6)` |

---

## Usage Rules

### Do
- Use **brand token** for wordmarks, filled CTAs, and large score numbers
- Use **text token** for inline highlights, badges, outline buttons, and labels
- Use **white text** (`#ffffff`) on AI purple and UX pink filled buttons
- Use **dark text** (`#08080D`) on blockchain cyan filled buttons

### Don't
- Use `#E500CE` (old magenta) — replaced by `#FF2D9E` / `#FF79C6`
- Use `#00FFD1` as the AI or UX accent — it is exclusively the blockchain/SolidicAI token

---

## Full CSS Variable Block

```css
:root {
  /* AI — all products */
  --color-ai-brand:    #C044FF;
  --color-ai-text:     #C084FC;

  /* Blockchain — SolidicAI */
  --color-chain-brand: #00FFD1;
  --color-chain-text:  #5FFAE0;

  /* UX — UXicAI */
  --color-ux-brand:    #FF2D9E;
  --color-ux-text:     #FF79C6;

  /* Analyzic anchor */
  --color-analyzic:    #FFFFFF;

  /* Backgrounds */
  --bg-900: #08080D;
  --bg-800: #0F0F18;
  --bg-700: #16162A;
  --bg-600: #1E1E38;
}
```

---

## Preview Files

- `temp/brand-colors.html` — palette swatches, wordmarks, usage contexts, gradients
- `temp/ux-color-check.html` — UX pink variant comparison across all contexts
