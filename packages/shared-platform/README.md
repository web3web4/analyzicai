# @web3web4/shared-platform

Shared platform infrastructure for all apps in the monorepo.

## What's Inside

- **auth/** - Authentication & authorization (middleware, admin utilities, crypto, rate limiting)
- **supabase/** - Supabase client factories (server, browser)
- **api-handlers/** - Shared API route logic (admin, profile)
- **components/** - General UI components (Logo, GlassCard, StatusBadge, etc.)
- **pages/** - Full auth/admin page components
- **types/** - Shared TypeScript types

## Usage

```typescript
// Auth middleware
import { middleware, config } from "@web3web4/shared-platform/auth/middleware";

// Supabase clients
import { createClient } from "@web3web4/shared-platform/supabase/server";

// Components
import { Logo, GlassCard } from "@web3web4/shared-platform/components";

// Pages
import { LoginPage, AdminUsersPage } from "@web3web4/shared-platform/pages";
```

## Domain

This package contains **platform infrastructure** - authentication, user management, admin features, and general UI components that are NOT specific to AI functionality.

For AI-specific components, see `@web3web4/ai-ui-library`.
