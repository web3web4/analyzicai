# UXicAI - AI Agent Documentation

## Project Overview

**UXicAI** is an AI-powered UI/UX analysis platform. Users upload screenshots or capture screens via WebRTC, and the system analyzes them using multiple AI vision providers (OpenAI, Gemini, Claude) in a multi-steps pipeline to deliver comprehensive design feedback.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Styling**: Tailwind CSS
- **Backend & Auth**: Supabase (Auth, Postgres, Storage)
- **AI Vision**: OpenAI GPT, Google Gemini, Anthropic Claude
- **Screenshot**: WebRTC (`getDisplayMedia`)
- **Validation**: Zod

## Key Architectural Decisions

1. **Auth**: Supabase SSR with social providers (GitHub, Figma, Notion, Google, Apple, Azure).
2. **Multi-Step AI Pipeline**:
   - Step 1: Initial parallel analysis from all selected providers
   - Step 2: Cross-provider rethink (each sees others' results)
   - Step 3: Master provider synthesizes final result
3. **All AI Responses Stored**: Every v1, v2, and final response saved in `analysis_responses` table.
4. **Prompt Templates**: Versioned prompts stored in DB for A/B testing.

## Development Rules

- **No backward compatibility** - This is a work in progress project, feel free to break things at anytime. You can edit and rewrite anything.
- **Code Quality**: Strict TypeScript. No `any`. Use `zod` for all validation.
- **Documentation location**:
  - Persistent docs → `docs/`
  - Agent-execution-specific → `agents-artifacts/` (do not add to .gitignore)
- **Testing**: Test features in browser. For complex logic, write tests.

## Documentation Workflow

- Include timestamp: `YYYY-MM-DD-HHmm-title.md` to any .md file created inside `agents-artifacts/`.
- Use descriptive names like: `bug-YYYY-MM-DD-HHmm-xxx-investigation.md`, `feature-YYYY-MM-DD-HHmm-xxx-implementation.md`, `analysis-YYYY-MM-DD-HHmm-xxx.md`

### In-Progress Work
- Create reports in `agents-artifacts/doing/`

### Completed Work
- Move reports to `agents-artifacts/done/` when resolved
- Add to `docs/` whatever is relevant

### At any given time
- Add to `agents-artifacts/todo/` whatever is relevant as follow:
  - `agents-artifacts/todo/bugs/` for bug reports
  - `agents-artifacts/todo/features/` for features that you think are missing or are nice to have
  - `agents-artifacts/todo/analysis/` for points, ideas, or suggestions that you think need to be analyzed