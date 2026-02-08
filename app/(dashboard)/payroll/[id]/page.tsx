'use client'

import { useState, useEffect } from 'react'
import { useRouter, notFound } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { usePayroll, useDeletePayroll } from '@/hooks/use-payrolls'
import { PayrollDetail } from '@/components/payroll/payroll-detail'
import { PayrollApproval } from '@/components/payroll/payroll-approval'
import { hasPermission } from '@/lib/permissions'
import { Loader2 } from 'lucide-react'
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

export default function PayrollViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuthGuard(['view_payroll'])
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  const { data: payroll, isLoading } = usePayroll(id)
  const deletePayroll = useDeletePayroll()

  const canEdit = user && hasPermission(user, 'edit_payroll')
  const canDelete = user && hasPermission(user, 'delete_payroll')

  const handleDelete = async () => {
    if (!id) return
    await deletePayroll.mutateAsync(id)
    setShowDeleteDialog(false)
    router.push('/payroll')
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading payroll...</span>
      </div>
    )
  }

  if (!payroll) {
    notFound()
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/payroll')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Payroll
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Details</h1>
            <p className="text-gray-600 mt-1">View payroll information and approvals</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button onClick={() => router.push(`/payroll/${id}/edit`)}>
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

      {/* Payroll Details */}
      <PayrollDetail payroll={payroll} />

      {/* Approvals Section */}
      <Card>
        <CardHeader>
          <CardTitle>Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <PayrollApproval payroll={payroll} onApprovalChange={() => {}} />
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this payroll and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deletePayroll.isPending}
            >
              {deletePayroll.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

