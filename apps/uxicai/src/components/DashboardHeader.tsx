import Link from "next/link";
import { Logo } from "@web3web4/shared-platform";
import { MobileNav } from "@/components/MobileNav";

export function DashboardHeader() {
  return (
    <header className="border-b border-border relative">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo prefix="UXic" containerSize="md" />
          </Link>
          <span className="text-xs px-2 py-0.5 rounded-full border border-border border-foreground text-foreground font-mono sm:inline">
            v1 pre-alpha
          </span>
          <div className="h-8 w-[1px] bg-border hidden md:block" />
          <Link
            href="/dashboard"
            className="hidden md:block hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-muted hover:text-foreground transition-colors"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="text-muted hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/analyze"
            className="text-muted hover:text-foreground transition-colors"
          >
            Analyze
          </Link>
          <Link
            href="/dashboard/history"
            className="text-muted hover:text-foreground transition-colors"
          >
            History
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-muted hover:text-foreground transition-colors"
          >
            Settings
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-muted hover:text-foreground transition-colors"
            >
              Sign out
            </button>
          </form>
        </nav>

        {/* Mobile Navigation */}
        <MobileNav />
      </div>
    </header>
  );
}
