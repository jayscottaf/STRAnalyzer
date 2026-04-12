'use client';

export default function AILoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Verdict */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-32 skeleton-shimmer rounded-md" />
        <div className="h-4 flex-1 skeleton-shimmer rounded" />
      </div>

      {/* Analysis cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border-default p-3">
            <div className="h-3 w-24 skeleton-shimmer rounded mb-2" />
            <div className="space-y-1.5">
              <div className="h-2.5 skeleton-shimmer rounded w-full" />
              <div className="h-2.5 skeleton-shimmer rounded w-3/4" />
              <div className="h-2.5 skeleton-shimmer rounded w-5/6" />
            </div>
          </div>
        ))}
      </div>

      {/* Flags */}
      <div className="space-y-2">
        <div className="h-3 w-20 skeleton-shimmer rounded" />
        <div className="h-2.5 skeleton-shimmer rounded w-2/3" />
        <div className="h-2.5 skeleton-shimmer rounded w-1/2" />
      </div>
    </div>
  );
}
