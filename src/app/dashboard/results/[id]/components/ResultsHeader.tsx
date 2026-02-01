import Link from "next/link";

export function ResultsHeader() {
  return (
    <header className="border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
            <span className="text-white font-bold text-sm">U</span>
          </div>
          <span className="font-semibold">UXicAI</span>
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
