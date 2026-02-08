'use client';

import { useMemo, useState } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { hasPermission } from '@/lib/permissions';
import { useMemo as useMemoById, useDeleteMemo } from '@/hooks/use-memos';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Loader2, Trash2 } from 'lucide-react';
import DOMPurify from 'dompurify';
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

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-700', label: 'Low' },
  medium: { color: 'bg-blue-100 text-blue-700', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-700', label: 'Urgent' },
};

export default function MemoDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memoId = params.id as string;
  const { user } = useAuthGuard(['view_memos']);

  const { data: memo, isLoading } = useMemoById(memoId);
  const deleteMutation = useDeleteMemo();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const canEdit = user && hasPermission(user, 'edit_memos');
  const canDelete = user && hasPermission(user, 'delete_memos');

  const sanitizedContent = useMemo(() => {
    if (typeof window !== 'undefined' && memo?.content) {
      return DOMPurify.sanitize(memo.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'class'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      });
    }
    return memo?.content ?? '';
  }, [memo?.content]);

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(memoId);
    setShowDeleteDialog(false);
    router.push('/memos');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!memo) {
    notFound();
  }

  const priority = priorityConfig[memo.priority];
  const expiresAtDate = memo.expiresAt ? new Date(memo.expiresAt) : null;
  const isExpired = expiresAtDate && !isNaN(expiresAtDate.getTime()) && expiresAtDate < new Date();

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/memos')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Memos
          </Button>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button onClick={() => router.push(`/memos/${memoId}/edit`)}>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{memo.title}</CardTitle>
          <CardDescription>
            {memo.createdBy?.fullName && `Created by ${memo.createdBy.fullName}`}
            {memo.createdAt && ` on ${new Date(memo.createdAt).toLocaleString()}`}
          </CardDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            <Badge className={priority.color}>{priority.label}</Badge>
            <Badge variant={memo.isActive ? 'default' : 'secondary'}>
              {memo.isActive ? 'Active' : 'Inactive'}
            </Badge>
            {memo.isGlobal ? (
              <Badge variant="secondary">Everyone</Badge>
            ) : (
              <>
                {memo.departments && memo.departments.length > 0 && (
                  <Badge variant="outline">{memo.departments.length} dept(s)</Badge>
                )}
                {memo.users && memo.users.length > 0 && (
                  <Badge variant="outline">{memo.users.length} user(s)</Badge>
                )}
              </>
            )}
            {memo.expiresAt && (
              <Badge variant={isExpired ? 'destructive' : 'outline'}>
                {isExpired ? 'Expired' : `Expires ${new Date(memo.expiresAt).toLocaleDateString()}`}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this memo.
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
