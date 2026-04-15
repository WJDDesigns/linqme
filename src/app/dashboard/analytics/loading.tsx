import { SkeletonBlock, SkeletonText } from "@/components/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 md:px-10 py-8 space-y-8">
      <header>
        <SkeletonText className="h-8 w-32 mb-2" />
        <SkeletonText className="h-4 w-64" />
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-surface-container/60 backdrop-blur-md rounded-2xl border border-outline-variant/15 p-5">
            <SkeletonText className="h-2.5 w-20 mb-3" />
            <SkeletonText className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-surface-container/60 backdrop-blur-md rounded-2xl border border-outline-variant/15 p-6">
        <SkeletonText className="h-4 w-44 mb-4" />
        <SkeletonBlock className="h-[280px] w-full !rounded-xl" />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-container/60 backdrop-blur-md rounded-2xl border border-outline-variant/15 p-6 space-y-4">
          <SkeletonText className="h-4 w-40" />
          <SkeletonBlock className="h-8 w-full !rounded-lg" />
          <SkeletonBlock className="h-8 w-full !rounded-lg" />
        </div>
        <div className="bg-surface-container/60 backdrop-blur-md rounded-2xl border border-outline-variant/15 p-6 space-y-3">
          <SkeletonText className="h-4 w-24" />
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-8 w-full !rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
