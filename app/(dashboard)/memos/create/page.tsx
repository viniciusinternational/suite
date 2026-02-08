'use client';

import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { hasPermission } from '@/lib/permissions'
import { MemoForm } from '@/components/memo/memo-form'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateMemoPage() {
  const router = useRouter()
  const { user } = useAuthGuard(['add_memos'])

  if (!user || !hasPermission(user, 'add_memos')) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 mt-2">You don't have permission to create memos.</p>
          <Button onClick={() => router.push('/memos')} className="mt-4">
            Back to Memos
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] min-h-0">
      <div className="shrink-0 p-4 border-b bg-background">
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
            <h1 className="text-2xl font-bold">Create Memo</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Create a new memo with rich text formatting</p>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-background">
        <MemoForm
          onSuccess={() => {
            router.push('/memos')
          }}
        />
      </div>
    </div>
  )
}

