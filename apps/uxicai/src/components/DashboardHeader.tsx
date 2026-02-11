import Link from "next/link";
import { Logo } from "@/components/Logo";
import { MobileNav } from "@/components/MobileNav";

export function DashboardHeader() {
  return (
    <header className="border-b border-border relative">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo size="md" />
          </Link>
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
