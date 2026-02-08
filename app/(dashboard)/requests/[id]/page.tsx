'use client';

import { useState } from 'react';
import { useParams, useRouter, notFound } from 'next/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestDetail } from '@/components/request/request-detail';
import { useRequest, useDeleteRequest } from '@/hooks/use-requests';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function RequestDetailsPage() {
  const { user } = useAuthGuard(['view_requests']);
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: request, isLoading } = useRequest(requestId);
  const deleteRequest = useDeleteRequest();

  const handleApprovalChange = () => {
    // Data will be refetched automatically by react-query
  };

  const handleDelete = async () => {
    await deleteRequest.mutateAsync(requestId);
    setShowDeleteDialog(false);
    router.push('/requests');
  };

  const canDelete = user?.permissions?.delete_requests;

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
    notFound();
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => router.push('/requests')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
        {canDelete && (
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        )}
      </div>

      {/* Request Details */}
      <div className="max-w-7xl mx-auto">
        <RequestDetail
          request={request}
          onEdit={() => router.push(`/requests/${requestId}/edit`)}
          onApprovalChange={handleApprovalChange}
        />
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the request and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteRequest.isPending}
            >
              {deleteRequest.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

