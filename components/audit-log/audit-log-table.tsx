'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AuditLog } from '@/types';
import { Eye, CheckCircle2, XCircle } from 'lucide-react';

interface AuditLogTableProps {
  logs: AuditLog[];
  onView?: (log: AuditLog) => void;
}

export function AuditLogTable({ logs, onView }: AuditLogTableProps) {
  const getActionTypeColor = (actionType: string) => {
    if (actionType.includes('CREATE')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    if (actionType.includes('UPDATE') || actionType.includes('CHANGED')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    if (actionType.includes('DELETE')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (actionType.includes('APPROVED') || actionType.includes('COMPLETED') || actionType.includes('PROCESSED')) {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (actionType.includes('REJECTED') || actionType.includes('FAILED')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    if (actionType.includes('LOGIN') || actionType.includes('LOGOUT')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const truncateDescription = (description: string, maxLength = 80) => {
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Timestamp</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Entity Type</TableHead>
            <TableHead>Entity ID</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-600">
                No audit logs found
              </TableCell>
            </TableRow>
          ) : (
            logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">
                  {formatTimestamp(log.timestamp || log.createdAt)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {(log.userSnapshot as any)?.fullName || (log as any).user?.fullName || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {(log.userSnapshot as any)?.email || (log as any).user?.email || ''}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getActionTypeColor(log.actionType)}>
                    {formatActionType(log.actionType)}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize">
                  {log.entityType?.replace(/([A-Z])/g, ' $1').trim()}
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {log.entityId ? (
                    <span className="truncate max-w-[120px] inline-block" title={log.entityId}>
                      {log.entityId}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[300px]">
                  <span className="truncate block" title={log.description}>
                    {truncateDescription(log.description)}
                  </span>
                </TableCell>
                <TableCell>
                  {log.isSuccessful ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1 w-fit">
                      <CheckCircle2 className="h-3 w-3" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1 w-fit">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onView(log)}
                      className="h-8"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

