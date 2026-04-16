import Link from "next/link";
import SiteLaunchLogo from "@/components/SiteLaunchLogo";

/**
 * Top-left header bar for auth pages — logo + "SiteLaunch" text.
 * Rendered at fixed top position, overlays the rocket animation.
 */
export default function AuthHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
      <Link href="/" className="inline-flex items-center gap-2.5 group">
        <SiteLaunchLogo
          className="h-8 w-auto text-primary"
          ringClassName="text-on-surface/60"
        />
        <span className="text-base font-bold font-headline text-on-surface tracking-tight group-hover:text-primary transition-colors duration-300">
          SiteLaunch
        </span>
      </Link>
    </header>
  );
}
