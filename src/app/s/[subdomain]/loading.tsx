import LoadingOverlay from "@/components/LoadingOverlay";

export default function StorefrontLoading() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <LoadingOverlay message="Loading..." delay={0} />
    </main>
  );
}
