'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestForm } from '@/components/request/request-form';
import { useRequest } from '@/hooks/use-requests';
import { ArrowLeft } from 'lucide-react';

export default function EditRequestPage() {
  useAuthGuard(['edit_requests']);
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const { data: request, isLoading } = useRequest(requestId);

  const handleSuccess = () => {
    router.push(`/requests/${requestId}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <div>
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/requests')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
        </div>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Request Not Found</h1>
          <p className="text-gray-600 mb-4">The request you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/requests')}>Go Back to Requests</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push(`/requests/${requestId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Request Details
        </Button>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Edit Request</h1>
          <p className="text-muted-foreground mt-1">Update the request details below</p>
        </div>
        <RequestForm request={request} onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

