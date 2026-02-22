import Link from "next/link";
import { Logo } from "../components/Logo";
import { MobileNav } from "./MobileNav";
import { createClient } from "../supabase/server";

export interface DashboardHeaderProps {
  /** Theme variant for styling */
  theme?: "uxic" | "solidic";
  /** App prefix for logo */
  prefix: "UXic" | "Solidic";
  /** Custom class name for header */
  className?: string;
}

export async function DashboardHeader({ theme = "uxic", prefix, className }: DashboardHeaderProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();
    isAdmin = profile?.is_admin ?? false;
  }

  // Theme-specific styles
  const themeStyles = {
    uxic: {
      header: "border-b border-border relative",
      badge: "border border-border border-foreground text-foreground",
      divider: "bg-border",
      brandLink: "hover:text-foreground",
      navLink: "text-muted hover:text-foreground",
      button: "text-muted hover:text-foreground",
    },
    solidic: {
      header: "border-b border-white/10 bg-black/50 backdrop-blur-xl relative",
      badge: "border border-primary text-primary",
      divider: "bg-white/10",
      brandLink: "font-bold hover:text-primary",
      navLink: "text-gray-400 hover:text-white",
      button: "text-gray-400 hover:text-white",
    },
  };

  const styles = themeStyles[theme];

  return (
    <header className={className || styles.header}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo prefix={prefix} containerSize="md" />
          </Link>
          <span className={`text-xs px-2 py-0.5 rounded-full font-mono hidden sm:inline ${styles.badge}`}>
            v1 pre-alpha
          </span>
          <div className={`h-8 w-[1px] hidden md:block ${styles.divider}`} />
          <Link
            href="/dashboard"
            className={`hidden md:block transition-colors ${styles.brandLink}`}
          >
            Dashboard
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className={`transition-colors ${styles.navLink}`}>
            Home
          </Link>
          <Link href="/dashboard" className={`transition-colors ${styles.navLink}`}>
            Dashboard
          </Link>
          <Link href="/dashboard/analyze" className={`transition-colors ${styles.navLink}`}>
            Analyze
          </Link>
          <Link href="/dashboard/history" className={`transition-colors ${styles.navLink}`}>
            History
          </Link>
          <Link href="/dashboard/settings" className={`transition-colors ${styles.navLink}`}>
            Settings
          </Link>
          {isAdmin && (
            <Link href="/admin/users" className={`transition-colors ${styles.navLink}`}>
              Admin
            </Link>
          )}
          <form action="/api/auth/signout" method="post">
            <button type="submit" className={`transition-colors ${styles.button}`}>
              Sign out
            </button>
          </form>
        </nav>

        {/* Mobile Navigation */}
        <MobileNav isAdmin={isAdmin} theme={theme} />
      </div>
    </header>
  );
}
