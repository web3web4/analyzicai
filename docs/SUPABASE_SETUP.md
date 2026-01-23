# Supabase Local Development Setup

This project uses **custom ports** to avoid conflicts with other Supabase projects.

## Port Configuration

| Service      | Default | This Project |
|--------------|---------|--------------|
| API          | 54321   | **54331**    |
| Database     | 54322   | **54332**    |
| Studio       | 54323   | **54333**    |
| Inbucket     | 54324   | **54334**    |
| Analytics    | 54327   | **54337**    |
| Vector       | 54328   | **54338**    |
| Shadow DB    | 54320   | **54340**    |

## Development URLs

When Supabase is running, you can access the following services:

### 🔧 Development Tools

| Service | URL | Purpose |
|---------|-----|---------|
| **Studio** | http://127.0.0.1:54333 | Database admin UI, schema editor, table viewer |
| **Mailpit** | http://127.0.0.1:54334 | Email testing (catches all emails sent locally) |
| **MCP** | http://127.0.0.1:54331/mcp | Model Context Protocol endpoint |

### 🌐 API Endpoints

| API | URL | Purpose |
|-----|-----|---------|
| **Project URL** | http://127.0.0.1:54331 | Main Supabase API endpoint |
| **REST** | http://127.0.0.1:54331/rest/v1 | PostgREST API for database access |
| **GraphQL** | http://127.0.0.1:54331/graphql/v1 | GraphQL API (if enabled) |
| **Edge Functions** | http://127.0.0.1:54331/functions/v1 | Serverless functions endpoint |
| **Storage** | http://127.0.0.1:54331/storage/v1/s3 | S3-compatible storage API |

### ⛁ Database Connection

```
postgresql://postgres:postgres@127.0.0.1:54332/postgres
```

**Quick connect:** Use this connection string with database tools like:
- **pgAdmin**
- **DBeaver**
- **psql CLI:** `psql postgresql://postgres:postgres@127.0.0.1:54332/postgres`

---

## Quick Start

### Zero-Config Development (Recommended)

**Just run `npm run dev`** — Supabase will automatically start if needed!

```bash
npm run dev  # Auto-ensures Supabase is running, applies migrations, starts Next.js
```

This works because:
1. `dev` calls `supabase:ensure`
2. `supabase:ensure` checks if Supabase is running
3. If **not running** → auto-runs `supabase:init` (start + push migrations)
4. If **already running** → continues immediately

---

### Manual Control (Optional)

If you prefer explicit control:

```bash
# Start Supabase manually (first time or after reboot)
npm run supabase:init

# Then run dev
npm run dev
```

---

### After Creating New Migrations

```bash
# Apply new migrations to local database
npm run supabase:push
```

---

### Stop Supabase

```bash
npm run supabase:stop
```

---

## Available Scripts

| Script | Description | When to Use |
|--------|-------------|-------------|
| `npm run dev` | **Auto-start everything** | ✅ Daily workflow |
| `npm run build` | Build for production (auto-ensures Supabase) | Before deployment |
| `npm run start` | Production server (auto-ensures Supabase) | Production mode |
| `npm run supabase:ensure` | Check if running, start if needed | Auto-called by dev/build/start |
| `npm run supabase:init` | **First time setup** - Start + apply migrations | First clone, after reboot |
| `npm run supabase:start` | Start Supabase containers | Manual control |
| `npm run supabase:stop` | Stop Supabase containers | End of day |
| `npm run supabase:restart` | Restart Supabase (stop + start) | After config changes |
| `npm run supabase:push` | Apply new migrations | After creating `.sql` files |
| `npm run supabase:reset` | Reset database ⚠️ **destroys data** (requires typing "YES") | Testing, fresh start |
| `npm run supabase:status` | Show running status and URLs | Troubleshooting |
| `npm run supabase:studio` | Open Supabase Studio in browser | Database admin UI |
| `npm run supabase:watch` | Auto-apply migrations on file changes | Heavy schema work |

---

## Safety Features

### Database Reset Protection

The `supabase:reset` command includes a confirmation prompt to prevent accidental data loss:

```bash
npm run supabase:reset
# ⚠️  WARNING: This will DESTROY ALL DATA!
# Type YES to confirm: _
```

**You must type exactly `YES`** (uppercase) to proceed. Any other input cancels the reset:

```bash
Type YES to confirm: NO
Reset cancelled
```

This safety mechanism prevents:
- Accidental execution
- Typos in terminal
- Copy-paste errors

---

## Workflow Examples

### Typical Day

```bash
# Morning - just run dev!
npm run dev  # Everything auto-starts ✅

# ... develop features ...

# End of day (optional)
npm run supabase:stop
```

### Adding Database Changes

```bash
# 1. Create migration file
echo "ALTER TABLE analyses ADD COLUMN foo TEXT;" > supabase/migrations/004_foo.sql

# 2. Apply it
npm run supabase:push

# Continue developing
npm run dev
```

### Heavy Schema Work (Auto-Push)

```bash
# Terminal 1 - Auto-apply migrations on save
npm run supabase:watch

# Terminal 2 - Dev server
npm run dev

# Now .sql file changes auto-apply!
```

---

## Performance Impact

### `supabase:ensure` Overhead
- **Check time:** <100ms (just runs `supabase status`)
- **If already running:** Zero additional startup time
- **If not running:** 10-30 seconds (same as manual `supabase:init`)

### `supabase:watch` (nodemon)
- **RAM usage:** ~10-20 MB  
- **CPU usage:** <0.1% (idle)
- **Only runs when:** You save `.sql` files
- **Recommendation:** Use only during schema work, not 24/7


## Running Multiple Supabase Projects

If switching between projects:

```bash
# Stop current project first
npx supabase stop

# Navigate to other project and start
cd /path/to/other-project
npx supabase start
```

To run **simultaneously**, each project needs unique ports in `supabase/config.toml`.

## Environment Variables

Ensure `.env.local` points to the correct API port:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54331
```

## Troubleshooting

**Port conflict error?**
```
Bind for 0.0.0.0:54322 failed: port is already allocated
```

→ Another Supabase instance is running. Stop it first:
```bash
npx supabase stop --project-id <other-project-id>
```

---

## Key Concepts

### How `supabase:ensure` Works

```bash
"supabase:ensure": "supabase status >/dev/null 2>&1 || npm run supabase:init"
```

**Breakdown:**
1. **`supabase status`** — Check if Supabase is running
2. **`>/dev/null 2>&1`** — Suppress output (silent check)
3. **`||`** — "OR" operator (if status fails...)
4. **`npm run supabase:init`** — ...then start and push migrations

**Result:** Zero-config development! Just `npm run dev`.

---

### `supabase db push --local`

Applies migration files from `supabase/migrations/` to your **local Docker database**.

- **`--local` flag:** Targets local dev (not production)
- **Idempotent:** Safe to run multiple times (only applies new migrations)
- **When to use:** After creating new `.sql` files

---

### `supabase link` (Production Only)

**Not needed for local development.** This connects your project to a remote Supabase cloud instance.

```bash
# For production deployment only
supabase link --project-ref your-project-ref
supabase db push  # (without --local flag)
```

**Local dev:** Uses Docker (no link needed)  
**Production:** Uses Supabase cloud (requires link)

## Configuration File

See [`supabase/config.toml`](../supabase/config.toml) for full configuration.
