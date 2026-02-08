'use client';

import { useMemo } from 'react'
import DOMPurify from 'dompurify'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDeleteMemo } from '@/hooks/use-memos'
import type { Memo } from '@/types'
import { Edit, Trash2, AlertCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'

interface Props {
  memo: Memo
  onEdit?: (memo: Memo) => void
  canEdit?: boolean
}

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-700', label: 'Low' },
  medium: { color: 'bg-blue-100 text-blue-700', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-700', label: 'Urgent' },
}

export function MemoCard({ memo, onEdit, canEdit = false }: Props) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteMutation = useDeleteMemo()
  
  const priority = priorityConfig[memo.priority]

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(memo.id)
    setShowDeleteDialog(false)
  }

  const expiresAtDate = memo.expiresAt ? new Date(memo.expiresAt) : null
  const isExpired = expiresAtDate && !isNaN(expiresAtDate.getTime()) && expiresAtDate < new Date()

  // Sanitize HTML content for safe rendering
  const sanitizedContent = useMemo(() => {
    if (typeof window !== 'undefined') {
      return DOMPurify.sanitize(memo.content, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'blockquote', 'code', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'img'],
        ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'class'],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      })
    }
    return memo.content
  }, [memo.content])

  return (
    <>
      <Card className={memo.priority === 'urgent' ? 'border-red-300 border-2' : ''}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base flex items-center gap-2">
                {memo.priority === 'urgent' && <AlertCircle className="h-4 w-4 text-red-600" />}
                {memo.title}
              </CardTitle>
              {memo.createdBy && (
                <CardDescription className="text-xs mt-1">
                  by {memo.createdBy.fullName}
                </CardDescription>
              )}
            </div>
            {canEdit && (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit?.(memo)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div 
            className="text-sm text-gray-700 mb-3 prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizedContent }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={priority.color}>
              {priority.label}
            </Badge>
            {memo.isGlobal ? (
              <Badge variant="secondary" className="text-xs">Everyone</Badge>
            ) : (
              <>
                {memo.departments && memo.departments.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {memo.departments.length} {memo.departments.length === 1 ? 'Dept' : 'Depts'}
                  </Badge>
                )}
                {memo.users && memo.users.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {memo.users.length} {memo.users.length === 1 ? 'User' : 'Users'}
                  </Badge>
                )}
              </>
            )}
            {memo.expiresAt && !isNaN(new Date(memo.expiresAt).getTime()) && (
              <Badge variant={isExpired ? 'destructive' : 'outline'} className="text-xs">
                {isExpired ? 'Expired' : `Expires ${new Date(memo.expiresAt).toLocaleDateString()}`}
              </Badge>
            )}
          </div>
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
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}


