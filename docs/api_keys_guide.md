# API Keys Setup Guide

Quick reference for obtaining API keys for all supported providers.

## OpenAI

**Get API Key**: https://platform.openai.com/api-keys

1. Create an OpenAI account or log in
2. Navigate to API Keys section
3. Click "Create new secret key"
4. Copy and save the key immediately (it won't be shown again)

**Environment Variable**:
```bash
OPENAI_API_KEY=sk-...
```

**Models**: `gpt-4o`, `gpt-4-turbo`, `gpt-3.5-turbo`

---

## Anthropic Claude

**Get API Key**: https://console.anthropic.com/account/keys

1. Create an Anthropic account or log in
2. Go to API Keys section
3. Click "Create Key"
4. Copy the key (format: `sk-ant-...`)

**Environment Variable**:
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

**Models**: `claude-sonnet-4-20250514`, `claude-3-5-sonnet-20241022`, `claude-3-opus-20240229`

---

## Google Gemini

**Get API Key**: https://aistudio.google.com/app/apikey

1. Sign in with Google account
2. Click "Get API Key" or "Create API Key"
3. Select or create a Google Cloud project
4. Copy the generated key

**Environment Variable**:
```bash
GEMINI_API_KEY=AI...
```

**Models**: `gemini-2.0-flash`, `gemini-1.5-pro`, `gemini-1.5-flash`

---

## Configuration in Project

Add these to your `.env.local` file:

```bash
# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=AI...

# Only configure the providers you plan to use
```

## Pricing Notes

- **OpenAI**: Pay-per-token, varies by model
- **Claude**: Pay-per-token, competitive with OpenAI
- **Gemini**: Free tier available, then pay-per-token

For the latest pricing, check each provider's pricing page.
