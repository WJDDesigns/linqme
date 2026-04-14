import Link from "next/link";

export default function LandingPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "/login";
  return (
    <main className="min-h-screen flex flex-col selection:bg-primary/30">
      {/* Top Nav */}
      <nav className="fixed top-0 w-full z-50 flex justify-between items-center px-8 py-4 bg-background/60 backdrop-blur-xl shadow-[0_20px_60px_rgba(218,226,253,0.04)]">
        <div className="text-xl font-bold font-headline text-on-surface tracking-tight">SiteLaunch</div>
        <div className="hidden md:flex items-center gap-8">
          <a className="text-primary font-semibold border-b-2 border-primary pb-1 transition-colors duration-300 text-sm" href="#">Product</a>
          <a className="text-on-surface/70 hover:text-primary transition-colors duration-300 text-sm" href="#">Solutions</a>
          <a className="text-on-surface/70 hover:text-primary transition-colors duration-300 text-sm" href="#">Pricing</a>
        </div>
        <Link
          href={`${appUrl}/signup`}
          className="px-6 py-2 bg-gradient-to-r from-primary to-inverse-primary text-on-primary font-semibold rounded-md active:scale-95 transition-transform text-sm"
        >
          Get Started
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-primary-container/20 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-headline font-extrabold tracking-tight mb-6 leading-[1.1]">
            The <span className="text-primary italic">&ldquo;Send Me Your Content&rdquo;</span>
            <br />Phase, Solved.
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-on-surface-variant font-body mb-10 leading-relaxed">
            Automate your agency&apos;s client onboarding with a white-label portal that collects assets, feedback, and approvals while you sleep.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link
              href="/signup"
              className="px-8 py-4 bg-primary text-on-primary font-bold rounded-md hover:shadow-[0_0_20px_rgba(192,193,255,0.4)] transition-all duration-300"
            >
              Start Your Free Orbit
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 glass-panel border border-outline-variant/20 rounded-md hover:bg-surface-variant/60 transition-all"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-surface-container-lowest">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
            <div className="md:col-span-5">
              <span className="text-tertiary font-label uppercase tracking-widest text-xs mb-4 block">The Process</span>
              <h2 className="text-4xl md:text-5xl font-headline font-bold mb-6 text-on-surface leading-tight">
                Zero friction from draft to launch.
              </h2>
              <p className="text-on-surface-variant mb-8 text-lg">
                We&apos;ve distilled the chaotic back-and-forth of project collection into three crystalline stages.
              </p>
            </div>
            <div className="md:col-span-7 grid gap-8">
              <Step num={1} title="Deploy Your Portal" desc="Send a personalized, white-labeled link to your client. No login required for them, full control for you." />
              <Step num={2} title="Collect with Precision" desc="Clients fill out a step-by-step onboarding form and drag-and-drop assets into pre-defined containers." />
              <Step num={3} title="Launch Faster" desc="Get notified the moment everything is submitted. All files and data organized in one dashboard, ready for your workflow." />
            </div>
          </div>
        </div>
      </section>

      {/* Features Bento Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-headline font-bold mb-4">Built for the Modern Agency</h2>
            <p className="text-on-surface-variant">Sophisticated tools wrapped in a silent interface.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-panel p-8 rounded-xl border border-outline-variant/10 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 text-xl">&#9670;</div>
                <h3 className="text-2xl font-bold mb-3">Total White-Labeling</h3>
                <p className="text-on-surface-variant max-w-sm">Your brand, your domain, your favicon. Your clients will never know SiteLaunch exists.</p>
              </div>
            </div>
            <div className="bg-surface-container-high p-8 rounded-xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary mb-4 text-xl">&#9635;</div>
                <h3 className="text-xl font-bold mb-3">Multi-tenant Control</h3>
              </div>
              <p className="text-on-surface-variant text-sm">Manage many projects from a single unified workspace. Permission levels for every team member.</p>
            </div>
            <div className="bg-surface-container-high p-8 rounded-xl flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 text-xl">&#9783;</div>
                <h3 className="text-xl font-bold mb-3">Drag-and-Drop Builder</h3>
              </div>
              <p className="text-on-surface-variant text-sm">Create custom onboarding flows in seconds. No code required. Just pure creative speed.</p>
            </div>
            <div className="md:col-span-2 glass-panel p-8 rounded-xl border border-outline-variant/10 flex items-center justify-between">
              <div className="max-w-md">
                <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary mb-4 text-xl">&#9919;</div>
                <h3 className="text-2xl font-bold mb-3">Encrypted Asset Storage</h3>
                <p className="text-on-surface-variant">Secure file storage with signed URLs. Your client&apos;s data is safe and accessible only to authorized users.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-gradient-to-b from-background to-surface-container-low">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-headline font-bold mb-4">Choose Your Orbit</h2>
            <p className="text-on-surface-variant">Simple, transparent pricing for growing agencies.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              features={["Unlimited submissions", "Full white-labeling", "Custom domain mapping", "500GB storage"]}
              cta="Go Pro"
              href="mailto:hello@mysitelaunch.com?subject=Upgrade%20to%20Supernova"
              highlight
            />
            <PricingCard
              name="Galactic"
              price="$399"
              period="/mo"
              features={["Enterprise API access", "Priority 24/7 support", "Custom integration setup"]}
              cta="Contact Sales"
              href="mailto:hello@mysitelaunch.com?subject=Galactic%20plan"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center">
        <div className="max-w-4xl mx-auto glass-panel p-16 rounded-3xl border border-primary/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <h2 className="text-4xl font-headline font-bold mb-6 relative z-10">Ready to stop chasing content?</h2>
          <p className="text-on-surface-variant mb-10 text-lg relative z-10">Join agencies that have automated their client pipeline.</p>
          <Link
            href="/signup"
            className="relative z-10 inline-block px-10 py-5 bg-tertiary text-on-tertiary font-bold rounded-md hover:shadow-[0_0_20px_rgba(60,221,199,0.4)] transition-all text-lg"
          >
            Launch Your Portal Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-12 px-8 flex flex-col items-center gap-6 border-t border-on-surface/10 font-label text-xs uppercase tracking-widest">
        <div className="text-md font-bold text-on-surface font-headline">SiteLaunch</div>
        <div className="flex flex-wrap justify-center gap-8 text-on-surface/40">
          <a className="hover:text-tertiary transition-colors duration-300" href="#">Privacy Policy</a>
          <a className="hover:text-tertiary transition-colors duration-300" href="#">Terms of Service</a>
          <a className="hover:text-tertiary transition-colors duration-300" href="#">Contact</a>
        </div>
        <div className="text-on-surface/30 mt-4">
          &copy; {new Date().getFullYear()} SiteLaunch. The Cosmic Curator.
        </div>
      </footer>
    </main>
  );
}

function Step({ num, title, desc }: { num: number; title: string; desc: string }) {
  return (
    <div className="flex gap-6 items-start group">
      <div className="flex-shrink-0 w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center text-primary font-headline font-bold text-xl group-hover:bg-primary/10 transition-colors">
        {num}
      </div>
      <div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-on-surface-variant">{desc}</p>
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
      className={`p-8 rounded-xl flex flex-col ${
        highlight
          ? "glass-panel border-2 border-primary relative scale-105 z-10 shadow-2xl"
          : "bg-surface-container-low border border-outline-variant/10"
      }`}
    >
      {highlight && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] uppercase font-bold tracking-widest px-4 py-1 rounded-full">
          Most Popular
        </div>
      )}
      <h3 className="text-lg font-bold mb-2">{name}</h3>
      <div className="flex items-baseline gap-1 mb-6">
        <span className={`text-4xl font-headline font-bold ${highlight ? "text-primary" : ""}`}>{price}</span>
        <span className="text-on-surface-variant">{period}</span>
      </div>
      <ul className="space-y-4 mb-8 flex-grow">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <span className="text-tertiary">&#10003;</span>
            <span className={highlight ? "" : "text-on-surface-variant"}>{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`w-full py-3 text-center rounded-md font-bold text-sm transition-all ${
          highlight
            ? "bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(192,193,255,0.4)]"
            : "border border-outline-variant/30 hover:bg-surface-variant/30"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
