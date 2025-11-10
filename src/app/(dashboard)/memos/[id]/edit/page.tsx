'use client';

import { useRouter, useParams } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { hasPermission } from '@/lib/permissions'
import { useMemo } from '@/hooks/use-memos'
import { MemoForm } from '@/components/memo/memo-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function EditMemoPage() {
  const router = useRouter()
  const params = useParams()
  const memoId = params.id as string
  const { user } = useAuthGuard(['edit_memos'])

  const { data: memo, isLoading } = useMemo(memoId)

  if (!user || !hasPermission(user, 'edit_memos')) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
            <p className="text-gray-600 mt-2">You don&apos;t have permission to edit memos.</p>
            <Button onClick={() => router.push('/memos')} className="mt-4">
              Back to Memos
            </Button>
          </div>
        </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!memo) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Memo Not Found</h2>
            <p className="text-gray-600 mt-2">The memo you&apos;re looking for doesn&apos;t exist.</p>
            <Button onClick={() => router.push('/memos')} className="mt-4">
              Back to Memos
            </Button>
          </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50/50">
      <div className="p-6 border-b bg-white">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/memos')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Memo</h1>
            <p className="text-gray-600 mt-1">Update memo details</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border m-6 overflow-hidden">
        <MemoForm
          memo={memo}
          onSuccess={() => {
            router.push('/memos')
          }}
        />
      </div>
    </div>
  )
}

