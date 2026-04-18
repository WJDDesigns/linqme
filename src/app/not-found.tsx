import Link from "next/link";
import LinqMeLogo from "@/components/LinqMeLogo";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/[0.08] rounded-full blur-[140px] pointer-events-none" />

      <div className="relative z-10 max-w-md">
        <Link href="/" className="block mx-auto mb-8 w-fit">
          <LinqMeLogo variant="auto" className="h-12 w-auto text-primary" />
        </Link>
        <h1 className="text-7xl font-headline font-extrabold gradient-text mb-4">404</h1>
        <h2 className="text-xl font-headline font-bold text-on-surface mb-3">Page not found</h2>
        <p className="text-on-surface-variant/60 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/"
            className="px-6 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm hover:shadow-[0_0_24px_rgba(var(--color-primary),0.4)] transition-all duration-300"
          >
            Go Home
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 border border-outline-variant/20 rounded-xl text-sm font-medium hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
