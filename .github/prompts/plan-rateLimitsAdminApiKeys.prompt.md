# Plan: Rate Limits, Admin Approval & User API Keys

This adds production-ready access controls: 5 analyses/day rate limit (unlimited for localhost or BYOK users), admin approval for new users (auto-approved if providing own API keys), per-user rate limit overrides, and a settings page for storing encrypted API keys.

**Scope**: Implement for BOTH UXicAI and SolidicAI applications (shared Supabase database, separate app implementations)

**Key Decisions**:

- API keys stored encrypted in database for convenience
- Admin approval required ONLY for users using server credits (auto-approve BYOK users)
- New `user_profiles` table for subscription tier, approval status, and custom rate limits (shared across both apps)
- Localhost bypass via `ENABLE_RATE_LIMITS=false` env var

## Steps

### 1. Database Migration - User Profiles & API Keys

Create `supabase/migrations/011_user_profiles_and_api_keys.sql` (shared by both apps)

- Add `user_profiles` table:
  - `user_id` (UUID, references auth.users, primary key)
  - `status` (ENUM: 'pending', 'approved', 'suspended', default 'pending')
  - `subscription_tier` (ENUM: 'free', 'pro', 'enterprise', default 'free')
  - `daily_rate_limit` (INTEGER, nullable - null means use tier default)
  - `is_admin` (BOOLEAN, default false, NOT NULL)
  - `encrypted_openai_key` (TEXT, nullable)
  - `encrypted_anthropic_key` (TEXT, nullable)
  - `encrypted_gemini_key` (TEXT, nullable)
  - `created_at`, `updated_at` (TIMESTAMPTZ)
- Add RLS policies: users can read/update own profile, service role has full access
- Add trigger to auto-create profile on user signup
- Add index on `status` for admin queries
- Migration should backfill existing users with 'approved' status (grandfather existing users)

### 2. Encryption Service

Create encryption utilities for both apps:

- `apps/uxicai/src/lib/crypto.ts`
- `apps/solidicai/lib/crypto.ts`

Implementation (identical for both):

- `encryptApiKey(plaintext: string): Promise<string>` using AES-256-GCM
- `decryptApiKey(encrypted: string): Promise<string>`
- Use `ENCRYPTION_KEY` from env vars (32-byte hex string)
- Add salt/IV prepending to encrypted output
- Add error handling for invalid encrypted data
- Add to both `.env.example` files: `ENCRYPTION_KEY=<generate-32-byte-hex>`

### 3. Update Rate Limit Logic

Update rate limiting in both apps:

