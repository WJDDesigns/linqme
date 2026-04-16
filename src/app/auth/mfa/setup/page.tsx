import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MfaSetupFlow from "./MfaSetupFlow";
import SiteLaunchLogo from "@/components/SiteLaunchLogo";
import RocketAnimation from "@/components/RocketAnimation";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function MfaSetupPage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { next } = await searchParams;
  const redirectTo = next || "/dashboard";

  return (
    <main className="min-h-screen flex items-end justify-center px-6 pb-[6vh] pt-[35vh] relative overflow-hidden bg-surface">
      <RocketAnimation />

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <Link href="/" className="flex items-center justify-center mb-8">
          <SiteLaunchLogo className="h-14 w-auto text-primary" ringClassName="text-on-surface/60" />
        </Link>

        <MfaSetupFlow redirectTo={redirectTo} userEmail={session.email} />
      </div>
    </main>
  );
}
