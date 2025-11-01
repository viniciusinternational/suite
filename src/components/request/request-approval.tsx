'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import type { RequestForm, RequestApproval } from '@/types';
import { useState } from 'react';
import { useApproveRequest } from '@/hooks/use-requests';
import { useAuthStore } from '@/store/auth-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface RequestApprovalProps {
  request: RequestForm;
  onApprovalChange?: () => void;
}

export function RequestApproval({ request, onApprovalChange }: RequestApprovalProps) {
  const { user } = useAuthStore();
  const approveRequest = useApproveRequest(request.id);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [approvalLevel, setApprovalLevel] = useState<'dept_head' | 'admin_head' | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  // Check if user can approve at a certain level
  const canApproveAtLevel = (approval: RequestApproval) => {
    if (!user) return false;
    if (approval.status !== 'pending') return false;
    
    // Check if user is the approver for this level
    if (approval.userId !== user.id) return false;

    // Check if request is in the correct status for this approval level
    if (approval.level === 'dept_head' && request.status !== 'pending_dept_head') {
      return false;
    }
    if (approval.level === 'admin_head' && request.status !== 'pending_admin_head') {
      return false;
    }

    return true;
  };

  const handleApprove = async () => {
    if (!approvalLevel || !user) return;

    try {
      await approveRequest.mutateAsync({
        userId: user.id,
        level: approvalLevel,
        action: 'approve',
        comments: comments || undefined,
      });
      setComments('');
      setApprovalDialogOpen(false);
      onApprovalChange?.();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async () => {
    if (!approvalLevel || !user) return;

    try {
      await approveRequest.mutateAsync({
        userId: user.id,
        level: approvalLevel,
        action: 'reject',
        comments: comments || undefined,
      });
      setComments('');
      setRejectDialogOpen(false);
      onApprovalChange?.();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const openApproveDialog = (level: 'dept_head' | 'admin_head') => {
    setApprovalLevel(level);
    setActionType('approve');
    setApprovalDialogOpen(true);
  };

  const openRejectDialog = (level: 'dept_head' | 'admin_head') => {
    setApprovalLevel(level);
    setActionType('reject');
    setRejectDialogOpen(true);
  };

  // Sort approvals by level
  const sortedApprovals = [...(request.approvals || [])].sort((a, b) => {
    const order = { dept_head: 0, admin_head: 1 };
    return (order[a.level as keyof typeof order] || 0) - (order[b.level as keyof typeof order] || 0);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Approval Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedApprovals.length === 0 ? (
            <p className="text-sm text-gray-500">No approvals required</p>
          ) : (
            sortedApprovals.map((approval) => {
              const canApprove = canApproveAtLevel(approval);
              const isPending = approval.status === 'pending';

              return (
                <div
                  key={approval.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(approval.status)}
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {approval.level.replace('_', ' ')} Approval
                      </p>
                      <p className="text-xs text-gray-500">
                        {approval.user?.fullName || 'Pending Assignment'}
                      </p>
                      {approval.comments && (
                        <p className="text-xs text-gray-600 mt-1 italic">
                          "{approval.comments}"
                        </p>
                      )}
                      {approval.actionDate && (
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(approval.actionDate).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getStatusColor(approval.status)}>
                      {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                    </Badge>
                    {canApprove && isPending && (
                      <div className="flex gap-2">
                        <Dialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => openApproveDialog(approval.level as 'dept_head' | 'admin_head')}
                            >
                              Approve
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Approve Request</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to approve this request? You can add comments below.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="comments">Comments (Optional)</Label>
                                <Textarea
                                  id="comments"
                                  placeholder="Add your approval comments..."
                                  value={comments}
                                  onChange={(e) => setComments(e.target.value)}
                                  rows={4}
                                  className="mt-2"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setApprovalDialogOpen(false);
                                  setComments('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button onClick={handleApprove} disabled={approveRequest.isPending}>
                                {approveRequest.isPending ? 'Approving...' : 'Approve'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => openRejectDialog(approval.level as 'dept_head' | 'admin_head')}
                            >
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reject Request</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to reject this request? Please provide a reason.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="reject-comments">Rejection Reason</Label>
                                <Textarea
                                  id="reject-comments"
                                  placeholder="Please provide a reason for rejection..."
                                  value={comments}
                                  onChange={(e) => setComments(e.target.value)}
                                  rows={4}
                                  className="mt-2"
                                  required
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setRejectDialogOpen(false);
                                  setComments('');
                                }}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={handleReject}
                                disabled={approveRequest.isPending || !comments.trim()}
                              >
                                {approveRequest.isPending ? 'Rejecting...' : 'Reject'}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}


