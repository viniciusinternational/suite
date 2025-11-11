'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { Approval } from '@/types';

interface ApprovalStatusProps {
  approvals: Approval[];
}

export function ApprovalStatus({ approvals }: ApprovalStatusProps) {
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

  // Sort approvals by level (director first, then ceo)
  const sortedApprovals = [...approvals].sort((a, b) => {
    const order = { director: 0, ceo: 1 };
    return (order[a.level as keyof typeof order] || 0) - (order[b.level as keyof typeof order] || 0);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedApprovals.length === 0 ? (
            <p className="text-sm text-gray-500">No approvals required</p>
          ) : (
            <div className="space-y-3">
              {sortedApprovals.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(approval.status)}
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {approval.level} Approval
                      </p>
                      <p className="text-xs text-gray-500">
                        {approval.user?.fullName || 'Pending Assignment'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(approval.status)}>
                    {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

