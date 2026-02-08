import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPageLoading() {
  return (
    <div className="flex flex-col h-full min-h-0 p-4">
      <div className="flex justify-between items-baseline gap-3 pb-3 shrink-0">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-6 flex-1 min-h-0">
        <div className="flex flex-col min-h-0">
          <Skeleton className="h-full w-full min-h-[400px] rounded-lg" />
        </div>
        <div className="flex flex-col min-h-0 border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-5 w-32 mb-2" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="p-4 space-y-2 flex-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
