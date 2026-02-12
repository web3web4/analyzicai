# AnalyzicAI Platform Features

**Last Updated:** 2026-02-12

## Platform Architecture ✅

### Monorepo & Shared Packages

**Completed:** 2026-02-09

Transformed from single application into a multi-app platform with shared infrastructure.

**Structure:**

- `apps/uxicai` - UI/UX analysis application
- `apps/solidicai` - Smart contract security analysis application
- `packages/ai-core` - Shared AI provider abstractions and orchestration
- `packages/ui-library` - Shared React components and design system

**Benefits:**

- Code reuse across applications
- Consistent AI behavior and UX
- Easy to add new analysis domains
- Unified design system

### Database-Driven Model Configuration ✅

**Added:** 2026-02-12

Dynamic AI model configuration via Supabase database instead of hardcoded environment variables.

**Key Changes:**

- Model names stored in `model_configurations` table
- 3 tiers per provider: tier1 (cheapest), tier2 (balanced), tier3 (premium)
- Single source of truth - UI and runtime always in sync
- Per-provider tier selection by users

**Example Models:**

- OpenAI: `gpt-5-nano` (tier1), `gpt-5-mini` (tier2), `gpt-5.2-pro` (tier3)
- Anthropic: `claude-haiku-4-5` (tier1), `claude-sonnet-4-5` (tier2), `claude-opus-4-6` (tier3)
- Gemini: `gemini-1.5-flash-8b` (tier1), `gemini-2.5-flash` (tier2), `gemini-3-pro-preview` (tier3)

---

## Applications

### SolidicAI - Smart Contract Analysis ✅

**Launched:** 2026-02-10

New application for analyzing Solidity smart contracts for security vulnerabilities, gas optimization, and best practices.

**Key Features:**

- Solidity code input (paste or upload .sol files)
- Security-focused analysis categories
- Code truncation control for large contracts (>15K characters)
- Multi-provider consensus on security issues

**Analysis Categories:**

- Security vulnerabilities
- Gas optimization opportunities
- Best practices compliance
- Access control patterns
- Reentrancy protection
- Code quality and maintainability

### UXicAI - UI/UX Analysis ✅

Original application for analyzing user interfaces and user experience.

**Recent Enhancements:**

- Multi-image support (Feb 2026)
- Website context collection (Feb 2026)
- Per-provider model tier selection (Feb 2026)
- User-provided API keys (Feb 2026)

---

## Core Analysis Engine ✅

### Multi-Provider AI Analysis

Analyze UI/UX using multiple AI vision models simultaneously for comprehensive insights.

**Providers:**

- OpenAI GPT-4 Vision
- Google Gemini Pro Vision
- Anthropic Claude 3 Sonnet/Opus

**How it works:**

1. **Step 1: Initial Analysis** - Each provider analyzes independently
2. **Step 2: Cross-Provider Rethink** - Providers see each other's results and reconsider
3. **Step 3: Master Synthesis** - User's chosen master provider creates final result

**Key Capabilities:**

- Parallel provider execution for speed
- Stores all responses (v1, v2, final) for transparency
- Provider agreement scoring to highlight consensus/disagreements

---

## Image Input & Capture ✅

### Multi-Image Upload

Upload and analyze up to 10 images in a single analysis session.

**Added:** 2026-02-01

**Key Capabilities:**

- Drag & drop or file picker upload
- Multiple images (max 10 images, 10MB each, 50MB total)
- Supported formats: PNG, JPG, JPEG, WebP, GIF
- Image preview gallery with individual removal
- Clear all button for quick reset
- Real-time size and count validation

**Components:**

- Image gallery with 2x3 grid preview
- Remove individual images
- Batch upload progress indicator

### Screen Capture

Capture screenshots directly from your browser using WebRTC.

**Key Capabilities:**

