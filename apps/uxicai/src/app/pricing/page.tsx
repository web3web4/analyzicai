import Link from "next/link";
import { Logo } from "@web3web4/ui-library";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-web4-purple/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full">
        <div className="mb-12 flex justify-center">
          <Logo containerSize="lg" />
        </div>

        <div className="glass-card rounded-3xl p-12 border border-border/50 backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-web4-purple/10 border border-brand-web4-purple/20 text-brand-web4-purple text-xs font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-web4-purple opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-web4-purple"></span>
            </span>
            Coming Soon
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight leading-[1.15]">
            Premium Analysis <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-brand-web4-purple">
              Simplified Pricing.
            </span>
          </h1>

          <p className="text-muted text-lg mb-10 max-w-lg mx-auto leading-relaxed">
            We're putting the finishing touches on our flexible subscription
            plans. Soon you'll be able to choose the perfect tier for your
            product team's workflow.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="px-8 py-4 rounded-xl bg-surface-light hover:bg-surface-lighter font-medium transition-all border border-border/50 text-foreground"
            >
              Return Home
            </Link>
          </div>
        </div>

        <p className="mt-12 text-sm text-muted-foreground">
          Part of the{" "}
          <span className="text-foreground font-medium">
            AnalyzicAI Ecosystem
          </span>{" "}
          by Web3Web4
        </p>
      </div>
    </div>
  );
}
