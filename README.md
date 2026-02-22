# AnalyzicAI

![Status](https://img.shields.io/badge/status-pre--alpha-orange) ![Version](https://img.shields.io/badge/version-v1-blue)

> ⚠️ **This project is in pre-alpha.** Expect breaking changes, incomplete features, and rough edges.

**AnalyzicAI** is the umbrella brand for a family of AI-powered analysis tools. This monorepo contains the brand website and specialized analysis applications.

## Landing Page

- **[analyzicai.com](https://analyzicai.com)** — Brand website and ecosystem hub

## Analysis Apps

- **[solidicai.com](https://solidicai.com)** — Smart contract analysis platform
- **[uxicai.com](https://uxicai.com)** — UI/UX design analysis platform

*All analysis apps leverage multi-agent iterative rethinking consensus (OpenAI GPT, Google Gemini, Anthropic Claude).*

> 💡 **Interested in analysis tools for legal cases, medical data, or other domains?** [Open a GitHub issue](https://github.com/web3web4/analyzicai/issues) to suggest it!

## Packages

- **ai-core** — Shared AI provider logic and pipeline
- **ai-ui-library** — Shared UI components
- **shared-platform** — Common platform utilities

## Quick Start

```bash
pnpm install
pnpm run dev
```

Auto-starts Supabase, applies migrations, and launches Next.js on [http://localhost:3000](http://localhost:3000), [http://localhost:3001](http://localhost:3001) and [http://localhost:3002](http://localhost:3002).

### Local Development Access

For local development, promote yourself to admin for user management capabilities and analysis access:

**Option 1: Add your email to `.env.local`** (auto-promotes on login with "pro" tier)
```env
ADMIN_EMAILS=your-email@example.com
```

**Option 2: Manually promote in database**
```sql
UPDATE user_profiles 
SET is_admin = true, subscription_tier = 'pro' 
WHERE user_id = 'your-user-id';
```

**Option 3: Provide your own API keys** in Settings for unlimited access regardless of tier.

### Access Control Model

- **Admin role**: User management only (auto-assigned "pro" tier for analysis access)
- **Subscription tiers**:
  - Free: 50,000 tokens/day
  - Pro: 1,000,000 tokens/day
  - Enterprise: 10,000,000 tokens/day
- **BYOK** (Bring Your Own Keys): Unlimited tokens using your own API keys

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **AI**: OpenAI GPT-4V, Google Gemini, Anthropic Claude
- **UI**: Tailwind CSS, WebRTC screen capture

## Documentation

- [Features](docs/FEATURES.md) — Implemented features & capabilities
- [Initial Implementation Plan](docs/INITIAL_IMPLEMENTATION_PLAN.md) — Architecture & progress
- [Supabase Setup](docs/SUPABASE_SETUP.md) — Database & migrations
- [Deployment Guide](docs/DEPLOYMENT.md) — Production deployment details
- [AI Pipeline V1](docs/AI_PIPELINE.md) — Two-step analysis
- [AI Pipeline V2](docs/v2-todo/AI_PIPELINE_V2.md) — Multi-step consensus (WIP)
- [Agent Docs](AGENTS.md) — AI agent development rules

### AI Pipeline V1 (Current)

![AI Pipeline V1](docs/ai-analysis-pipeline.png)

### AI Pipeline V2 (In Progress)

![AI Pipeline V2](docs/v2-todo/ai-pipeline-v2.png)

## Status

**MVP 🚧**:

- ✅ User authentication with Supabase
- ✅ UXicAI rough version based on WebRTC screen capture and/or image upload in addition to providing a context about the app.
- ✅ SolidicAI rough version that analyze smart contract(s) provided in text or at a GitHub url.
- ✅ Multi-step AI analysis pipeline (v1: two steps processing: 3 parallel providers processing then synthesis)
- 🚧 Multi-step AI analysis pipeline (v2: three steps processing: introduce re-think as an intermediate iterative step)
- 🚧 Analysis history with filtering
- 🚧 Rate limiting & usage tracking
- 🚧 Prompts optimization
- 🚧 Responsive design polish
- ...

## License

Copyright © 2026 Web3Web4. All rights reserved — for licensing, collaboration, or permissions, please contact the author.
