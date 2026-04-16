import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import MfaChallenge from "./MfaChallenge";
import RocketAnimation from "@/components/RocketAnimation";
import AuthHeader from "@/components/AuthHeader";

interface Props {
  searchParams: Promise<{ next?: string }>;
}

export default async function MfaChallengePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { next } = await searchParams;
  const redirectTo = next || "/dashboard";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 pt-16 pb-8 relative overflow-hidden bg-surface">
      <RocketAnimation />
      <AuthHeader />

      <div className="relative z-10 w-full max-w-sm animate-scale-in mt-[18vh]">
        <MfaChallenge redirectTo={redirectTo} userId={session.userId} />
      </div>
    </main>
  );
}
