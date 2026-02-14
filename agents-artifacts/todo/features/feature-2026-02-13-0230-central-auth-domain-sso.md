# Feature Plan: Central Auth Domain SSO

**Date:** 2026-02-13  
**Status:** 📋 Planned (Not Implemented)  
**Complexity:** High  
**Estimated Effort:** 3-5 days  
**Priority:** Medium

## Problem Statement

Currently, users must log in separately to each app (uxicai.com, solidicai.com, analyzicai.com) even though they share the same Supabase backend and user database. This creates friction in the user experience.

### Current Behavior

- ✅ Same Supabase backend for all apps
- ✅ Same user profiles database
- ✅ Same email/password works across apps
- ❌ Separate login sessions (cookies are domain-scoped)
- ❌ User must log in separately to each app

## Solution: Central Auth Domain (Option 2)

Create a dedicated authentication domain (`auth.web3web4.com`) that handles all login/signup operations and shares sessions across all apps via secure token exchange.

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     User Journey                             │
└─────────────────────────────────────────────────────────────┘

1. User visits uxicai.com/dashboard (not logged in)
   ↓
2. Middleware redirects to: auth.web3web4.com/login?app=uxicai&redirect=/dashboard
   ↓
3. User logs in on auth.web3web4.com
   ↓
4. Auth domain creates Supabase session + exchange token
   ↓
5. Redirects back to: uxicai.com/auth/sso-callback?token=xxx&redirect=/dashboard
   ↓
6. uxicai.com validates token, creates local session
   ↓
7. User redirected to uxicai.com/dashboard (logged in)

LATER:
8. User visits solidicai.com/dashboard (not logged in)
   ↓
9. Middleware redirects to: auth.web3web4.com/login?app=solidicai&redirect=/dashboard
   ↓
10. Auth domain detects existing session, skips login form
    ↓
11. Immediately creates exchange token and redirects back
    ↓
12. User experiences "instant login" to solidicai.com
```

---

## Implementation Plan

### Phase 1: Infrastructure Setup (Day 1)

#### 1.1 Create New Auth App

**Location:** `apps/auth-web3web4/`

```bash
cd apps/
pnpm create next-app@latest auth-web3web4 \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --import-alias "@/*"
```

**Package Structure:**

```
apps/auth-web3web4/
├── app/
│   ├── login/
│   │   └── page.tsx          # Centralized login page
│   ├── signup/
│   │   └── page.tsx          # Centralized signup page
│   ├── sso-exchange/
│   │   └── route.ts          # Token exchange API
│   ├── callback/
│   │   └── route.ts          # OAuth provider callback
│   └── layout.tsx
├── middleware.ts              # Session refresh only
├── components/
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   └── AppSelector.tsx        # Show which app user is logging into
├── lib/
│   ├── token-exchange.ts      # Generate/validate tokens
│   └── redirect-validator.ts # Whitelist valid redirect URLs
└── package.json
```

**Dependencies:**

- `@web3web4/shared-platform` (reuse auth logic)
- `jose` or `jsonwebtoken` (for exchange tokens)
- `@supabase/ssr`

#### 1.2 Database Changes

**New Table:** `sso_exchange_tokens`

```sql
-- Migration: 011_sso_exchange_tokens.sql
CREATE TABLE sso_exchange_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_app TEXT NOT NULL,           -- 'uxicai' | 'solidicai' | 'analyzicai'
  redirect_path TEXT,                 -- Where to send user after SSO
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,    -- Short-lived: 5 minutes
  used_at TIMESTAMPTZ,                -- NULL = not used yet
  used_from_ip TEXT                   -- IP address that used the token
);

-- Index for fast lookups
CREATE INDEX idx_sso_tokens_lookup ON sso_exchange_tokens(token)
  WHERE used_at IS NULL AND expires_at > NOW();

-- Cleanup expired tokens (run via cron)
CREATE INDEX idx_sso_tokens_cleanup ON sso_exchange_tokens(expires_at);

-- RLS policies
ALTER TABLE sso_exchange_tokens ENABLE ROW LEVEL SECURITY;

-- Service role only (tokens created/validated server-side)
CREATE POLICY "Service role full access" ON sso_exchange_tokens
  FOR ALL USING (auth.role() = 'service_role');