- `apps/uxicai/src/lib/rate-limit.ts`
- `apps/solidicai/lib/rate-limit.ts` (create if doesn't exist)

Changes for both:

- Change `DAILY_LIMIT` from 1000 to 5
- Add early return `true` if `process.env.ENABLE_RATE_LIMITS === 'false'`
- Query `user_profiles` table to get user's profile
- Return `true` (unlimited) if profile has stored API keys (BYOK bypass)
- Use `profile.daily_rate_limit` if set, else use tier default (free: 5, pro: 100, enterprise: 1000)
- Keep existing daily count query from `analyses` table
- Update error handling to account for missing profile (default to free tier)

### 4. User Profile API Route

Create profile API routes in both apps:

- `apps/uxicai/src/app/api/profile/route.ts`
- `apps/solidicai/app/api/profile/route.ts`

Implementation (identical for both):

- `GET /api/profile`: Fetch user profile with decrypted API keys (masked for display)
- `PATCH /api/profile`: Update API keys
  - Validate request body with Zod
  - Encrypt provided keys before saving
  - Allow deleting keys (null values)
  - Update `updated_at` timestamp
- Auth check via `supabase.auth.getUser()`
- Auto-promote user to 'approved' when saving API keys (BYOK auto-approval)

### 5. Settings Page UI

Create settings pages in both apps:

- `apps/uxicai/src/app/dashboard/settings/page.tsx`
- `apps/solidicai/app/dashboard/settings/page.tsx`

Features (identical for both):

- Display current subscription tier and daily rate limit
- API Keys section with toggle visibility inputs for:
  - OpenAI API Key
  - Anthropic API Key
  - Google Gemini API Key
- Show masked keys on load: `sk-...xyz` (show first 3 + last 3 chars)
- Save button → calls `PATCH /api/profile`
- Add security notice: "Keys are encrypted at rest. Using your own keys bypasses rate limits."
- Display current usage: "X of Y analyses used today"
- Add navigation link in dashboard sidebar

### 6. Admin Dashboard - User Management

Create admin user management in both apps:

- `apps/uxicai/src/app/admin/users/page.tsx`
- `apps/solidicai/app/admin/users/page.tsx`

Features (identical for both):

- Server component fetching all users via service role client
- Table columns: Email, Status, Tier, Rate Limit, Created, Actions
- Filters: Status (all/pending/approved/suspended), Tier
- Actions per user:
  - Approve/Suspend toggle
  - Adjust rate limit (modal with input)
  - View usage stats
- Pagination (20 users per page)
- Search by email

**Note**: Both apps share the same user database, so admin actions in either app affect users globally

### 7. Admin API Routes

Create admin API routes in both apps:

- `apps/uxicai/src/app/api/admin/users/route.ts` + `[userId]/route.ts`
- `apps/solidicai/app/api/admin/users/route.ts` + `[userId]/route.ts`

Implementation (identical for both):

- `GET /api/admin/users`: List users with profiles (paginated)
- `PATCH /api/admin/users/[userId]`: Update user profile
  - Admin can change: `status`, `subscription_tier`, `daily_rate_limit`
- Protect with admin middleware (see next step)
- Use service role client to bypass RLS

### 8. Admin Middleware & Role Check

Create admin utilities in both apps:

- `apps/uxicai/src/lib/admin.ts`
- `apps/solidicai/lib/admin.ts`

Implementation (identical for both):

- `isAdmin(userId: string): Promise<boolean>` - checks `user_profiles.is_admin` column
- `requireAdmin()` - throws 403 if not admin (for API routes)
- `promoteAdminsByEmail()` - auto-promotes users from `ADMIN_EMAILS` env var

Update middleware in both apps:

- `apps/uxicai/src/middleware.ts`
- `apps/solidicai/middleware.ts`
- Add protected path `/admin/*` → redirect to `/dashboard` if not admin
- On each auth check, call `promoteAdminsByEmail()` to bootstrap admins from env var

Admin setup via environment variable (add to `.env.local` and `.env.production`):

```env
ADMIN_EMAILS=your-email@example.com,another-admin@example.com
```

First login with any email in `ADMIN_EMAILS` will auto-promote to admin. No manual SQL needed.

### 9. Approval Status Check in Middleware

Update middleware in both apps:

- `apps/uxicai/src/middleware.ts`
- `apps/solidicai/middleware.ts`

Changes (identical for both):

- After auth check, query user's profile status for dashboard routes
- If status is 'pending', redirect to `/pending-approval` page
- If status is 'suspended', redirect to `/suspended` page
- Allow access to `/dashboard/settings` even if pending (to add API keys)

Create pending/suspended pages in both apps:

- `apps/uxicai/src/app/pending-approval/page.tsx`
- `apps/uxicai/src/app/suspended/page.tsx`
- `apps/solidicai/app/pending-approval/page.tsx`
- `apps/solidicai/app/suspended/page.tsx`

Pending approval message: "Your account is pending approval. To get immediate access, add your own API keys in Settings."

### 10. Update Analyze API - Remove Ephemeral Keys

Update analyze routes in both apps:

- `apps/uxicai/src/app/api/analyze/route.ts`
- `apps/solidicai/app/api/analyze/route.ts`

Changes (identical for both):

- Remove `userApiKeys` from request schema (now stored in DB)
- After auth check, query user profile and decrypt API keys
- Pass decrypted keys to orchestrator (same pattern as before)
- Update `used_user_api_keys` boolean based on whether profile has any keys stored
- Keep fallback to server keys if user hasn't stored any

### 11. Update Dashboard Analyze Form

Update dashboard pages in both apps:

- `apps/uxicai/src/app/dashboard/page.tsx`
- `apps/solidicai/app/dashboard/page.tsx`

Changes (identical for both):

- Remove API key inputs (now in settings)
- Add notice: "Using server credits. To bypass rate limits, add your API keys in Settings."
- Show current rate limit status: "X of Y analyses remaining today"

### 12. Environment Variables

Update environment example files for both apps:

- `apps/uxicai/.env.example` (or `_env.example` at root)
- `apps/solidicai/.env.example`

Add to both:

- `ENCRYPTION_KEY=<generate-with-node-crypto-randomBytes-32-hex>`
- `ENABLE_RATE_LIMITS=false # Set to false for local development`
- `ADMIN_EMAILS=your-email@example.com,another-admin@example.com`

Generate encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add same values to both `.env.local` files for local development

**Admin Bootstrap**: Users with emails in `ADMIN_EMAILS` will be automatically promoted to admin on first login

### 13. Auto-Approval Trigger

Create `supabase/migrations/012_auto_approve_byok.sql` (shared by both apps)

- Postgres trigger function on `user_profiles` UPDATE
- When any `encrypted_*_key` is set to non-null, automatically set `status = 'approved'`
- Only applies if current status is 'pending' (don't override 'suspended')

## Verification

**Note**: Test in both UXicAI and SolidicAI to ensure feature parity

### 1. Local Development

- Set `ENABLE_RATE_LIMITS=false` in both `.env.local` files
- Create new user in either app → should be 'pending' but can analyze unlimited
- Verify no rate limit errors in either app

### 2. Rate Limiting

- Deploy to staging with `ENABLE_RATE_LIMITS=true`
- Create new user without API keys
- Try 6 analyses → 6th should fail with 429
- Add API keys in settings → should now be unlimited and status → 'approved'
- Verify rate limit syncs across apps (usage in UXicAI counts toward SolidicAI limit)

### 3. Admin Flow

- Add your email to `ADMIN_EMAILS` in both `.env.local` files:
  ```env
  ADMIN_EMAILS=your-email@example.com
  ```
- Login to either app → should auto-promote to admin
- Verify `is_admin=true` in database:
  ```sql
  SELECT is_admin FROM user_profiles WHERE user_id = '...'
  ```
- Access `/admin/users` in either app → should see user list
- Approve a pending user → verify they can access dashboard in both apps
- Set custom rate limit to 2 → verify user limited to 2 analyses total across both apps

### 4. API Key Storage

- Go to `/dashboard/settings` in either app
- Add OpenAI key → save
- Verify encrypted in database:
  ```sql
  SELECT encrypted_openai_key FROM user_profiles WHERE user_id = '...'
  ```
- Reload settings in both apps → should show masked key in both
- Run analysis in either app → verify using user's key (check logs or usage tracking)

### 5. Approval Status

- New user signup → should redirect to `/pending-approval` in both apps
- Admin approves in one app → user can access dashboard in both apps
- Admin suspends user → user redirected to `/suspended` in both apps

### 6. Cross-App Consistency

- Save API keys in UXicAI settings → verify visible in SolidicAI settings
- Admin changes in UXicAI → verify reflected in SolidicAI
- Rate limit usage shared across both apps

## Decisions

- **Encryption over plain storage**: User API keys are sensitive, encryption required even though RLS restricts access
- **BYOK = auto-approval**: Business logic - users bringing their own API keys cost nothing, no reason to gate them
- **user_profiles table over auth metadata**: More flexible, easier to query/index, cleaner schema than JSON metadata
- **Environment variable bypass**: Simpler than URL detection, more explicit control
- **Shared database**: Both apps use same Supabase instance, ensuring consistent user experience across platforms
- **Identical implementations**: Keep code consistent between apps for easier maintenance
- **is_admin in user_profiles**: Easier to query/index than metadata, manageable via UI, type-safe
- **ADMIN_EMAILS bootstrap**: No manual SQL needed, just add email to env var and login
