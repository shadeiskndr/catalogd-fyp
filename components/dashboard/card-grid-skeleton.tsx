import { Skeleton } from "@/components/ui/skeleton";

type CardGridSkeletonProps = {
  count: number;
  prefix: string;
  className: string;
};

export function CardGridSkeleton({ count, prefix, className }: CardGridSkeletonProps) {
  const placeholders = Array.from({ length: count }, (_, index) => `${prefix}-${index}`);

  return (
    <div className={className}>
      {placeholders.map((placeholder) => (
        <div key={placeholder} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="space-y-3 p-4 pt-3">
            <Skeleton className="h-4 w-4/5 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
