'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestDetail } from '@/components/request/request-detail';
import { useRequest } from '@/hooks/use-requests';
import { ArrowLeft, Edit } from 'lucide-react';

export default function RequestDetailsPage() {
  useAuthGuard(['view_requests']);
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;

  const { data: request, isLoading } = useRequest(requestId);

  const handleApprovalChange = () => {
    // Data will be refetched automatically by react-query
  };

  if (isLoading) {
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
        <Button variant="ghost" onClick={() => router.push('/requests')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
      </div>

      {/* Request Details */}
      <div className="max-w-7xl mx-auto">
        <RequestDetail
          request={request}
          onEdit={() => router.push(`/requests/${requestId}/edit`)}
          onApprovalChange={handleApprovalChange}
        />
      </div>
    </div>
  );
}

