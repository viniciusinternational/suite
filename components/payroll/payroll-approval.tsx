'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, XCircle, Clock, User, UserPlus } from 'lucide-react'
import { useApprovePayroll } from '@/hooks/use-payrolls'
import { useAuthStore } from '@/store/auth-store'
import type { Payroll } from '@/types'
import { AddApproverDialog } from '@/components/approvals/add-approver-dialog'
import { hasPermission } from '@/lib/permissions'

interface PayrollApprovalProps {
  payroll: Payroll
  onApprovalChange?: () => void
}

const levelLabels = {
  dept_head: 'Department Head',
  admin_head: 'Admin Head',
  accountant: 'Accountant',
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export function PayrollApproval({ payroll, onApprovalChange }: PayrollApprovalProps) {
  const { user } = useAuthStore()
  const approvePayroll = useApprovePayroll()
  const [comments, setComments] = useState<Record<string, string>>({})
  const [action, setAction] = useState<Record<string, 'approve' | 'reject'>>({})
  const canAddApproverPermission = hasPermission(user ?? null, 'add_approvers') || hasPermission(user ?? null, 'manage_approvers')

  const approvals = payroll.approvals || []

  const handleApprove = async (approvalId: string, level: string, actionType: 'approve' | 'reject') => {
    if (!user) return

    try {
      await approvePayroll.mutateAsync({
        payrollId: payroll.id,
        approvalId,
        level: level as 'dept_head' | 'admin_head' | 'accountant',
        action: actionType,
        comments: comments[approvalId] || undefined,
        userId: user.id,
      })
      setComments({ ...comments, [approvalId]: '' })
      onApprovalChange?.()
    } catch (error) {
      console.error('Error processing approval:', error)
    }
  }

  const canApprove = (approval: any) => {
    if (!user) return false
    return approval.userId === user.id && approval.status === 'pending'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (approvals.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No approvals required for this payroll.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => {
        const canAct = canApprove(approval)
        const isApproving = approvePayroll.isPending
        const isActorForApproval = user?.id && approval.userId === user.id
        const canAddApprover = Boolean(isActorForApproval && canAddApproverPermission)

        return (
          <Card key={approval.id} className={canAct ? 'border-blue-200 bg-blue-50/50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="mt-1">{getStatusIcon(approval.status)}</div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{approval.user?.fullName || 'Unknown'}</span>
                      <Badge className={statusColors[approval.status as keyof typeof statusColors]} variant="outline">
                        {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                      </Badge>
                      <Badge variant="outline">{levelLabels[approval.level as keyof typeof levelLabels] ?? approval.level}</Badge>
                    </div>
                    {approval.comments && (
                      <p className="text-sm text-gray-600 mt-2">{approval.comments}</p>
                    )}
                    {approval.actionDate && (
                      <p className="text-xs text-gray-500 mt-1">
                        Action taken: {new Date(approval.actionDate).toLocaleString()}
                      </p>
                    )}
                    {approval.addedBy && (
                      <p className="text-[11px] text-gray-400 mt-1">
                        Added by {approval.addedBy.fullName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3 ml-4">
                  {canAddApprover && (
                    <AddApproverDialog
                      approvalId={approval.id}
                      entityType="payroll"
                      currentLevel={approval.level}
                      onSuccess={() => onApprovalChange?.()}
                      trigger={
                        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                          <UserPlus className="h-3 w-3" /> Add approver
                        </Button>
                      }
                    />
                  )}

                  {canAct && (
                    <div className="flex flex-col gap-2">
                      <div className="space-y-2">
                        <Label htmlFor={`comments-${approval.id}`}>Comments (optional)</Label>
                        <Textarea
                          id={`comments-${approval.id}`}
                          placeholder="Add comments..."
                          value={comments[approval.id] || ''}
                          onChange={(e) =>
                            setComments({ ...comments, [approval.id]: e.target.value })
                          }
                          rows={2}
                          className="w-64"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setAction({ ...action, [approval.id]: 'reject' })
                            handleApprove(approval.id, approval.level, 'reject')
                          }}
                          disabled={isApproving}
                          className="text-red-600 hover:text-red-700"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setAction({ ...action, [approval.id]: 'approve' })
                            handleApprove(approval.id, approval.level, 'approve')
                          }}
                          disabled={isApproving}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

