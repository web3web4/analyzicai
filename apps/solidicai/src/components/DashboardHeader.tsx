import Link from "next/link";
import { Logo } from "@web3web4/shared-platform";
import { MobileNav } from "@/components/MobileNav";

export function DashboardHeader() {
  return (
    <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl relative">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Logo prefix="Solidic" containerSize="md" />
          </Link>
          <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
          <Link
            href="/dashboard"
            className="hidden md:block font-bold hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/dashboard/analyze"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Analyze
          </Link>
          <Link
            href="/dashboard/history"
            className="text-gray-400 hover:text-white transition-colors"
          >
            History
          </Link>
          <Link
            href="/dashboard/settings"
            className="text-gray-400 hover:text-white transition-colors"
          >
            Settings
          </Link>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-gray-400 hover:text-white transition-colors"
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
