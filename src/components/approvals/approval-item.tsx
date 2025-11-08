'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useApproveAction } from '@/hooks/use-approvals';
import { useAuthStore } from '@/store/auth-store';
import { CheckCircle2, XCircle, FileText, DollarSign, Calendar, FolderKanban, Briefcase, UserPlus, Wallet, CreditCard } from 'lucide-react';
import type { UnifiedApproval } from '@/hooks/use-approvals';
import { AddApproverDialog } from '@/components/approvals/add-approver-dialog';
import { hasPermission } from '@/lib/permissions';

interface ApprovalItemProps {
  approval: UnifiedApproval;
}

export function ApprovalItem({ approval }: ApprovalItemProps) {
  const { user } = useAuthStore();
  const approveAction = useApproveAction(approval.id);
  const [comments, setComments] = useState('');
  const canAddApproverPermission = hasPermission(user ?? null, 'add_approvers') || hasPermission(user ?? null, 'manage_approvers');

  const isProcessing = approveAction.isPending;

  const formatCurrency = (amount?: number, currency = 'NGN') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'dept_head':
        return 'Department Head';
      case 'admin_head':
        return 'Admin Head';
      case 'director':
        return 'Director';
      case 'ceo':
        return 'CEO';
      default:
        return level;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'project':
        return <FolderKanban className="h-4 w-4 text-green-500" />;
      case 'leave':
        return <Briefcase className="h-4 w-4 text-purple-500" />;
      case 'payroll':
        return <Wallet className="h-4 w-4 text-amber-500" />;
      case 'payment':
        return <CreditCard className="h-4 w-4 text-rose-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'request':
        return 'Request';
      case 'project':
        return 'Project';
      case 'leave':
        return 'Leave';
      case 'payroll':
        return 'Payroll';
      case 'payment':
        return 'Payment';
      default:
        return type;
    }
  };

  const handleApprove = async () => {
    if (!user) return;

    try {
      await approveAction.mutateAsync({
        type: approval.type,
        userId: user.id,
        level: approval.level,
        action: 'approve',
        comments: comments || undefined,
      });
      setComments('');
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const handleReject = async () => {
    if (!user) return;

    try {
      await approveAction.mutateAsync({
        type: approval.type,
        userId: user.id,
        level: approval.level,
        action: 'reject',
        comments: comments || undefined,
      });
      setComments('');
    } catch (error) {
      console.error('Error rejecting:', error);
    }
  };

  const entity = approval.entity;
  const canAddApprover = canAddApproverPermission && (approval.type === 'request' || approval.type === 'project');
  const requiredPermission = approval.type === 'request' ? 'approve_requests' : approval.type === 'project' ? 'approve_projects' : undefined;
  const addApproverButton = canAddApprover && requiredPermission ? (
    <AddApproverDialog
      approvalId={approval.approvalId}
      entityType={approval.type === 'project' ? 'project' : 'request'}
      currentLevel={approval.level}
      requiredPermission={requiredPermission}
      trigger={
        <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 text-xs">
          <UserPlus className="h-4 w-4" /> Add approver
        </Button>
      }
    />
  ) : null;

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            {getTypeIcon(approval.type)}
            <h3 className="font-semibold text-lg">{entity.name}</h3>
            <Badge variant="outline" className="capitalize">
              {getTypeLabel(approval.type)}
            </Badge>
            <Badge variant="outline">
              {getLevelLabel(approval.level)}
            </Badge>
          </div>

          {/* Request-specific fields */}
          {approval.type === 'request' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{formatCurrency(entity.amount, entity.currency)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(entity.requestDate)}</span>
              </div>
              <div>
                <span className="text-gray-500">Priority:</span>{' '}
                <Badge variant="outline" className="ml-1 capitalize">
                  {entity.priority || 'Medium'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Type:</span>{' '}
                <span className="capitalize">{entity.type?.replace('_', ' ')}</span>
              </div>
            </div>
          )}

          {/* Project-specific fields */}
          {approval.type === 'project' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <span className="font-medium">Budget: {formatCurrency(entity.budget)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Start: {formatDate(entity.startDate)}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <Badge variant="outline" className="ml-1 capitalize">
                  {entity.status}
                </Badge>
              </div>
              <div>
                <span className="text-gray-500">Priority:</span>{' '}
                <Badge variant="outline" className="ml-1 capitalize">
                  {entity.priority}
                </Badge>
              </div>
            </div>
          )}

          {/* Description */}
          {entity.description && (
            <p className="text-sm text-gray-600 mt-2">{entity.description}</p>
          )}

          {/* Department info */}
          {entity.department && (
            <div className="text-sm text-gray-500">
              Department: {entity.department.name}
            </div>
          )}

          {approval.type === 'payroll' && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Period:</span>{' '}
                <span className="font-medium">
                  {entity.periodMonth}/{entity.periodYear}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <Badge variant="outline" className="capitalize">
                  {entity.status?.replace(/_/g, ' ')}
                </Badge>
              </div>
            </div>
          )}

          {approval.type === 'payment' && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Amount:</span>{' '}
                <span className="font-medium">
                  {entity.currency} {Number(entity.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>{' '}
                <Badge variant="outline" className="capitalize">
                  {entity.status?.replace(/_/g, ' ')}
                </Badge>
              </div>
              {entity.reference && (
                <div className="col-span-2">
                  <span className="text-gray-500">Reference:</span>{' '}
                  <span>{entity.reference}</span>
                </div>
              )}
            </div>
          )}
        </div>
        {addApproverButton}
      </div>

      {/* Approval Actions */}
      <div className="space-y-3 pt-3 border-t">
        {approval.type === 'request' || approval.type === 'project' || approval.type === 'leave' ? (
          <>
            <div>
              <Label htmlFor={`comments-${approval.id}`}>Comments (Optional)</Label>
              <Textarea
                id={`comments-${approval.id}`}
                placeholder="Add your comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
                className="mt-1"
                disabled={isProcessing}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleReject}
                disabled={isProcessing}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleApprove}
                disabled={isProcessing}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isProcessing ? 'Processing...' : 'Approve'}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex justify-end">
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link
                href={
                  approval.type === 'payroll'
                    ? `/payroll/${approval.entityId}`
                    : `/payments/${approval.entityId}`
                }
              >
                Review in {approval.type === 'payroll' ? 'Payroll' : 'Payments'}
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

