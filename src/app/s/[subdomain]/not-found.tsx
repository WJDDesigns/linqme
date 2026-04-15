import Link from "next/link";

export default function StorefrontNotFound() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <i className="fa-solid fa-compass text-3xl text-primary/60" />
        </div>
        <h1 className="text-3xl font-headline font-extrabold tracking-tight text-on-surface mb-3">
          Page not found
        </h1>
        <p className="text-on-surface-variant/60 mb-8">
          The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-3 bg-primary text-on-primary font-bold rounded-xl text-sm hover:shadow-[0_0_24px_rgba(var(--color-primary),0.4)] transition-all duration-300"
        >
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
