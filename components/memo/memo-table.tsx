'use client';

import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Memo } from '@/types';

interface Props {
  memos: Memo[];
  isLoading?: boolean;
}

const priorityConfig = {
  low: { color: 'bg-gray-100 text-gray-700', label: 'Low' },
  medium: { color: 'bg-blue-100 text-blue-700', label: 'Medium' },
  high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
  urgent: { color: 'bg-red-100 text-red-700', label: 'Urgent' },
};

export function MemoTable({ memos, isLoading = false }: Props) {
  const router = useRouter();

  const formatDate = (iso?: string) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  const formatDateTime = (iso?: string) => {
    if (!iso) return 'N/A';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Title</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead>Recipients</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
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
            <TableHead>Title</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Recipients</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-600">
                No memos found
              </TableCell>
            </TableRow>
          ) : (
            memos.map((memo) => {
              const priority = priorityConfig[memo.priority];
              const expiresAtDate = memo.expiresAt ? new Date(memo.expiresAt) : null;
              const isExpired = expiresAtDate && !isNaN(expiresAtDate.getTime()) && expiresAtDate < new Date();

              return (
                <TableRow
                  key={memo.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/memos/${memo.id}`)}
                >
                  <TableCell className="font-medium">{memo.title}</TableCell>
                  <TableCell>
                    <Badge className={priority.color}>{priority.label}</Badge>
                  </TableCell>
                  <TableCell>{memo.createdBy?.fullName || 'Unknown'}</TableCell>
                  <TableCell>
                    {memo.isGlobal ? (
                      <Badge variant="secondary" className="text-xs">Everyone</Badge>
                    ) : (
                      <span className="text-sm text-gray-700">
                        {`${memo.users?.length || 0} users, ${memo.departments?.length || 0} depts`}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{formatDateTime(memo.createdAt)}</TableCell>
                  <TableCell>
                    {memo.expiresAt ? (
                      <span className={isExpired ? 'text-red-600' : ''}>
                        {formatDate(memo.expiresAt)}
                      </span>
                    ) : (
                      'Never'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={memo.isActive ? 'default' : 'secondary'}>
                      {memo.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
