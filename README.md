# UXicAI

AI-Powered UI/UX analysis platform using multi-provider consensus (OpenAI GPT, Google Gemini, Anthropic Claude).

## Status: MVP 🚧

**Phases Complete:** Foundation ✅ | Capture & Upload ✅ | Single Provider ✅ | Multi-Provider Pipeline ✅ | History & Polish 🚧 ...

### Current Features
- ✅ Social auth (GitHub, Figma, Notion, Google, Apple, Azure)
- ✅ WebRTC screen capture + image upload
- ✅ Multi-step AI analysis pipeline (v1: two steps processing: 3 parallel providers processing then synthesis)
- 🚧 Multi-step AI analysis pipeline (v2: three steps processing: interduce re-think as an intermediate iterative step)
- 🚧 Analysis history with filtering
- 🚧 Rate limiting & usage tracking
- 🚧 Responsive design polish
- ...

## Quick Start

**Zero-config development** — just install and run:

```bash
# Install dependencies
pnpm install

# Start dev server (auto-starts Supabase!)
pnpm run dev
```

That's it! The app will:
1. ✅ Auto-start Supabase if not running
2. ✅ Auto-apply database migrations
3. ✅ Start Next.js dev server

Open [http://localhost:3001](http://localhost:3001) (or `3000` if available) to see the app.

---

## Documentation

- **[Implementation Plan](docs/IMPLEMENTATION_PLAN.md)** — Architecture, tech stack, and phase progress
- **[Supabase Setup](docs/SUPABASE_SETUP.md)** — Database, migrations, scripts reference

- **[Version 1 AI Pipeline](docs/AI_PIPELINE.md)** — two-steps analysis workflow

![Version 1 AI Pipeline Diagram](docs/ai-analysis-pipeline.png)

- **[Version 2 AI Pipeline](https://github.com/web3web4/uxicai/blob/feat/iterative-refinement/docs/v2-todo/AI_PIPELINE_V2.md)** — multi-steps consensus-based iterative analysis workflow

![Version 2 AI Pipeline Diagram](https://raw.githubusercontent.com/web3web4/uxicai/refs/heads/feat/iterative-refinement/docs/v2-todo/ai-pipeline-v2.png?token=GHSAT0AAAAAADH6HKLFSJQUES6UI2XU7QRI2LXK3LQ)

---

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Storage)
- **AI Providers**: OpenAI GPT-4V, Google Gemini, Anthropic Claude
- **Screenshot**: WebRTC (getDisplayMedia)
- **Validation**: Zod