- Native browser screen sharing API
- Single-click capture
- No extensions required
- Privacy-friendly (user controls what's shared)

---

## Analysis Results ✅

### Per-Image Analysis

Get detailed analysis for each uploaded image individually plus an overall assessment.

**Added:** 2026-02-01

**Key Capabilities:**

- Individual scores from each AI provider per image
- Image navigation gallery in results
- Switch between images to compare analyses
- Overall synthesis across all images
- Side-by-side: image + analysis view

**Components:**

- `PerImageResultsView` - Image-specific analysis display
- `ImageGalleryViewer` - Navigate between analyzed images

### Enhanced Results Visualization

Modern, interactive results display with advanced filtering and comparison tools.

**Refactored:** 2026-02-01

**Key Capabilities:**

- **Two-Tab Interface:**
  - **Results Tab:** Final scores, recommendations, category breakdown
  - **Provider Details Tab:** Compare individual provider responses
- **Interactive Filtering:**
  - Filter by severity (critical, high, medium, low)
  - Search within recommendations
  - Group by severity or category
  - Clear filters button
- **Visual Analytics:**
  - Category radar chart (8 categories at once)
  - Provider agreement heatmap
  - Stats grid (critical issues, consensus %, latency)
  - Circular score visualization
- **Provider Comparison Table:**
  - Side-by-side scores
  - Recommendation counts
  - Token usage
  - Response latency

**Components:**
20 modular components including:

- `CategoryRadarChart` - Visual category overview
- `ProviderAgreementView` - Consensus heatmap
- `RecommendationsSection` - Filterable list with search
- `ProviderDetailsView` - Provider comparison

**Dependencies:**

- Recharts for data visualization

---

## Error Recovery & Retry ✅

### Advanced Retry System

Granular retry control when providers fail or synthesis errors occur.

**Added:** 2026-02-01

**Key Capabilities:**

- **Provider Failure Retry:**
  - See which providers failed
  - Choose same provider (transient error) or different provider (alternative)
  - Independent selection for each failed provider
  - Preserves successful provider results
- **Synthesis Failure Retry:**
  - Retry only the synthesis step
  - Select different master provider
  - Reuses existing provider results (no re-analysis needed)
- **Partial Results Display:**
  - Shows successful analyses even when some providers fail
  - Clear visual indication of what succeeded vs failed
  - Analysis remains usable with partial data
- **Smart Notifications:**
  - Alerts when switching providers
  - Explains trade-offs
  - Success feedback with auto-refresh

**API Endpoint:**

```typescript
POST /api/retry
{
  "analysisId": "uuid",
  "failedProviders": ["claude"],
  "retryProviders": [
    { "originalProvider": "claude", "retryProvider": "gemini" }
  ],
  "synthesisFailed": false
}
```

**Components:**

- `RetryPanel` - Failure display with provider selection radio buttons

---

## Website Context Collection ✅

**Added:** 2026-02-06

Provide context about your target audience to receive more tailored analysis.

**Context Options:**

- Target age groups (Kids, Teenagers, Middle Age, Elderly)
- Target gender (Male, Female, Other)
- Education level (Basic, High School, College, Advanced)
- Income level (Low, Middle, High)
- Tech friendliness (Beginners, Average, Tech Savvy, Geeks)
- Business sector (custom tags)
- Additional notes

**Multi-Select Support:**
All context fields support multiple selections (e.g., target both teenagers and middle age users).

**Benefits:**

- More relevant recommendations
- Context-aware accessibility guidance
- Industry-specific best practices

---

## Per-Provider Model Tier Selection ✅

**Added:** 2026-02-06

Choose different quality tiers for each AI provider independently.

**How it Works:**

- Each provider has 3 tiers (cheapest, balanced, premium)
- Select different tiers per provider (e.g., tier1 for OpenAI, tier3 for Anthropic)
- Optimize for cost vs quality based on your budget

**Use Case:**
Run expensive premium models only on the master provider for synthesis, while using cheaper tiers for initial analysis to reduce costs.

---

## User-Provided API Keys (BYOK) ✅

**Added:** 2026-02-06

Bring Your Own Keys - use your personal AI provider API keys instead of platform credits.

**Key Features:**

- Optional for all providers (OpenAI, Anthropic, Gemini)
- Keys sent directly to AI providers (not stored)
- Used only for single analysis session
- Falls back to server keys if not provided

**Privacy:**

- Keys never stored in database
- Not logged in server logs
- Transmitted securely over HTTPS
- Discarded after analysis completes

---

## Smart Contract Analysis (SolidicAI) ✅

### Code Truncation Control

User-controlled truncation for large smart contracts to prevent token overflow.

**Added:** 2026-02-11

**Key Capabilities:**

- Automatic warning for contracts >15,000 characters
- Shows exact character count with formatting
- User opt-in checkbox for truncation
- Clear explanation of trade-offs:
  - Truncated: Faster synthesis, may reduce accuracy
  - Full code: Maximum accuracy, may hit token limits
- Individual provider analyses always get full code
- Only synthesis step uses truncated version (when enabled)

**Use Case:**
Large contracts (e.g., UniswapV3Pool, complex DeFi protocols) that exceed AI token limits can now be analyzed reliably by allowing users to trade synthesis accuracy for completion reliability.

---

## Analysis Categories

All analyses evaluate UI/UX across 8 core categories:

| Category                 | Focus Area                                       |
| ------------------------ | ------------------------------------------------ |
| **Color Contrast**       | Readability, accessibility, WCAG compliance      |
| **Typography**           | Font choices, hierarchy, readability             |
| **Layout & Composition** | Grid usage, alignment, balance                   |
| **Navigation**           | User flow, findability, menu structure           |
| **Accessibility**        | Screen reader support, keyboard nav, ARIA        |
| **Visual Hierarchy**     | Emphasis, focal points, information architecture |
| **Whitespace**           | Breathing room, content density                  |
| **Consistency**          | Design system adherence, pattern usage           |

**Scoring:**

- 0-100 scale per category
- Overall weighted average
- Provider agreement indicators (high/medium/low consensus)

---

## Authentication & Storage ✅

### Social Authentication

Multiple sign-in options via Supabase Auth.

**Providers:**

- GitHub
- Figma
- Notion
- Google
- Apple
- Azure (Microsoft)

**Security:**

- Row-level security (RLS) on all tables
- Users can only access their own analyses
- Session-based authentication

### Cloud Storage

Images stored securely in Supabase Storage with automatic cleanup.

**Key Capabilities:**

- Automatic image upload handling
- Secure signed URLs
- Privacy-protected storage (user-scoped buckets)

---

## Database Schema Enhancements

### Multi-Image Support

**Migration 006:** Array-based image storage

```sql
ALTER TABLE analyses
  ADD COLUMN image_paths TEXT[];
```

Enables storing multiple image paths per analysis session.

### Decimal Score Precision

**Migration 007:** Support for precise decimal scores

```sql
ALTER TABLE analyses
  ALTER COLUMN final_score TYPE NUMERIC(5,2);
ALTER TABLE analysis_responses
  ALTER COLUMN score TYPE NUMERIC(5,2);
```

AI providers can return scores like 86.5, stored precisely, displayed rounded (87).

### Partial Status Support

**Migration 008:** Allow partial completion status

```sql
ALTER TABLE analyses
  ADD CONSTRAINT status_check CHECK (
    status IN ('pending', 'step1', 'step2', 'step3',
               'completed', 'failed', 'partial')
  );
```

Enables displaying partial results when some providers succeed but others fail.

---

## Technical Architecture

### Monorepo Structure

```
apps/
├── uxicai/      # UI/UX analysis platform
└── solidicai/   # Smart contract analysis platform
```

Both apps share:

- AI provider abstractions
- UI components library
- Common utilities

### Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (Auth, PostgreSQL, Storage)
- **AI:** OpenAI, Gemini, Anthropic APIs
- **Validation:** Zod schemas
- **Charts:** Recharts

---

## Coming Soon 🚧

### Testing & Quality

- [ ] Comprehensive test coverage
- [ ] Prompt optimization via A/B testing
- [ ] Performance benchmarking

### UX Polish

- [ ] Responsive design refinements
- [ ] Mobile-first improvements
- [ ] Loading state animations

### Advanced Features

- [ ] Historical comparison (compare multiple analyses)
- [ ] Export to PDF
- [ ] Team collaboration features
- [ ] Custom evaluation criteria
- [ ] Brand guideline integration