```

**Alternative Approach (Stateless JWT):**
Instead of database table, use signed JWT tokens:

- ✅ Pros: No database writes, scales better
- ❌ Cons: Can't revoke tokens before expiry, harder to audit
- **Recommendation:** Start with DB table for audit trail, optimize later if needed

#### 1.3 Environment Variables

**New `.env` for auth-web3web4:**

```bash
# Supabase (shared)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
NEXT_PUBLIC_SUPABASE_PUBLISHABLE=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx

# SSO Configuration
SSO_TOKEN_SECRET=<64-char-hex-secret>  # For signing exchange tokens
SSO_TOKEN_EXPIRY=300                    # 5 minutes in seconds

# Allowed app domains (whitelist for redirects)
ALLOWED_APP_DOMAINS=http://localhost:3001,http://localhost:3002,http://localhost:3003,https://uxicai.com,https://solidicai.com,https://analyzicai.com

# This auth domain URL
NEXT_PUBLIC_AUTH_URL=http://localhost:3000
```

**Add to existing apps (.env for uxicai/solidicai/analyzicai):**

```bash
# SSO Configuration
NEXT_PUBLIC_AUTH_DOMAIN=http://localhost:3000  # auth.web3web4.com in prod
SSO_TOKEN_SECRET=<same-64-char-secret>         # Must match auth domain
```

---

### Phase 2: Core Auth Domain (Day 2)

#### 2.1 Login/Signup Pages

**app/login/page.tsx:**

```typescript
import { LoginForm } from "@/components/LoginForm";
import { AppBranding } from "@/components/AppBranding";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { app?: string; redirect?: string };
}) {
  const targetApp = searchParams.app || "unknown";
  const redirectPath = searchParams.redirect || "/dashboard";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <AppBranding app={targetApp} />
      <h1>Sign in to {getAppName(targetApp)}</h1>
      <LoginForm targetApp={targetApp} redirectPath={redirectPath} />
    </div>
  );
}
```

**Key Features:**

- Show which app user is signing into (UXicAI/SolidicAI/AnalyzicAI branding)
- Validate `app` and `redirect` params against whitelist
- Reuse login logic from `@web3web4/shared-platform`

#### 2.2 Token Exchange API

**app/sso-exchange/route.ts:**

```typescript
import { createClient } from "@supabase/supabase-js";
import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

// This endpoint is called AFTER successful login on auth domain
// It generates a one-time token and redirects to target app
export async function GET(request: NextRequest) {
  const supabase = createServerSupabase(request); // From shared-platform

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const targetApp = request.nextUrl.searchParams.get("app");
  const redirectPath =
    request.nextUrl.searchParams.get("redirect") || "/dashboard";

  // Validate target app
  if (!["uxicai", "solidicai", "analyzicai"].includes(targetApp)) {
    return NextResponse.json({ error: "Invalid app" }, { status: 400 });
  }

  // Generate one-time exchange token
  const token = generateExchangeToken(); // crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

  // Store in database
  const serviceSupabase = createServiceClient();
  await serviceSupabase.from("sso_exchange_tokens").insert({
    token,
    user_id: user.id,
    target_app: targetApp,
    redirect_path: redirectPath,
    expires_at: expiresAt.toISOString(),
  });

  // Build redirect URL to target app
  const appDomain = getAppDomain(targetApp); // From env ALLOWED_APP_DOMAINS
  const callbackUrl = new URL("/auth/sso-callback", appDomain);
  callbackUrl.searchParams.set("token", token);
  callbackUrl.searchParams.set("redirect", redirectPath);

  return NextResponse.redirect(callbackUrl);
}

function generateExchangeToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
```

---

### Phase 3: App Integration (Day 3)

#### 3.1 Update Middleware in Apps

**apps/uxicai/src/middleware.ts (and solidicai, analyzicai):**

```typescript
import { middleware as sharedMiddleware } from "@web3web4/shared-platform/middleware-exports";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Run shared middleware first
  const response = await sharedMiddleware(request);

  // If redirecting to /login, redirect to central auth instead
  if (
    response.status === 307 &&
    response.headers.get("Location")?.includes("/login")
  ) {
    const originalRedirect = new URL(response.headers.get("Location")!);
    const redirectPath =
      originalRedirect.searchParams.get("redirect") || "/dashboard";

    const authDomain = process.env.NEXT_PUBLIC_AUTH_DOMAIN!;
    const authUrl = new URL("/login", authDomain);
    authUrl.searchParams.set("app", "uxicai"); // or 'solidicai', 'analyzicai'
    authUrl.searchParams.set("redirect", redirectPath);

    return NextResponse.redirect(authUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|auth/sso-callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Key Changes:**

- Intercept redirects to `/login`
- Send to central auth domain with `app` and `redirect` params
- Exclude `/auth/sso-callback` from middleware (needs to run even when not logged in)

#### 3.2 SSO Callback Handler in Apps

**apps/uxicai/src/app/auth/sso-callback/route.ts:**

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const redirectPath =
    request.nextUrl.searchParams.get("redirect") || "/dashboard";

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Validate token with database
  const serviceSupabase = createServiceClient();
  const { data: exchangeToken, error } = await serviceSupabase
    .from("sso_exchange_tokens")
    .select("*")
    .eq("token", token)
    .eq("target_app", "uxicai") // App-specific check
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !exchangeToken) {
    console.error("Invalid SSO token:", error);
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", request.url),
    );
  }

  // Mark token as used
  await serviceSupabase
    .from("sso_exchange_tokens")
    .update({
      used_at: new Date().toISOString(),
      used_from_ip: request.ip || request.headers.get("x-forwarded-for"),
    })
    .eq("token", token);

  // Create Supabase session for this user
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );

  // Get user session from Supabase using service key
  const adminSupabase = createServiceClient();
  const {
    data: { user },
  } = await adminSupabase.auth.admin.getUserById(exchangeToken.user_id);

  if (!user) {
    return NextResponse.redirect(
      new URL("/login?error=user_not_found", request.url),
    );
  }

  // Generate session token for this user
  const { data: session, error: sessionError } =
    await adminSupabase.auth.admin.generateLink({
      type: "magiclink",
      email: user.email!,
    });

  if (sessionError || !session) {
    console.error("Failed to generate session:", sessionError);
    return NextResponse.redirect(
      new URL("/login?error=session_failed", request.url),
    );
  }

  // Sign in the user using the magic link
  const { error: signInError } = await supabase.auth.verifyOtp({
    token_hash: session.properties.hashed_token,
    type: "email",
  });

  if (signInError) {
    console.error("Sign in error:", signInError);
    return NextResponse.redirect(
      new URL("/login?error=signin_failed", request.url),
    );
  }

  // Redirect to original destination
  return NextResponse.redirect(new URL(redirectPath, request.url));
}
```

**Alternative Simpler Approach (Using Access Token):**
Instead of magic link, directly set the session:

```typescript
// Get access token from Supabase auth
const { data, error } = await adminSupabase.auth.admin.createSession({
  user_id: exchangeToken.user_id,
});

