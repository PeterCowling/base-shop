import { memo } from "react";

interface ReceptionSkeletonProps {
  rows?: number;
}

/**
 * Animated loading skeleton for reception table views.
 * Renders `rows` shimmer rows to indicate loading state.
 */
const ReceptionSkeleton = memo(function ReceptionSkeleton({
  rows = 5,
}: ReceptionSkeletonProps) {
  return (
    <div className="space-y-2 p-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
           
          key={i}
          className="h-10 animate-pulse rounded-lg bg-surface-3"
        />
      ))}
    </div>
  );
});

export default ReceptionSkeleton;
