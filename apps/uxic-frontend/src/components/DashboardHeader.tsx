import Link from "next/link";
import { Logo } from "@/components/Logo";

export function DashboardHeader() {
  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo />

          <div className="text-white px-4 text-shadow-[2px_2px_9px_rgba(0,0,0,1)]">
            Dashboard
          </div>
        </Link>

        <nav className="flex items-center gap-6">
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
      </div>
    </header>
  );
}
