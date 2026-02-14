import path from "node:path";
import type { NextConfig } from "next";
import { loadRootEnv } from "@web3web4/shared-platform/config/env";

const repoRoot = path.resolve(__dirname, "../..");
// Load env files if they exist (dev), but don't throw on production
loadRootEnv({ rootDir: repoRoot, throwIfMissing: false });

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
