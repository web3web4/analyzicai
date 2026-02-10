import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
          <div
            className="absolute top-60 -left-20 w-60 h-60 bg-accent/20 rounded-full blur-3xl animate-pulse-glow"
            style={{ animationDelay: "1.5s" }}
          />
        </div>

        <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-22 h-22 rounded-xl bg-surface-light font-extrabold text-3xl flex flex-col items-center justify-center shadow-[0px_0px_9px_rgba(200,220,255,1)]">
              <div className="text-primary text-shadow-[2px_2px_9px_rgba(0,0,0,1)]">
                UXic
              </div>
              <div className="text-brand-web4-purple text-shadow-[2px_2px_9px_rgba(0,0,0,1)]">
                AI
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-muted hover:text-foreground transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="btn-primary px-5 py-2 rounded-full text-white font-medium"
            >
              Get Started
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface border border-border mb-8">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm text-muted">
              Powered by GPT, Gemini & Claude
            </span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            AI-Powered <span className="gradient-text">UI/UX Analysis</span>
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10">
            Upload a screenshot or capture your screen. Get comprehensive design
            feedback from multiple AI vision models that identify issues and
            suggest improvements.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="btn-primary px-8 py-4 rounded-full text-white font-semibold text-lg glow"
            >
              Start Analyzing Free
            </Link>
            <Link
              href="#features"
              className="btn-secondary px-8 py-4 rounded-full font-semibold text-lg"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Multi-Provider Intelligence
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              We don&apos;t rely on a single AI. Our 3-step pipeline combines
              insights from multiple models for more accurate, comprehensive
              analysis.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* First Step */}
            <div className="glass-card rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-primary">1st</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                First Step: Initial Analysis
              </h3>
              <p className="text-muted">
                Each AI provider independently analyzes your UI/UX, scoring
                categories like color contrast, typography, accessibility, and
                visual hierarchy.
              </p>
            </div>

            {/* Intermediate Step */}
            <div className="glass-card rounded-2xl p-8 opacity-60">
              <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center mb-6">
                <span className="text-lg font-bold text-accent">V2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Intermediate Step
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-accent/20 text-accent">
                  Coming in V2
                </span>
              </h3>
              <p className="text-muted">
                Planned for version 2: Providers will review each other&apos;s
                findings, reconsidering their assessments and catching blind
                spots.
              </p>
            </div>

            {/* Last Step */}
            <div className="glass-card rounded-2xl p-8">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mb-6">
                <span className="text-xl font-bold text-success">3rd</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">
                Last Step: Master Synthesis
              </h3>
              <p className="text-muted">
                Your trusted provider synthesizes all insights into a final,
                actionable report with prioritized recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 px-6 bg-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive Evaluation
            </h2>
            <p className="text-muted text-lg max-w-2xl mx-auto">
              Every analysis covers 8 critical UI/UX categories with detailed
              observations and actionable recommendations.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Color & Contrast", icon: "🎨" },
              { name: "Typography", icon: "✏️" },
              { name: "Layout", icon: "📐" },
              { name: "Navigation", icon: "🧭" },
              { name: "Accessibility", icon: "♿" },
              { name: "Visual Hierarchy", icon: "👁️" },
              { name: "Whitespace", icon: "⬜" },
              { name: "Consistency", icon: "🔄" },
            ].map((cat) => (
              <div
                key={cat.name}
                className="flex items-center gap-3 p-4 rounded-xl bg-surface-light hover:bg-border transition-colors"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="font-medium">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to improve your designs?
          </h2>
          <p className="text-muted text-lg mb-10">
            Get started with 10 free analyses per day. No credit card required.
          </p>
          <Link
            href="/signup"
            className="btn-primary px-10 py-4 rounded-full text-white font-semibold text-lg glow inline-block"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-4 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-13 h-13 rounded-xl bg-surface-light font-extrabold flex flex-col items-center justify-center 
              shadow-[0px_0px_5px_rgba(200,220,255,1)]
              text-shadow-[2px_2px_6px_rgba(0,0,0,1)]">
              <div className="text-primary">
                UXic
              </div>
              <div className="text-brand-web4-purple">
                AI
              </div>
            </div>
          </div>
          <p className="text-sm text-muted">
            © 2026 UXicAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
