# API Keys Setup Guide

Quick reference for obtaining API keys for all supported providers.

## Pricing Information

Always check current pricing before selecting models:

- **OpenAI**: https://platform.openai.com/docs/pricing
- **Anthropic (Claude)**: https://platform.claude.com/docs/en/about-claude/pricing
- **Google (Gemini)**: https://ai.google.dev/gemini-api/docs/pricing

## API Usage Dashboards

Monitor your actual costs and usage:

- **OpenAI**: https://platform.openai.com/usage
- **Anthropic**: https://console.anthropic.com/settings/usage  
- **Google**: https://console.cloud.google.com/billing

---

# Get API Keys

Create accounts and generate API keys for each provider:

- **OpenAI**: https://platform.openai.com/api-keys
- **Anthropic**: https://console.anthropic.com/account/keys
- **Google**: https://aistudio.google.com/app/apikey
- **GitHub Copilot**: https://github.com/settings/copilot

## Environment Variables

Add these to your `.env.local` file (see `.env.example` for full template):

```bash
# AI Provider API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...
GITHUB_COPILOT_API_KEY=ghu_...


# Model Configuration
# Testing/Development Models (cheapest - as of Jan 2026)
OPENAI_MODEL_FOR_TESTING=gpt-5-nano
ANTHROPIC_MODEL_FOR_TESTING=claude-3-haiku-20240307
GEMINI_MODEL_FOR_TESTING=gemini-2.0-flash-lite

# Production Models (higher quality)
OPENAI_MODEL_FOR_PRODUCTION=gpt-5.2
ANTHROPIC_MODEL_FOR_PRODUCTION=claude-sonnet-4-5
GEMINI_MODEL_FOR_PRODUCTION=gemini-pro-latest
```