if (data?.session) {
  // Set session cookies manually
  response.cookies.set('sb-access-token', data.session.access_token, { ... });
  response.cookies.set('sb-refresh-token', data.session.refresh_token, { ... });
}
```

---

### Phase 4: User Experience Enhancements (Day 4)

#### 4.1 Silent SSO (Auto-Login)

**Detect existing session on auth domain:**

```typescript
// apps/auth-web3web4/app/login/page.tsx
export default async function LoginPage({ searchParams }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // User already logged in! Skip login form, go straight to token exchange
  if (user) {
    const targetApp = searchParams.app;
    const redirectPath = searchParams.redirect || '/dashboard';

    // Auto-redirect to exchange endpoint
    redirect(`/sso-exchange?app=${targetApp}&redirect=${redirectPath}`);
  }

  // Not logged in, show login form
  return <LoginForm ... />;
}
```

**User Experience:**

1. User logs into UXicAI → Session on auth.web3web4.com
2. Later, user visits SolidicAI → Redirected to auth.web3web4.com
3. Auth domain detects existing session → Immediate redirect back with token
4. User sees ~1-2 second redirect, then logged into SolidicAI
5. **Result:** Near-instant cross-domain login!

#### 4.2 App-Specific Branding

**Show which app user is logging into:**

```typescript
// apps/auth-web3web4/components/AppBranding.tsx
export function AppBranding({ app }: { app: string }) {
  const branding = {
    uxicai: {
      name: "UXicAI",
      logo: "/logos/uxicai.svg",
      color: "purple",
      tagline: "AI-Powered UI/UX Analysis",
    },
    solidicai: {
      name: "SolidicAI",
      logo: "/logos/solidicai.svg",
      color: "cyan",
      tagline: "Smart Contract Security Analysis",
    },
    analyzicai: {
      name: "AnalyzicAI",
      logo: "/logos/analyzicai.svg",
      color: "blue",
      tagline: "Multi-Purpose AI Analysis",
    },
  };

  const info = branding[app] || branding.uxicai;

  return (
    <div className={`border-${info.color}-500 ...`}>
      <img src={info.logo} alt={info.name} />
      <h2>{info.name}</h2>
      <p>{info.tagline}</p>
    </div>
  );
}
```

#### 4.3 Logout from All Apps

**Add "Logout Everywhere" button:**

```typescript
// apps/auth-web3web4/app/logout/route.ts
export async function POST(request: NextRequest) {
  const supabase = createServerSupabase(request);

  // Sign out from Supabase (invalidates all sessions)
  await supabase.auth.signOut({ scope: "global" });

  // Redirect to homepage
  return NextResponse.redirect(new URL("/", request.url));
}
```

**In app settings pages:**

```typescript
<button
  onClick={async () => {
    // Sign out locally
    await supabase.auth.signOut();

    // Also sign out from auth domain (clears global session)
    window.location.href = `${process.env.NEXT_PUBLIC_AUTH_DOMAIN}/logout`;
  }}
>
  Logout from all apps
</button>
```

---

### Phase 5: Security & Production (Day 5)

#### 5.1 Security Checklist

**Token Security:**

- ✅ Short expiry (5 minutes max)
- ✅ One-time use only (mark as `used_at` after consumption)
- ✅ Cryptographically random tokens (32+ bytes)
- ✅ HTTPS only in production
- ✅ Validate target app matches token
- ✅ Validate redirect URL against whitelist

**Redirect Validation:**

```typescript
// apps/auth-web3web4/lib/redirect-validator.ts
const ALLOWED_DOMAINS = process.env.ALLOWED_APP_DOMAINS!.split(",");

