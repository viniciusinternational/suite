'use client';

import { use, useState } from 'react';
import { useRouter, notFound } from 'next/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentDetail } from '@/components/document/document-detail';
import { DocumentComments } from '@/components/document/document-comments';
import { DocumentForm } from '@/components/document/document-form';
import { useDocument, useDeleteDocument } from '@/hooks/use-documents';
import { hasPermission } from '@/lib/permissions';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user } = useAuthGuard(['view_documents']);
  const router = useRouter();
  const { data: document, isLoading } = useDocument(resolvedParams.id);
  const deleteMutation = useDeleteDocument();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canEdit = hasPermission(user, 'edit_documents');
  const canDelete = hasPermission(user, 'delete_documents');

  const handleDelete = async () => {
    if (!document) return;
    await deleteMutation.mutateAsync(document.id);
    setShowDeleteDialog(false);
    router.push('/documents');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!document) {
    notFound();
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="flex items-center gap-4 flex-shrink-0 mb-6">
        <Button variant="ghost" onClick={() => router.push('/documents')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {canEdit && (
            <Button onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 flex-1 min-h-0">
        <div className="overflow-y-auto">
          <DocumentDetail document={document} onEdit={() => setIsEditDialogOpen(true)} canEdit={canEdit} />
        </div>
        <div className="min-h-0">
          <DocumentComments documentId={document.id} />
        </div>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>Update document information</DialogDescription>
          </DialogHeader>
          <DocumentForm
            document={document}
            onSuccess={() => {
              setIsEditDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

