"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export interface MobileNavProps {
  isAdmin?: boolean;
  theme?: "uxic" | "solidic";
}

export function MobileNav({ isAdmin = false, theme = "uxic" }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Theme-specific styles
  const themeStyles = {
    uxic: {
      button: "text-muted hover:text-foreground",
      menu: "bg-background border-b border-border",
      link: "text-muted hover:text-foreground hover:bg-surface",
    },
    solidic: {
      button: "text-gray-400 hover:text-white",
      menu: "bg-black border-b border-white/10",
      link: "text-gray-400 hover:text-white hover:bg-white/5",
    },
  };

  const styles = themeStyles[theme];

  return (
    <div className="md:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 -mr-2 transition-colors ${styles.button}`}
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {isOpen && (
        <div className={`absolute top-[73px] left-0 right-0 p-4 shadow-xl z-50 animate-in slide-in-from-top-2 ${styles.menu}`}>
          <nav className="flex flex-col gap-4">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg transition-colors ${styles.link}`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className={`px-4 py-2 rounded-lg transition-colors ${styles.link}`}
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/analyze"
              className={`px-4 py-2 rounded-lg transition-colors ${styles.link}`}
              onClick={() => setIsOpen(false)}
            >
              Analyze
            </Link>
            <Link
              href="/dashboard/history"
              className={`px-4 py-2 rounded-lg transition-colors ${styles.link}`}
              onClick={() => setIsOpen(false)}
            >
              History
            </Link>
            <Link
              href="/dashboard/settings"
              className={`px-4 py-2 rounded-lg transition-colors ${styles.link}`}
              onClick={() => setIsOpen(false)}
            >
              Settings
            </Link>
            {isAdmin && (
              <Link
                href="/admin/users"
                className={`px-4 py-2 rounded-lg transition-colors ${styles.link}`}
                onClick={() => setIsOpen(false)}
              >
                Admin
              </Link>
            )}
            <form action="/api/auth/signout" method="post" className="w-full">
              <button
                type="submit"
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${styles.link}`}
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
