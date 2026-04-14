import SignupForm from "./SignupForm";

export default function SignupPage() {
  const rootHost = (process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "mysitelaunch.com").replace(
    /:\d+$/,
    "",
  );

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Start with SiteLaunch
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Free forever for one submission a month. Upgrade whenever you&apos;re ready.
          </p>
        </div>

        <SignupForm rootHost={rootHost} />
      </div>
    </main>
  );
}
