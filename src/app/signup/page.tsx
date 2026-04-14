import SignupForm from "./SignupForm";

export default function SignupPage() {
  const rootHost = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "mysitelaunch.com").replace(
    /:\d+$/,
    "",
  );

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      {/* Celestial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight font-headline text-on-surface">
            Start with SiteLaunch
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Free forever for one submission a month. Upgrade whenever you&apos;re ready.
          </p>
        </div>

        <SignupForm rootHost={rootHost} />
      </div>
    </main>
  );
}
