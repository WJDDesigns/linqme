import Link from "next/link";

export default function LandingPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "/login";
  return (
    <main className="min-h-screen flex flex-col selection:bg-primary/30">
      {/* Top Nav */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-6 md:px-8 py-4 bg-background/70 backdrop-blur-2xl border-b border-on-surface/[0.04]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-tertiary flex items-center justify-center">
            <span className="text-white text-sm font-bold">S</span>
          </div>
          <span className="text-lg font-bold font-headline text-on-surface tracking-tight">SiteLaunch</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a className="text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300" href="#features">Features</a>
          <a className="text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300" href="#how-it-works">How It Works</a>
          <a className="text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300" href="#pricing">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline-flex text-sm text-on-surface-variant hover:text-on-surface transition-colors">
            Sign in
          </Link>
          <Link
            href={`${appUrl}/signup`}
            className="px-5 py-2 bg-primary text-on-primary font-semibold rounded-xl text-sm hover:shadow-[0_0_24px_rgba(var(--color-primary),0.4)] active:scale-[0.97] transition-all duration-300"
          >
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-36 md:pt-44 pb-24 md:pb-32 px-6 overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 gradient-mesh pointer-events-none" />
        {/* Radial hero spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-primary/[0.08] via-primary/[0.02] to-transparent rounded-full blur-3xl pointer-events-none" />
        {/* Decorative floating orbs */}
        <div className="absolute top-32 left-[10%] w-3 h-3 rounded-full bg-primary/30 float hidden md:block" />
        <div className="absolute top-48 right-[15%] w-2 h-2 rounded-full bg-tertiary/40 float-delayed hidden md:block" />
        <div className="absolute bottom-32 left-[20%] w-2.5 h-2.5 rounded-full bg-inverse-primary/30 float hidden md:block" />
        <div className="absolute bottom-40 right-[25%] w-1.5 h-1.5 rounded-full bg-primary/20 float-delayed hidden md:block" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel border border-primary/15 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-glow-pulse" />
            <span className="text-xs font-semibold text-on-surface-variant tracking-wide">Now in Public Beta</span>
          </div>

          <h1 className="animate-fade-up delay-1 text-5xl md:text-7xl lg:text-[5.5rem] font-headline font-extrabold tracking-tight mb-8 leading-[1.05]">
            The <span className="gradient-text-hero italic">&ldquo;Send Me Your Content&rdquo;</span>
            <br className="hidden md:block" />
            <span className="text-on-surface">Phase, Solved.</span>
          </h1>

          <p className="animate-fade-up delay-2 max-w-2xl mx-auto text-lg md:text-xl text-on-surface-variant/80 font-body mb-12 leading-relaxed">
            Automate your agency&apos;s client onboarding with a white-label portal that
            collects assets, feedback, and approvals&mdash;while you sleep.
          </p>

          <div className="animate-fade-up delay-3 flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link
              href="/signup"
              className="group relative px-8 py-4 bg-primary text-on-primary font-bold rounded-xl hover:shadow-[0_0_40px_rgba(var(--color-primary),0.35)] transition-all duration-500 text-base"
            >
              Start Your Free Portal
              <i className="fa-solid fa-arrow-right ml-2 text-sm group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 glass-panel border border-outline-variant/15 rounded-xl hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-300 text-on-surface font-medium"
            >
              Sign in
            </Link>
          </div>

          <p className="animate-fade-up delay-4 text-xs text-on-surface-variant/50">
            Free forever &middot; No credit card required &middot; Setup in 2 minutes
          </p>
        </div>

        {/* Hero UI preview mockup */}
        <div className="animate-slide-up delay-5 max-w-4xl mx-auto mt-16 md:mt-20 relative">
          <div className="gradient-border rounded-2xl">
            <div className="relative rounded-2xl overflow-hidden bg-surface-container border border-outline-variant/10 shadow-[0_32px_80px_rgba(0,0,0,0.3)]">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3 bg-surface-container-high/50 border-b border-outline-variant/10">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-error/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-tertiary/30" />
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/30" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-6 rounded-lg bg-surface-container-lowest/60 flex items-center px-3">
                    <i className="fa-solid fa-lock text-[8px] text-tertiary/60 mr-2" />
                    <span className="text-[10px] text-on-surface-variant/40 font-mono">youragency.mysitelaunch.com</span>
                  </div>
                </div>
              </div>
              {/* Dashboard mockup content */}
              <div className="p-6 md:p-8 space-y-4">
                <div className="flex gap-4">
                  <div className="w-32 h-full rounded-xl bg-surface-container-low p-4 hidden md:block space-y-3">
                    <div className="h-6 w-20 bg-primary/10 rounded-lg" />
                    <div className="h-3 w-16 bg-on-surface/5 rounded" />
                    <div className="h-3 w-24 bg-on-surface/5 rounded" />
                    <div className="h-3 w-14 bg-on-surface/5 rounded" />
                    <div className="h-3 w-20 bg-primary/10 rounded" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="h-6 w-32 bg-on-surface/10 rounded-lg" />
                      <div className="h-8 w-28 bg-primary/15 rounded-lg" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-20 rounded-xl bg-surface-container-low p-3 space-y-2">
                        <div className="h-2 w-12 bg-on-surface-variant/10 rounded" />
                        <div className="h-5 w-8 bg-primary/20 rounded" />
                      </div>
                      <div className="h-20 rounded-xl bg-surface-container-low p-3 space-y-2">
                        <div className="h-2 w-14 bg-on-surface-variant/10 rounded" />
                        <div className="h-5 w-6 bg-tertiary/20 rounded" />
                      </div>
                      <div className="h-20 rounded-xl bg-surface-container-low p-3 space-y-2">
                        <div className="h-2 w-10 bg-on-surface-variant/10 rounded" />
                        <div className="h-5 w-12 bg-on-surface/10 rounded" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 rounded-xl bg-surface-container-low flex items-center px-4 gap-3">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 shrink-0" />
                          <div className="h-2.5 flex-1 bg-on-surface/5 rounded max-w-[200px]" />
                          <div className="h-5 w-16 bg-tertiary/10 rounded-full ml-auto" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow under mockup */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-3/4 h-16 bg-primary/10 blur-[60px] rounded-full" />
        </div>
      </section>

      {/* Social proof / trust strip */}
      <section className="py-12 border-y border-on-surface/[0.04]">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-on-surface-variant/40 font-semibold mb-6">Trusted by agencies and creative teams worldwide</p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 items-center text-on-surface-variant/20">
            {["Agency Co", "Studio X", "PixelForge", "BrandHive", "CreativOps"].map((name) => (
              <span key={name} className="text-lg md:text-xl font-headline font-bold tracking-tight">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 md:mb-20">
            <span className="inline-block text-xs font-bold text-tertiary uppercase tracking-[0.2em] mb-4">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-on-surface leading-tight">
              Zero friction from<br className="hidden md:block" /> draft to launch.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <StepCard
              num={1}
              title="Deploy Your Portal"
              desc="Send a personalized, white-labeled link to your client. No login required for them, full control for you."
              icon="fa-rocket"
              delay="delay-1"
            />
            <StepCard
              num={2}
              title="Collect with Precision"
              desc="Clients fill out a step-by-step onboarding form and drag-and-drop assets into pre-defined containers."
              icon="fa-bullseye"
              delay="delay-2"
            />
            <StepCard
              num={3}
              title="Launch Faster"
              desc="Get notified the moment everything is submitted. All files and data organized in one dashboard."
              icon="fa-bolt"
              delay="delay-3"
            />
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section id="features" className="py-24 md:py-32 px-6 relative">
        {/* Subtle background accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Features</span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4">Built for the Modern Agency</h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto">Sophisticated tools wrapped in a silent, beautiful interface.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1 — wide */}
            <div className="md:col-span-2 group relative rounded-2xl overflow-hidden glow-card">
              <div className="gradient-border rounded-2xl">
                <div className="relative glass-panel noise-overlay p-8 md:p-10 rounded-2xl min-h-[220px] flex flex-col justify-end">
                  <div className="absolute top-6 right-6 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                    <i className="fa-solid fa-wand-magic-sparkles text-lg" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Total White-Labeling</h3>
                    <p className="text-on-surface-variant max-w-md">Your brand, your domain, your favicon. Your clients will never know SiteLaunch exists.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-2xl overflow-hidden glow-card">
              <div className="relative bg-surface-container-high/60 noise-overlay p-8 rounded-2xl border border-outline-variant/10 min-h-[220px] flex flex-col justify-end">
                <div className="absolute top-6 right-6 w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform duration-500">
                  <i className="fa-solid fa-sitemap text-lg" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Multi-tenant Control</h3>
                  <p className="text-on-surface-variant text-sm">Manage many projects from a single unified workspace with team permissions.</p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-2xl overflow-hidden glow-card">
              <div className="relative bg-surface-container-high/60 noise-overlay p-8 rounded-2xl border border-outline-variant/10 min-h-[220px] flex flex-col justify-end">
                <div className="absolute top-6 right-6 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
                  <i className="fa-solid fa-pen-ruler text-lg" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2">Drag-and-Drop Builder</h3>
                  <p className="text-on-surface-variant text-sm">Create custom onboarding flows in seconds. No code required.</p>
                </div>
              </div>
            </div>

            {/* Feature 4 — wide */}
            <div className="md:col-span-2 group relative rounded-2xl overflow-hidden glow-card">
              <div className="gradient-border rounded-2xl">
                <div className="relative glass-panel noise-overlay p-8 md:p-10 rounded-2xl min-h-[220px] flex flex-col justify-end">
                  <div className="absolute top-6 right-6 w-12 h-12 rounded-xl bg-tertiary/10 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform duration-500">
                    <i className="fa-solid fa-shield-halved text-lg" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Encrypted Asset Storage</h3>
                    <p className="text-on-surface-variant max-w-md">Secure file storage with signed URLs. Your client&apos;s data is safe and accessible only to authorized users.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-outline-variant/15 to-transparent" />
        {/* Pricing glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4">Choose Your Orbit</h2>
            <p className="text-on-surface-variant text-lg">Simple, transparent pricing for growing agencies.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
            <PricingCard
              name="Starlink"
              price="Free"
              period="forever"
              features={["1 submission / month", "Branded workspace", "Unlimited form fields", "File uploads"]}
              cta="Get Started"
              href="/signup"
            />
            <PricingCard
              name="Supernova"
              price="$149"
              period="/mo"
              features={["Unlimited submissions", "Full white-labeling", "Custom domain mapping", "500GB storage", "Priority support"]}
              cta="Go Pro"
              href="mailto:hello@mysitelaunch.com?subject=Upgrade%20to%20Supernova"
              highlight
            />
            <PricingCard
              name="Galactic"
              price="$399"
              period="/mo"
              features={["Enterprise API access", "Priority 24/7 support", "Custom integration setup", "Dedicated account manager"]}
              cta="Contact Sales"
              href="mailto:hello@mysitelaunch.com?subject=Galactic%20plan"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 px-6 text-center relative">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-border rounded-3xl">
            <div className="relative glass-panel noise-overlay p-12 md:p-20 rounded-3xl overflow-hidden">
              {/* CTA background glow */}
              <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-primary/[0.06] rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-1/3 h-1/3 bg-tertiary/[0.04] rounded-full blur-[60px] pointer-events-none" />

              <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6 relative z-10">
                Ready to stop chasing content?
              </h2>
              <p className="text-on-surface-variant mb-10 text-lg relative z-10 max-w-xl mx-auto">
                Join agencies that have automated their client pipeline and shipped faster.
              </p>
              <Link
                href="/signup"
                className="relative z-10 inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-primary to-inverse-primary text-on-primary font-bold rounded-xl hover:shadow-[0_0_50px_rgba(var(--color-primary),0.4)] transition-all duration-500 text-lg group"
              >
                Launch Your Portal Now
                <i className="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-8 border-t border-on-surface/[0.06]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary to-tertiary flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">S</span>
            </div>
            <span className="text-sm font-bold text-on-surface font-headline">SiteLaunch</span>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-xs text-on-surface-variant/40 uppercase tracking-widest font-label">
            <a className="hover:text-primary transition-colors duration-300" href="#">Privacy Policy</a>
            <a className="hover:text-primary transition-colors duration-300" href="#">Terms of Service</a>
            <a className="hover:text-primary transition-colors duration-300" href="#">Contact</a>
          </div>
          <div className="text-xs text-on-surface-variant/30">
            &copy; {new Date().getFullYear()} SiteLaunch
          </div>
        </div>
      </footer>
    </main>
  );
}

function StepCard({ num, title, desc, icon, delay }: { num: number; title: string; desc: string; icon: string; delay: string }) {
  return (
    <div className={`animate-fade-up ${delay} group relative`}>
      <div className="relative glass-panel noise-overlay rounded-2xl border border-outline-variant/10 p-8 h-full hover:border-primary/20 transition-all duration-500 glow-card">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold font-headline group-hover:bg-primary/15 transition-colors">
            {num}
          </div>
          <div className="w-10 h-10 rounded-xl bg-surface-container-high/60 flex items-center justify-center text-on-surface-variant/40 group-hover:text-primary transition-colors">
            <i className={`fa-solid ${icon}`} />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-3 relative z-10">{title}</h3>
        <p className="text-on-surface-variant relative z-10 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function PricingCard({
  name,
  price,
  period,
  features,
  cta,
  href,
  highlight,
}: {
  name: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl flex flex-col transition-all duration-500 ${
        highlight
          ? "md:-mt-4 md:mb-4"
          : ""
      }`}
    >
      {highlight && (
        <div className="gradient-border rounded-2xl h-full">
          <div className="relative glass-panel noise-overlay rounded-2xl p-8 md:p-10 flex flex-col h-full">
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            <div className="inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <i className="fa-solid fa-star text-[8px] text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Most Popular</span>
            </div>
            <h3 className="text-lg font-bold mb-2">{name}</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-headline font-extrabold gradient-text">{price}</span>
              <span className="text-on-surface-variant">{period}</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm">
                  <div className="w-5 h-5 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
                    <i className="fa-solid fa-check text-tertiary text-[9px]" />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={href}
              className="w-full py-3.5 text-center rounded-xl font-bold text-sm bg-primary text-on-primary hover:shadow-[0_0_30px_rgba(var(--color-primary),0.4)] transition-all duration-500"
            >
              {cta}
            </Link>
          </div>
        </div>
      )}
      {!highlight && (
        <div className="bg-surface-container-low/60 border border-outline-variant/10 rounded-2xl p-8 md:p-10 flex flex-col h-full hover:border-primary/15 transition-all duration-500 glow-card">
          <h3 className="text-lg font-bold mb-2">{name}</h3>
          <div className="flex items-baseline gap-1 mb-6">
            <span className="text-5xl font-headline font-extrabold">{price}</span>
            <span className="text-on-surface-variant">{period}</span>
          </div>
          <ul className="space-y-4 mb-8 flex-grow">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-check text-on-surface-variant/60 text-[9px]" />
                </div>
                <span className="text-on-surface-variant">{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href={href}
            className="w-full py-3.5 text-center rounded-xl font-bold text-sm border border-outline-variant/20 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
          >
            {cta}
          </Link>
        </div>
      )}
    </div>
  );
}
