'use client'

import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, Eye } from 'lucide-react'
import { useDeductions, useDeleteDeduction } from '@/hooks/use-deductions'
import { useAuthGuard } from '@/hooks/use-auth-guard'
import { hasPermission } from '@/lib/permissions'
import { Loader2 } from 'lucide-react'

export function DeductionTable() {
  const { user } = useAuthGuard()
  const router = useRouter()
  const { data: deductions = [], isLoading } = useDeductions()
  const deleteDeduction = useDeleteDeduction()

  const canEdit = user && hasPermission(user, 'edit_payroll')
  const canDelete = user && hasPermission(user, 'delete_payroll')

  const handleEdit = (id: string) => {
    router.push(`/payroll/deductions/${id}/edit`)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this deduction? This action cannot be undone.')) {
      try {
        await deleteDeduction.mutateAsync(id)
      } catch (error) {
        console.error('Error deleting deduction:', error)
      }
    }
  }

  const handleView = (id: string) => {
    router.push(`/payroll/deductions/${id}`)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading deductions...</span>
      </div>
    )
  }

  if (deductions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No deductions found. Create your first deduction to get started.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Amount/Percent</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            {(canEdit || canDelete) && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {deductions.map((deduction) => {
            const now = new Date()
            const startDate = deduction.startDate ? new Date(deduction.startDate) : null
            const endDate = deduction.endDate ? new Date(deduction.endDate) : null
            const isActive = deduction.always || (startDate && endDate && now >= startDate && now <= endDate)
            const amountDisplay = deduction.amount
              ? `₦${deduction.amount.toLocaleString()}`
              : deduction.percent
              ? `${deduction.percent}%`
              : 'N/A'

            return (
              <TableRow key={deduction.id}>
                <TableCell className="font-medium">{deduction.title}</TableCell>
                <TableCell>
                  {deduction.amount ? (
                    <Badge variant="outline">Fixed</Badge>
                  ) : (
                    <Badge variant="outline">Percentage</Badge>
                  )}
                </TableCell>
                <TableCell>{amountDisplay}</TableCell>
                <TableCell>
                  {deduction.global ? (
                    <Badge className="bg-blue-100 text-blue-700">Global</Badge>
                  ) : (
                    <div className="flex flex-col gap-1">
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
                        <Badge variant="outline" className="text-gray-500">None</Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {deduction.always ? (
                    <span className="text-sm text-gray-600">Always</span>
                  ) : startDate && endDate ? (
                    <span className="text-sm text-gray-600">
                      {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No period</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    className={isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}
                    variant="outline"
                  >
                    {isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                {(canEdit || canDelete) && (
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(deduction.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(deduction.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(deduction.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

