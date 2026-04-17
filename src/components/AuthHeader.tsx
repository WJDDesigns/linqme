import Link from "next/link";
import LinqMeLogo from "@/components/LinqMeLogo";

/**
 * Top-left header bar for auth pages — logo + "linqme" text.
 * Rendered at fixed top position, overlays the rocket animation.
 */
export default function AuthHeader() {
  return (
    <header className="absolute top-0 left-0 right-0 z-20 px-6 py-5">
      <Link href="/" className="inline-flex items-center gap-2.5 group">
        <LinqMeLogo
          className="h-8 w-auto text-primary"
         
        />
      </Link>
    </header>
  );
}
