import { Skeleton } from "@/components/ui/skeleton";

export function SessionSkeleton() {
  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-4 py-8">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-4 w-48 rounded" />
          <Skeleton className="h-3 w-32 rounded" />
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    </div>
  );
}
