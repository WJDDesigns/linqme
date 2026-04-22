import Link from "next/link";
import type { Metadata } from "next";
import LinqMeLogo from "@/components/LinqMeLogo";
import ThemeToggle from "@/components/ThemeToggle";
import ScrollReveal from "@/components/ScrollReveal";
import IntegrationsShowcase from "./IntegrationsShowcase";

export const metadata: Metadata = {
  title: "Integrations",
  description:
    "Connect your favorite tools -- cloud storage, AI, payments, CRM, automation, and more.",
};

export default function IntegrationsPage() {
  return (
    <main className="min-h-screen flex flex-col selection:bg-primary/30">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-8 py-4 bg-background/70 backdrop-blur-2xl border-b border-on-surface/[0.04]">
        <Link href="/" className="flex items-center gap-2.5">
          <LinqMeLogo variant="auto" className="h-7 w-auto text-primary" />
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link className="text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300" href="/#features">Features</Link>
          <Link className="text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300" href="/#how-it-works">How It Works</Link>
          <Link className="text-sm text-primary font-semibold transition-colors duration-300" href="/integrations">Integrations</Link>
          <Link className="text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300" href="/pricing">Pricing</Link>
          <Link className="text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300" href="/docs">Docs</Link>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle showAuto={false} />
          <div className="h-5 w-px bg-on-surface/10 hidden sm:block" />
          <Link href="/login" className="hidden sm:inline-flex text-sm text-on-surface-variant hover:text-on-surface transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 bg-primary text-on-primary font-semibold rounded-xl text-sm hover:shadow-[0_0_24px_rgba(var(--color-primary),0.4)] active:scale-[0.97] transition-all duration-300"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 md:pt-44 pb-16 md:pb-20 px-6 overflow-hidden text-center">
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        <div className="absolute inset-0 bg-dot-grid pointer-events-none" />
        <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/[0.16] rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-[10%] w-[400px] h-[300px] bg-tertiary/[0.10] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-[40%] left-[-5%] w-[300px] h-[250px] bg-inverse-primary/[0.06] rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4 animate-fade-up">Integrations</span>
          <h1 className="animate-fade-up delay-1 text-4xl md:text-6xl font-headline font-extrabold tracking-tight mb-6 leading-tight">
            Connect the tools<br />
            <span className="gradient-text-hero">you already use.</span>
          </h1>
          <p className="animate-fade-up delay-2 text-lg text-on-surface-variant/80 max-w-xl mx-auto">
            Cloud storage, AI, payments, CRM, automation, and more -- all wired into your forms with a few clicks.
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="px-6 pt-4 pb-24 md:pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-crosshatch pointer-events-none" />
        <div className="absolute inset-0 bg-aurora pointer-events-none" />
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[350px] bg-tertiary/[0.06] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-5%] w-[350px] h-[300px] bg-primary/[0.05] rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal animation="fade-up">
            <IntegrationsShowcase />
          </ScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24 md:pb-32 text-center relative overflow-hidden bg-surface-container-low/20">
        <div className="absolute inset-0 bg-ripple pointer-events-none" />
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-outline-variant/15 to-transparent" />
        <div className="max-w-3xl mx-auto relative z-10 pt-24 md:pt-32">
          <ScrollReveal animation="zoom-in">
            <div className="gradient-border rounded-3xl">
              <div className="relative glass-panel noise-overlay p-12 md:p-16 rounded-3xl overflow-hidden">
                <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-primary/[0.12] rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-1/3 h-1/3 bg-tertiary/[0.08] rounded-full blur-[60px] pointer-events-none" />
                <h2 className="text-3xl md:text-4xl font-headline font-bold mb-4 relative z-10">
                  Ready to connect <span className="gradient-text-hero">everything?</span>
                </h2>
                <p className="text-on-surface-variant mb-8 relative z-10 max-w-md mx-auto">
                  Start building forms and connecting your tools in minutes. No credit card required.
                </p>
                <Link
                  href="/signup"
                  className="relative z-10 inline-flex items-center gap-2 px-8 py-4 bg-primary text-on-primary font-bold rounded-xl hover:shadow-[0_0_40px_rgba(var(--color-primary),0.4)] transition-all duration-500 group"
                >
                  Get Started Free
                  <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-8 border-t border-on-surface/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5">
            <LinqMeLogo variant="auto" className="h-5 w-auto text-primary" />
          </Link>
          <div className="flex flex-wrap justify-center gap-8 text-xs text-on-surface-variant/40 uppercase tracking-widest font-label">
            <Link className="hover:text-primary transition-colors duration-300" href="/privacy">Privacy Policy</Link>
            <Link className="hover:text-primary transition-colors duration-300" href="/terms">Terms of Service</Link>
            <Link className="hover:text-primary transition-colors duration-300" href="/docs">Docs</Link>
            <Link className="hover:text-primary transition-colors duration-300" href="/status">Status</Link>
            <Link className="hover:text-primary transition-colors duration-300" href="/support">Contact</Link>
          </div>
          <div className="text-xs text-on-surface-variant/30">
            &copy; {new Date().getFullYear()} linqme
          </div>
        </div>
      </footer>
    </main>
  );
}
