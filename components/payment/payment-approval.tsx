'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CheckCircle2, XCircle, Clock, User, UserPlus } from 'lucide-react'

import type { Payment } from '@/types'
import { useApprovePayment } from '@/hooks/use-payments'
import { useAuthStore } from '@/store/auth-store'
import { AddApproverDialog } from '@/components/approvals/add-approver-dialog'
import { hasPermission } from '@/lib/permissions'

interface PaymentApprovalProps {
  payment: Payment
  onApprovalChange?: () => void
}

const levelLabels: Record<string, string> = {
  accountant: 'Accountant',
  finance_manager: 'Finance Manager',
  ceo: 'CEO',
}

const statusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

export function PaymentApproval({ payment, onApprovalChange }: PaymentApprovalProps) {
  const { user } = useAuthStore()
  const approvePayment = useApprovePayment(payment.id)
  const [comments, setComments] = useState<Record<string, string>>({})
  const canAddApproverPermission = hasPermission(user ?? null, 'add_approvers') || hasPermission(user ?? null, 'manage_approvers')

  const approvals = payment.approvals ?? []

  const handleApprove = async (
    approvalId: string,
    level: string,
    action: 'approve' | 'reject'
  ) => {
    if (!user) return

    try {
      await approvePayment.mutateAsync({
        approvalId,
        userId: user.id,
        level,
        action,
        comments: comments[approvalId] || undefined,
      })

      setComments(prev => ({ ...prev, [approvalId]: '' }))
      onApprovalChange?.()
    } catch (error) {
      console.error('Error processing payment approval:', error)
    }
  }

  const canApprove = (approval: Payment['approvals'][number]) => {
    if (!user) return false
    return approval.userId === user.id && approval.status === 'pending'
  }

  if (approvals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Approval Workflow</CardTitle>
          <CardDescription>No approval stages configured for this payment.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Workflow</CardTitle>
        <CardDescription>Review and manage the approval stages for this payment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {approvals.map(approval => {
          const canAct = canApprove(approval)
          const isProcessing = approvePayment.isPending
          const levelLabel = levelLabels[approval.level] ?? approval.level
          const isActor = user?.id && approval.userId === user.id
          const canAddApprover = Boolean(isActor && canAddApproverPermission)

          return (
            <div
              key={approval.id}
              className="flex flex-col gap-4 rounded-lg border p-4 md:flex-row md:items-start md:justify-between"
            >
              <div className="flex flex-1 items-start gap-3">
                <div className="mt-1">
                  {approval.status === 'approved' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : approval.status === 'rejected' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-sm">
                      {approval.user?.fullName || 'Unassigned'}
                    </span>
                    <Badge
                      variant="outline"
                      className={statusColors[approval.status as keyof typeof statusColors] || statusColors.pending}
                    >
                      {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {levelLabel}
                    </Badge>
                  </div>

                  {approval.comments && (
                    <p className="text-sm text-gray-600">{approval.comments}</p>
                  )}
                  {approval.actionDate && (
                    <p className="text-xs text-gray-400">
                      {new Date(approval.actionDate).toLocaleString()}
                    </p>
                  )}
                  {approval.addedBy && (
                    <p className="text-[11px] text-gray-400">
                      Added by {approval.addedBy.fullName}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
                {canAddApprover && (
                  <AddApproverDialog
                    approvalId={approval.id}
                    entityType="payment"
                    currentLevel={approval.level}
                    requiredPermission="approve_payments"
                    onSuccess={() => onApprovalChange?.()}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs">
                        <UserPlus className="h-3 w-3" /> Add approver
                      </Button>
                    }
                  />
                )}

                {canAct && (
                  <div className="flex flex-col gap-2 md:items-end">
                    <div className="space-y-1">
                      <Label htmlFor={`payment-comment-${approval.id}`}>Comments (optional)</Label>
                      <Textarea
                        id={`payment-comment-${approval.id}`}
                        value={comments[approval.id] || ''}
                        onChange={event => setComments(prev => ({ ...prev, [approval.id]: event.target.value }))}
                        rows={2}
                        className="md:w-64"
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        disabled={isProcessing}
                        onClick={() => handleApprove(approval.id, approval.level, 'reject')}
                      >
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 text-white hover:bg-green-700"
                        disabled={isProcessing}
                        onClick={() => handleApprove(approval.id, approval.level, 'approve')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}


