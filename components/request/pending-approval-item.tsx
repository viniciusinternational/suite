'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useApproveRequest } from '@/hooks/use-requests';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import { CheckCircle2, XCircle, FileText, DollarSign, Calendar } from 'lucide-react';
import type { RequestApproval, RequestForm } from '@/types';

interface PendingApprovalItemProps {
  approval: RequestApproval & { requestForm: RequestForm };
}

export function PendingApprovalItem({ approval }: PendingApprovalItemProps) {
  const { user } = useAuthStore();
  const approveRequest = useApproveRequest(approval.requestFormId);
  const [comments, setComments] = useState('');

  const request = approval.requestForm;
  const isProcessing = approveRequest.isPending;

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
      default:
        return level;
    }
  };

  const handleApprove = async () => {
    if (!user) return;

    try {
      await approveRequest.mutateAsync({
        userId: user.id,
        level: approval.level as 'dept_head' | 'admin_head',
        action: 'approve',
        comments: comments || undefined,
      });
      setComments('');
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async () => {
    if (!user) return;

    try {
      await approveRequest.mutateAsync({
        userId: user.id,
        level: approval.level as 'dept_head' | 'admin_head',
        action: 'reject',
        comments: comments || undefined,
      });
      setComments('');
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
      {/* Request Information */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-lg">{request.name}</h3>
            <Badge variant="outline" className="capitalize">
              {request.type?.replace('_', ' ')}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{formatCurrency(request.amount, request.currency)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{formatDate(request.requestDate)}</span>
            </div>
            <div>
              <span className="text-gray-500">Priority:</span>{' '}
              <Badge variant="outline" className="ml-1 capitalize">
                {request.priority || 'Medium'}
              </Badge>
            </div>
            <div>
              <span className="text-gray-500">Level:</span>{' '}
              <Badge variant="outline" className="ml-1">
                {getLevelLabel(approval.level)}
              </Badge>
            </div>
          </div>

          {request.description && (
            <p className="text-sm text-gray-600 mt-2">{request.description}</p>
          )}
        </div>
      </div>

      {/* Approval Actions */}
      <div className="space-y-3 pt-3 border-t">
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
      </div>
    </div>
  );
}

