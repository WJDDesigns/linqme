import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MfaChallenge from "./MfaChallenge";
import SiteLaunchLogo from "@/components/SiteLaunchLogo";
import RocketAnimation from "@/components/RocketAnimation";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function MfaChallengePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { next } = await searchParams;
  const redirectTo = next || "/dashboard";

  return (
    <main className="min-h-screen flex items-end justify-center px-6 pb-[8vh] pt-[42vh] relative overflow-hidden bg-surface">
      <RocketAnimation />

      <div className="relative z-10 w-full max-w-sm animate-scale-in">
        <Link href="/" className="flex items-center justify-center mb-8">
          <SiteLaunchLogo className="h-14 w-auto text-primary" ringClassName="text-on-surface/60" />
        </Link>

        <MfaChallenge redirectTo={redirectTo} userId={session.userId} />
      </div>
    </main>
  );
}
