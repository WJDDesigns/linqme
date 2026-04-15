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
          <Link className="text-sm text-on-surface-variant hover:text-on-surface transition-colors duration-300" href="/pricing">Pricing</Link>
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

      {/* Stats */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <StatBlock value="10,000+" label="Submissions collected" />
            <StatBlock value="500+" label="Agencies onboard" />
            <StatBlock value="99.9%" label="Uptime SLA" />
            <StatBlock value="2 min" label="Average setup time" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-outline-variant/15 to-transparent" />
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

          {/* Additional features list */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <MiniFeature icon="fa-file-csv" title="CSV & PDF Exports" desc="Download submissions as spreadsheets or branded PDFs." />
            <MiniFeature icon="fa-clock-rotate-left" title="Auto-save Drafts" desc="Clients can leave and come back. Nothing is ever lost." />
            <MiniFeature icon="fa-palette" title="Custom Branding" desc="Colors, logos, favicons, and custom domains per workspace." />
            <MiniFeature icon="fa-bell" title="Instant Notifications" desc="Get emailed the moment a client submits their onboarding." />
            <MiniFeature icon="fa-users-gear" title="Team Permissions" desc="Invite team members with owner or member-level access." />
            <MiniFeature icon="fa-arrows-repeat" title="Repeater Fields" desc="Let clients add dynamic rows of data like team members or pages." />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-outline-variant/15 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/[0.03] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 md:mb-20">
            <span className="inline-block text-xs font-bold text-tertiary uppercase tracking-[0.2em] mb-4">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4">Loved by agencies everywhere</h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto">See what teams are saying about their onboarding workflow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard
              quote="SiteLaunch cut our client onboarding time from 2 weeks to 2 days. The white-labeling means clients think it's our own tool."
              name="Sarah Chen"
              role="Founder, PixelForge Studio"
            />
            <TestimonialCard
              quote="We used to chase clients for assets across email, Slack, and Dropbox. Now everything lands in one place, organized and ready."
              name="Marcus Reyes"
              role="Creative Director, BrandHive"
              featured
            />
            <TestimonialCard
              quote="The form builder is incredibly flexible. We've built different onboarding flows for web design, branding, and SEO clients."
              name="Emily Nakamura"
              role="Operations Lead, CreativOps"
            />
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-24 md:py-32 px-6 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Use Cases</span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4">Works for every kind of agency</h2>
            <p className="text-on-surface-variant text-lg max-w-xl mx-auto">From web design to marketing, SiteLaunch adapts to your workflow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UseCaseCard
              icon="fa-laptop-code"
              title="Web Design & Development"
              desc="Collect copy, images, brand guidelines, and sitemap approvals before a single pixel is pushed. Stop waiting on clients to dig through their Google Drive."
            />
            <UseCaseCard
              icon="fa-bullhorn"
              title="Marketing & Social Media"
              desc="Gather brand voice guidelines, campaign briefs, target audience details, and creative assets in a structured, repeatable flow."
            />
            <UseCaseCard
              icon="fa-paintbrush"
              title="Branding & Identity"
              desc="Onboard new branding clients with questionnaires about their vision, competitors, color preferences, and inspiration boards."
            />
            <UseCaseCard
              icon="fa-handshake"
              title="Consulting & Freelance"
              desc="Standardize your intake process across clients. Collect project requirements, timelines, budgets, and stakeholder info upfront."
            />
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-24 md:py-32 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-outline-variant/15 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.04] rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4">Plans for every stage</h2>
          <p className="text-on-surface-variant text-lg mb-12 max-w-xl mx-auto">
            Start free with Comet, grow with Nova, and go unlimited with Supernova.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
            <div className="glass-panel rounded-2xl border border-outline-variant/[0.08] p-6 text-center">
              <h3 className="text-lg font-bold font-headline mb-1">Comet</h3>
              <div className="text-3xl font-extrabold font-headline mb-2">Free</div>
              <p className="text-xs text-on-surface-variant/60">1 submission/mo &middot; 1 GB</p>
            </div>
            <div className="gradient-border rounded-2xl">
              <div className="glass-panel rounded-2xl p-6 text-center relative">
                <div className="absolute -top-px left-1/2 -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                <h3 className="text-lg font-bold font-headline mb-1 text-primary">Nova</h3>
                <div className="text-3xl font-extrabold font-headline gradient-text mb-2">$99<span className="text-base font-normal text-on-surface-variant">/mo</span></div>
                <p className="text-xs text-on-surface-variant/60">25 submissions/mo &middot; 50 GB</p>
              </div>
            </div>
            <div className="glass-panel rounded-2xl border border-outline-variant/[0.08] p-6 text-center">
              <h3 className="text-lg font-bold font-headline mb-1">Supernova</h3>
              <div className="text-3xl font-extrabold font-headline mb-2">$249<span className="text-base font-normal text-on-surface-variant">/mo</span></div>
              <p className="text-xs text-on-surface-variant/60">Unlimited &middot; 500 GB</p>
            </div>
          </div>

          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 border border-outline-variant/20 rounded-xl font-bold hover:border-primary/30 hover:bg-primary/[0.03] transition-all duration-300 group"
          >
            Compare all plans
            <i className="fa-solid fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 md:py-32 px-6 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16 md:mb-20">
            <span className="inline-block text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">FAQ</span>
            <h2 className="text-4xl md:text-5xl font-headline font-bold mb-4">Common questions</h2>
          </div>

          <div className="space-y-4">
            <FaqItem q="Is SiteLaunch really free?" a="Yes. The Comet plan is free forever with 1 submission per month and 1 GB of storage. No credit card required. Upgrade to Nova or Supernova when you're ready for more." />
            <FaqItem q="Can my clients see SiteLaunch branding?" a="On paid plans, you can completely remove all SiteLaunch branding. Your clients will see your logo, your colors, and your custom domain. It looks 100% like your own tool." />
            <FaqItem q="What file types can clients upload?" a="Clients can upload any file type including images, PDFs, documents, videos, and design files. Individual files can be up to 100 MB on all plans." />
            <FaqItem q="Do I need to give clients a login?" a="No. Clients access their onboarding form via a unique, secure link. No accounts or passwords needed on their end. You get a full dashboard to manage everything." />
            <FaqItem q="Can I customize the onboarding form?" a="Absolutely. The drag-and-drop form builder lets you create multi-step forms with text fields, dropdowns, file uploads, repeater fields, and more. Each partner can have their own custom form." />
            <FaqItem q="Is there a contract?" a="No. All plans are month-to-month. Cancel anytime from your dashboard. Annual billing with 20% off is also available." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 md:py-32 px-6 text-center relative">
        <div className="max-w-4xl mx-auto">
          <div className="gradient-border rounded-3xl">
            <div className="relative glass-panel noise-overlay p-12 md:p-20 rounded-3xl overflow-hidden">
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
            <Link className="hover:text-primary transition-colors duration-300" href="/pricing">Pricing</Link>
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

/* ── Sub-components ───────────────────────────────── */

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl md:text-5xl font-headline font-extrabold gradient-text mb-2">{value}</div>
      <p className="text-sm text-on-surface-variant/60">{label}</p>
    </div>
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

function MiniFeature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-outline-variant/[0.06] hover:border-primary/15 transition-all duration-300 group">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform duration-500">
        <i className={`fa-solid ${icon} text-sm`} />
      </div>
      <div>
        <h4 className="font-bold text-sm mb-1">{title}</h4>
        <p className="text-xs text-on-surface-variant/60 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function TestimonialCard({ quote, name, role, featured }: { quote: string; name: string; role: string; featured?: boolean }) {
  return (
    <div className={`rounded-2xl p-8 flex flex-col justify-between h-full ${
      featured
        ? "gradient-border"
        : "border border-outline-variant/[0.08]"
    }`}>
      <div className={featured ? "glass-panel rounded-2xl p-8 -m-8 h-full flex flex-col justify-between" : "flex flex-col justify-between h-full"}>
        <div>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((s) => (
              <i key={s} className="fa-solid fa-star text-xs text-primary/70" />
            ))}
          </div>
          <p className="text-on-surface/90 leading-relaxed mb-6">&ldquo;{quote}&rdquo;</p>
        </div>
        <div>
          <p className="font-bold text-sm">{name}</p>
          <p className="text-xs text-on-surface-variant/50">{role}</p>
        </div>
      </div>
    </div>
  );
}

function UseCaseCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="glass-panel noise-overlay rounded-2xl border border-outline-variant/[0.08] p-8 relative overflow-hidden group glow-card">
      <div className="absolute top-6 right-6 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-500">
        <i className={`fa-solid ${icon} text-lg`} />
      </div>
      <h3 className="text-xl font-bold mb-3 relative z-10 pr-16">{title}</h3>
      <p className="text-on-surface-variant relative z-10 leading-relaxed">{desc}</p>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="glass-panel rounded-2xl border border-outline-variant/[0.08] p-6">
      <h3 className="font-bold text-on-surface mb-2">{q}</h3>
      <p className="text-sm text-on-surface-variant/70 leading-relaxed">{a}</p>
    </div>
  );
}