export function isValidRedirectUrl(url: string, targetApp: string): boolean {
  try {
    const parsed = new URL(url);

    // Must be one of our allowed domains
    const isAllowed = ALLOWED_DOMAINS.some(
      (domain) => parsed.origin === new URL(domain).origin,
    );

    // Must not redirect to external site
    if (!isAllowed) return false;

    // Additional checks
    if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
```

**CSRF Protection:**

- Generate `state` parameter during initial redirect
- Verify `state` matches on callback
- Store in session or signed cookie

#### 5.2 Monitoring & Logging

**Track SSO usage:**

```sql
-- Add to sso_exchange_tokens table
ALTER TABLE sso_exchange_tokens ADD COLUMN user_agent TEXT;
ALTER TABLE sso_exchange_tokens ADD COLUMN referrer TEXT;

-- Analytics query
SELECT
  target_app,
  COUNT(*) as total_logins,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(EXTRACT(EPOCH FROM (used_at - created_at))) as avg_exchange_time_sec
FROM sso_exchange_tokens
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY target_app;
```

**Error logging:**

- Log failed token validations (potential attack)
- Alert on high failure rate
- Track token expiry vs usage time

#### 5.3 Cleanup Cron Job

**Remove expired tokens:**

```typescript
// apps/auth-web3web4/app/api/cron/cleanup-tokens/route.ts
export async function GET(request: NextRequest) {
  // Verify cron secret
  if (
    request.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Delete tokens older than 1 hour
  const { count } = await supabase
    .from("sso_exchange_tokens")
    .delete()
    .lt("expires_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  return NextResponse.json({ deleted: count });
}
```

**Setup Vercel Cron:**

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-tokens",
      "schedule": "0 * * * *" // Every hour
    }
  ]
}
```

---

## Deployment Plan

### Development (localhost)

```bash
# Terminal 1: Auth domain
cd apps/auth-web3web4
pnpm dev  # localhost:3000

# Terminal 2: UXicAI
cd apps/uxicai
pnpm dev  # localhost:3001

# Terminal 3: SolidicAI
cd apps/solidicai
pnpm dev  # localhost:3002

# Terminal 4: AnalyzicAI
cd apps/analyzicai
pnpm dev  # localhost:3003
```

**Update `.env.local`:**

```bash
# All apps
NEXT_PUBLIC_AUTH_DOMAIN=http://localhost:3000
ALLOWED_APP_DOMAINS=http://localhost:3001,http://localhost:3002,http://localhost:3003

# Apps need their own URL for redirects
NEXT_PUBLIC_APP_URL=http://localhost:3001  # uxicai
NEXT_PUBLIC_APP_URL=http://localhost:3002  # solidicai
NEXT_PUBLIC_APP_URL=http://localhost:3003  # analyzicai
```

### Production (Vercel)

**DNS Setup:**

```
auth.web3web4.com    → Vercel (auth-web3web4 project)
uxicai.com           → Vercel (uxicai project)
solidicai.com        → Vercel (solidicai project)
analyzicai.com       → Vercel (analyzicai project)
```

**Environment Variables (Vercel Dashboard):**

**auth-web3web4:**

```bash
NEXT_PUBLIC_AUTH_URL=https://auth.web3web4.com
ALLOWED_APP_DOMAINS=https://uxicai.com,https://solidicai.com,https://analyzicai.com
SSO_TOKEN_SECRET=<production-secret>
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SECRET_KEY=<production-service-key>
```

**uxicai.com (and others):**

```bash
NEXT_PUBLIC_AUTH_DOMAIN=https://auth.web3web4.com
SSO_TOKEN_SECRET=<same-production-secret>
NEXT_PUBLIC_APP_URL=https://uxicai.com
```

---

## Testing Checklist

### Manual Testing Flow

**1. Fresh Login:**

- [ ] Visit uxicai.com/dashboard (not logged in)
- [ ] Redirects to auth.web3web4.com/login?app=uxicai
- [ ] Shows UXicAI branding
- [ ] Login with email/password
- [ ] Redirects back to uxicai.com/dashboard
- [ ] User is logged in

**2. Cross-Domain SSO:**

- [ ] While logged into uxicai.com, visit solidicai.com/dashboard
- [ ] Redirects to auth.web3web4.com (briefly)
- [ ] Immediately redirects back to solidicai.com/dashboard
- [ ] User is logged in (no login form shown)

**3. Token Expiry:**

- [ ] Generate token, wait 6+ minutes
- [ ] Try to use expired token
- [ ] Should reject and redirect to login

**4. Token Reuse:**

- [ ] Use valid token to log in
- [ ] Try to reuse same token
- [ ] Should reject (already used)

**5. Invalid App:**

- [ ] Try auth.web3web4.com/login?app=hacker
- [ ] Should reject or default to safe behavior

**6. Redirect Validation:**

- [ ] Try redirect to external domain
- [ ] Should reject and use default /dashboard

**7. Logout:**

- [ ] Logout from uxicai.com
- [ ] Visit solidicai.com
- [ ] Should require login (session cleared)

### Automated Testing

**Unit Tests:**

```typescript
// apps/auth-web3web4/__tests__/token-exchange.test.ts
describe("Token Exchange", () => {
  it("generates unique tokens", () => {
    const token1 = generateExchangeToken();
    const token2 = generateExchangeToken();
    expect(token1).not.toBe(token2);
    expect(token1).toHaveLength(64); // 32 bytes hex
  });

  it("validates redirect URLs", () => {
    expect(isValidRedirectUrl("https://uxicai.com/dashboard", "uxicai")).toBe(
      true,
    );
    expect(isValidRedirectUrl("https://evil.com/phish", "uxicai")).toBe(false);
  });

  it("marks tokens as used", async () => {
    const token = await createExchangeToken(userId, "uxicai");
    await useToken(token);
    const result = await useToken(token); // Try again
    expect(result.error).toBe("Token already used");
  });
});
```

**Integration Tests:**

```typescript
// apps/auth-web3web4/__tests__/sso-flow.test.ts
describe("SSO Flow", () => {
  it("completes full SSO flow", async () => {
    // 1. Login on auth domain
    const loginRes = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com", password: "test123" }),
    });
    expect(loginRes.ok).toBe(true);

    // 2. Request token exchange
    const exchangeRes = await fetch(
      "http://localhost:3000/sso-exchange?app=uxicai",
    );
    expect(exchangeRes.status).toBe(307); // Redirect

    const redirectUrl = new URL(exchangeRes.headers.get("Location")!);
    const token = redirectUrl.searchParams.get("token");
    expect(token).toBeTruthy();

    // 3. Use token on target app
    const callbackRes = await fetch(
      `http://localhost:3001/auth/sso-callback?token=${token}`,
    );
    expect(callbackRes.status).toBe(307); // Redirect to dashboard
  });
});
```

---

## Rollout Strategy

### Phase 1: Soft Launch (Week 1)

- Deploy auth domain to staging
- Test with internal team only
- Monitor logs and metrics
- Fix bugs

### Phase 2: Beta (Week 2)

- Enable for beta users (via feature flag)
- Collect feedback
- Optimize performance

### Phase 3: Production (Week 3)

- Enable for all users
- Update documentation
- Monitor adoption rate

### Rollback Plan

If critical issues found:

1. Update middleware to redirect to `/login` instead of auth domain
2. Disable SSO callback handler
3. Users fall back to per-app login (existing behavior)
4. No data loss or security impact

---

## Maintenance & Monitoring

### Metrics to Track

- SSO token generation rate
- Token success vs failure rate
- Average time from token creation to usage
- Failed validation attempts (security metric)
- User adoption (% of logins via SSO)

### Alerts

- ⚠️ High token failure rate (>10%)
- ⚠️ Auth domain downtime
- ⚠️ Slow token exchange (>2 seconds)
- 🚨 Potential brute force (many invalid tokens from same IP)

### Regular Tasks

- Weekly: Review SSO analytics
- Monthly: Audit failed login attempts
- Quarterly: Rotate SSO_TOKEN_SECRET
- As needed: Update allowed domains list

---

## Future Enhancements

### V2 Features

- **Remember Device:** Skip auth domain if logged in recently on this browser
- **Social Login Passthrough:** Support Google/GitHub OAuth through auth domain
- **Session Management UI:** Show all active sessions across apps, revoke individually
- **2FA Integration:** Enforce 2FA at auth domain level
- **Admin Impersonation:** Support user impersonation through SSO flow

### Performance Optimizations

- **Stateless JWT Tokens:** Replace DB table with signed JWTs (faster, scalable)
- **Redis Caching:** Cache valid tokens in Redis for faster validation
- **CDN for Auth Domain:** Serve static assets from CDN
- **Preconnect Hints:** Add `<link rel="preconnect">` to auth domain

---

## Estimated Timeline

| Phase     | Tasks                                  | Duration   | Dependencies |
| --------- | -------------------------------------- | ---------- | ------------ |
| 1         | Infrastructure setup, DB migration     | 1 day      | None         |
| 2         | Auth domain pages & token exchange     | 1 day      | Phase 1      |
| 3         | App integration (middleware, callback) | 1 day      | Phase 2      |
| 4         | UX enhancements, branding              | 1 day      | Phase 3      |
| 5         | Security hardening, testing            | 1 day      | Phase 4      |
| **Total** |                                        | **5 days** |              |

**+ 1 week buffer for testing and bug fixes**

---

## Success Criteria

✅ User logs into any app, automatically logged into all others  
✅ No security vulnerabilities (tokens short-lived, one-time use)  
✅ Fast user experience (<2s for cross-app login)  
✅ Graceful degradation if auth domain is down  
✅ Good monitoring and observability  
✅ Clean code, reusable components

---

## Open Questions

1. **Domain Strategy:** Do we own `web3web4.com` or need different domain?
2. **Session Duration:** Should sessions expire at same time across apps or independent?
3. **Forced Re-auth:** When should we force user to re-enter password (e.g., before admin actions)?
4. **Mobile Apps:** If we build mobile apps later, how does SSO work there?
5. **Branding:** Should auth domain have neutral Web3Web4 branding or match target app?

---

## Related Documentation

- [Supabase SSR Auth Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [OAuth 2.0 Token Exchange](https://datatracker.ietf.org/doc/html/rfc8693)
- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

---

## Approval Required

Before starting implementation:

- [ ] Review plan with team
- [ ] Confirm domain strategy
- [ ] Allocate development time
- [ ] Set up staging environment
- [ ] Create implementation tickets
