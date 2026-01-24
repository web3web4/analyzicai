#!/bin/bash

# Script to get GitHub Copilot API token
# Requires: GitHub CLI (gh) installed and authenticated

set -e

echo "🔍 Checking for GitHub CLI..."
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Installing..."
    echo "Please run: brew install gh"
    exit 1
fi

echo "✅ GitHub CLI found"

echo ""
echo "🔐 Getting GitHub token..."
TOKEN=$(gh auth token)

if [ -z "$TOKEN" ]; then
    echo "❌ No token found. Please authenticate first:"
    echo "   gh auth login"
    exit 1
fi

echo "✅ Token retrieved successfully!"
echo ""
echo "📋 Your GitHub Copilot API token:"
echo "$TOKEN"
echo ""
echo "💾 To use in your project, add to .env.local:"
echo "GITHUB_COPILOT_API_KEY=$TOKEN"
echo ""
echo "🧪 Testing token with Copilot API..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
  https://api.githubcopilot.com/chat/completions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Editor-Version: vscode/1.86.0" \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hi"}
    ],
    "max_tokens": 10
  }')

if [ "$RESPONSE" = "200" ]; then
    echo "✅ Token is valid and working with Copilot API!"
else
    echo "⚠️  Token retrieved but API returned status: $RESPONSE"
    echo "   This may mean:"
    echo "   - You don't have an active Copilot subscription"
    echo "   - The API endpoint requires special access"
    echo "   - Token needs additional scopes"
fi

echo ""
echo "📖 Note: This token may expire. Re-run this script to get a fresh token."
