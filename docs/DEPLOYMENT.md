# Deployment Guide

Free-tier deployment strategy for AnalyzicAI monorepo.

## Prerequisites

- GitHub repository connected
- Domain names: `uxicai.com`, `solidicai.com`
- API keys: OpenAI, Anthropic, Google AI

## Pre-Deployment Checklist

✅ Each app has `vercel.json` for monorepo build configuration  
✅ Each app has `.env.example` documenting required variables  
✅ Workspace packages (`ai-core`, `ui-library`) are built during deployment  
✅ No hardcoded localhost URLs in production code

## Backend: Supabase

1. Create production project at [supabase.com](https://supabase.com)
2. Run migrations:
   ```bash
   cd supabase
   supabase link --project-ref your-project-ref
   supabase db push
   ```
3. Configure OAuth providers (Settings → Auth → Providers):
   - GitHub, Google, Apple, Azure, Figma, Notion
4. Note credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE`

## Frontend: Vercel

### UXicAI

1. New project → Import from GitHub
2. Configure:
   - **Root Directory**: `apps/uxicai`
   - **Framework**: Next.js
   - **Build Command**: Uses `vercel.json` (builds workspace packages first)
   - **Output Directory**: `.next`
3. Environment Variables (copy from `apps/uxicai/.env.example`):
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE=xxx
   OPENAI_API_KEY=sk-xxx
   ANTHROPIC_API_KEY=sk-ant-xxx
   GOOGLE_AI_API_KEY=xxx
   ```
4. Deploy

### Automatic Deployments

Vercel automatically deploys on every push when connected to GitHub. Configure branch behavior:

**In Vercel Dashboard** (Settings → Git):

- **Production Branch**: `main` → Deploys to production domain
- **Preview Branches**: `staging`, `develop`, feature branches → Deploys to preview URLs
- **Ignored Build Step** (optional): Add conditions to skip deployments

**Example Git Configuration**:

```bash
# Production: Triggered on push to main
git push origin main  # → Deploys to uxicai.com

# Staging: Triggered on push to staging
git push origin staging  # → Deploys to uxicai-git-staging.vercel.app

# Feature: Any branch gets preview deployment
git push origin feature/new-ui  # → Deploys to uxicai-git-feature-new-ui.vercel.app
```

**Environment Variables Per Branch**:

- Production variables apply to `main` branch only
- Add staging-specific variables in Vercel dashboard (Settings → Environment Variables → Staging)
- Preview deployments inherit from Production by default

**Deployment Notifications**:

- GitHub: Automatic commit status checks
- Slack/Discord: Configure in Vercel Integrations
- Email: Enabled by default for deployment failures

### Alternative: GitHub Actions (Optional)

For more control or non-Vercel deployments, create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Build apps
        run: pnpm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ github.ref == 'refs/heads/main' && '--prod' || '' }}
```

**Note**: Vercel's built-in GitHub integration is simpler and recommended for most cases.

### SolidicAI

Repeat steps above with:

- **Root Directory**: `apps/solidicai`
- Environment variables from `apps/solidicai/.env.example`

**Note**: GEMINI_API_KEY is actually GOOGLE_AI_API_KEY in code - update if needed

## Domains

1. Add custom domains in Vercel:
   - `uxicai.com` → uxicai project
   - `solidicai.com` → solidicai project
2. Update DNS records as instructed by Vercel

## Post-Deployment

1. Test authentication flows
2. Verify AI provider integrations
3. Monitor Supabase usage (the free tier only provide: 500MB database, 1GB storage)
4. Monitor Vercel usage (the free tier only provide: 100GB bandwidth/month)
