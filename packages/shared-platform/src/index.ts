// Auth utilities - BROWSER SAFE ONLY
// Server-only modules must be imported directly:
// - import { checkRateLimit } from "@web3web4/shared-platform/auth/rate-limit"
// - import { isAdmin, requireAdmin } from "@web3web4/shared-platform/auth/admin"
// - import { middleware } from "@web3web4/shared-platform/auth/middleware"
export * from "./auth/crypto";

// Supabase clients - BROWSER ONLY
// Server components and API routes must import directly:
// - import { createClient, createServiceClient } from "@web3web4/shared-platform/supabase/server"
export { createBrowserClient } from "./supabase/client";

// UI Components
export * from "./components/index";

// Hooks
export * from "./hooks/index";

// Pages
export { default as AdminUsersPage } from "./pages/AdminUsersPage";
export { default as SettingsPage } from "./pages/SettingsPage";
export { default as SuspendedPage } from "./pages/SuspendedPage";

// Config
export * from "./config/models";

// API Handlers - Must import directly to avoid server/client conflicts
// - import { handleX } from "@web3web4/shared-platform/api-handlers"
