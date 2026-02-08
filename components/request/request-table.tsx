'use client';

import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { RequestForm } from '@/types';

interface RequestTableProps {
  requests: RequestForm[];
  isLoading?: boolean;
}

export function RequestTable({ requests, isLoading = false }: RequestTableProps) {
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_admin_head':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending_dept_head':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_dept_head':
        return 'Pending Dept Head';
      case 'pending_admin_head':
        return 'Pending Admin Head';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount?: number, currency = 'NGN') => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getApprovalsDisplay = (request: RequestForm) => {
    if (!request.approvals || request.approvals.length === 0) {
      return '0';
    }
    const total = request.approvals.length;
    const approved = request.approvals.filter((a) => a.status === 'approved').length;
    const rejected = request.approvals.filter((a) => a.status === 'rejected').length;
    const pending = request.approvals.filter((a) => a.status === 'pending').length;

    if (rejected > 0) {
      return `${approved}/${total} (Rejected)`;
    }
    if (pending > 0) {
      return `${approved}/${total} (Pending)`;
    }
    return `${approved}/${total}`;
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Approvals</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Approvals</TableHead>
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-600">
                No requests found
              </TableCell>
            </TableRow>
          ) : (
            requests.map((request) => (
              <TableRow
                key={request.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/requests/${request.id}`)}
              >
                <TableCell className="font-medium">{request.name}</TableCell>
                <TableCell className="capitalize">
                  {request.type?.replace('_', ' ')}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusColor(request.status)}>
                    {getStatusLabel(request.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPriorityColor(request.priority)}>
                    {request.priority?.charAt(0).toUpperCase() + request.priority?.slice(1) || 'Medium'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatCurrency(request.amount, request.currency)}
                </TableCell>
                <TableCell>
                  {getApprovalsDisplay(request)}
                </TableCell>
                <TableCell>{formatDate(request.requestDate)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
