import { Skeleton } from '@/components/ui/skeleton';

export default function RequestDetailLoading() {
  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}
