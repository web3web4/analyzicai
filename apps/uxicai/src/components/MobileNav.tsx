"use client";

import { useState } from "react";
import Link from "next/link";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 -mr-2 text-muted hover:text-foreground transition-colors"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-[73px] left-0 right-0 bg-background border-b border-border p-4 shadow-xl z-50 animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              className="px-4 py-2 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/analyze"
              className="px-4 py-2 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Analyze
            </Link>
            <Link
              href="/dashboard/history"
              className="px-4 py-2 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              History
            </Link>
            <form action="/api/auth/signout" method="post" className="w-full">
              <button
                type="submit"
                className="w-full text-left px-4 py-2 text-muted hover:text-foreground hover:bg-surface rounded-lg transition-colors"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      )}
    </div>
  );
}
