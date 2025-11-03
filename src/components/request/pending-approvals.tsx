'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePendingApprovals } from '@/hooks/use-requests';
import { Clock } from 'lucide-react';
import { PendingApprovalItem } from './pending-approval-item';
import type { RequestApproval, RequestForm } from '@/types';

export function PendingApprovals() {
  const { data: pendingApprovals = [], isLoading } = usePendingApprovals();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading pending approvals...</p>
        </CardContent>
      </Card>
    );
  }

  if (pendingApprovals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No pending approvals requiring your action</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Approvals ({pendingApprovals.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingApprovals.map((approval) => (
            <PendingApprovalItem
              key={approval.id}
              approval={approval as RequestApproval & { requestForm: RequestForm }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

