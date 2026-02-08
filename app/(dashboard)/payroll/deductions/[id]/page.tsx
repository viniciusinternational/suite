'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Loader2, Edit, Trash2 } from 'lucide-react'
import { useDeduction, useDeleteDeduction } from '@/hooks/use-deductions'
import { hasPermission } from '@/lib/permissions'
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

export default function DeductionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { user } = useAuthGuard(['view_payroll'])
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  const { data: deduction, isLoading } = useDeduction(id)
  const deleteDeduction = useDeleteDeduction()

  if (!user) return null

  const canEdit = user && hasPermission(user, 'edit_payroll')
  const canDelete = user && hasPermission(user, 'delete_payroll')

  const handleDelete = async () => {
    if (!id) return
    await deleteDeduction.mutateAsync(id)
    setShowDeleteDialog(false)
    router.push('/payroll?tab=deductions')
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading deduction...</span>
      </div>
    )
  }

  if (!deduction) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Deduction Not Found</h1>
          <p className="text-gray-600 mb-4">The deduction you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/payroll?tab=deductions')}>Back to Deductions</Button>
        </div>
      </div>
    )
  }

  const now = new Date()
  const startDate = deduction.startDate ? new Date(deduction.startDate) : null
  const endDate = deduction.endDate ? new Date(deduction.endDate) : null
  const isActive = deduction.always || (startDate && endDate && now >= startDate && now <= endDate)

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/payroll?tab=deductions')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Deductions
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{deduction.title}</h1>
            <p className="text-gray-600 mt-1">Deduction details and configuration</p>
          </div>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button onClick={() => router.push(`/payroll/deductions/${id}/edit`)}>
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this deduction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteDeduction.isPending}
            >
              {deleteDeduction.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-600">Title</div>
              <div className="text-lg font-semibold">{deduction.title}</div>
            </div>
            {deduction.description && (
              <div>
                <div className="text-sm text-gray-600">Description</div>
                <div className="text-base">{deduction.description}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <Badge
                className={isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                variant="outline"
              >
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-gray-600">Type</div>
              <div className="text-base">
                {deduction.amount ? (
                  <Badge variant="outline">Fixed Amount</Badge>
                ) : (
                  <Badge variant="outline">Percentage</Badge>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Amount/Percent</div>
              <div className="text-lg font-semibold">
                {deduction.amount
                  ? `₦${deduction.amount.toLocaleString()}`
                  : deduction.percent
                  ? `${deduction.percent}%`
                  : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Scope</div>
              <div className="text-base">
                {deduction.global ? (
                  <Badge className="bg-blue-100 text-blue-700">Global (All Users)</Badge>
                ) : (
                  <div className="flex flex-col gap-2">
                    {deduction.users && deduction.users.length > 0 && (
                      <Badge variant="outline">
                        {deduction.users.length} user{deduction.users.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {deduction.departments && deduction.departments.length > 0 && (
                      <Badge variant="outline" className="bg-purple-50 text-purple-700">
                        {deduction.departments.length} dept{deduction.departments.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                    {(!deduction.users || deduction.users.length === 0) && (!deduction.departments || deduction.departments.length === 0) && (
                      <Badge variant="outline" className="text-gray-500">None assigned</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Period</CardTitle>
          </CardHeader>
          <CardContent>
            {deduction.always ? (
              <div className="text-base">Always active</div>
            ) : startDate && endDate ? (
              <div className="space-y-2">
                <div>
                  <div className="text-sm text-gray-600">Start Date</div>
                  <div className="text-base">{startDate.toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">End Date</div>
                  <div className="text-base">{endDate.toLocaleDateString()}</div>
                </div>
              </div>
            ) : (
              <div className="text-base text-gray-500">No period set</div>
            )}
          </CardContent>
        </Card>

        {!deduction.global && deduction.departments && deduction.departments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Departments ({deduction.departments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deduction.departments.map((dept) => (
                  <div key={dept.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-sm text-gray-600">{dept.code}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!deduction.global && deduction.users && deduction.users.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Assigned Users ({deduction.users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deduction.users.map((user) => (
                  <div key={user.id} className="flex items-center gap-2 py-2 border-b last:border-0">
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

