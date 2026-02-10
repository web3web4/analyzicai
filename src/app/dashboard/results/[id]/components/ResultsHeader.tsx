import Link from "next/link";
import { Logo } from "@/components/Logo";

export function ResultsHeader() {
  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo />
        </Link>

        <Link
          href="/dashboard"
          className="text-muted hover:text-foreground transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </header>
  );
}
