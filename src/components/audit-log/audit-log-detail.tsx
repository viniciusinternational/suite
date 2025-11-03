'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, User as UserIcon, Server, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { AuditLog } from '@/types';

interface AuditLogDetailProps {
  log: AuditLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function JSONViewer({ data, label }: { data: any; label: string }) {
  if (!data) return null;
  
  return (
    <div className="mt-2">
      <h4 className="text-sm font-semibold mb-2">{label}</h4>
      <ScrollArea className="h-48 rounded-md border p-3 bg-gray-50 dark:bg-gray-900">
        <pre className="text-xs font-mono whitespace-pre-wrap break-words">
          {JSON.stringify(data, null, 2)}
        </pre>
      </ScrollArea>
    </div>
  );
}

export function AuditLogDetail({ log, open, onOpenChange }: AuditLogDetailProps) {
  if (!log) return null;

  const userSnapshot = typeof log.userSnapshot === 'string' 
    ? JSON.parse(log.userSnapshot) 
    : log.userSnapshot;

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionColor = (actionType: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Audit Log Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this audit log entry
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
          <div className="space-y-4">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Status</span>
                  {log.isSuccessful ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Successful
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className={getActionColor(log.actionType)}>
                    {formatActionType(log.actionType)}
                  </Badge>
                  <span className="text-muted-foreground">on</span>
                  <Badge variant="outline" className="capitalize">
                    {log.entityType?.replace(/([A-Z])/g, ' $1').trim()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{log.description}</p>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{userSnapshot?.fullName || (log as any).user?.fullName || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{userSnapshot?.email || (log as any).user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Role:</span>
                    <p className="font-medium">{userSnapshot?.role || (log as any).user?.role || 'N/A'}</p>
                  </div>
                  {(userSnapshot?.departmentId || (log as any).user?.departmentId) && (
                    <div>
                      <span className="text-muted-foreground">Department ID:</span>
                      <p className="font-medium">{userSnapshot?.departmentId || (log as any).user?.departmentId}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Entity Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Entity Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <p className="font-medium capitalize">
                    {log.entityType?.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                </div>
                {log.entityId && (
                  <div>
                    <span className="text-muted-foreground">Entity ID:</span>
                    <p className="font-medium font-mono text-xs break-all">{log.entityId}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timestamp Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timestamp Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatDateTime(log.timestamp || log.createdAt)}</span>
                </div>
                {log.ipAddress && (
                  <div>
                    <span className="text-muted-foreground">IP Address:</span>
                    <p className="font-medium font-mono">{log.ipAddress}</p>
                  </div>
                )}
                {log.userAgent && (
                  <div>
                    <span className="text-muted-foreground">User Agent:</span>
                    <p className="font-medium text-xs break-all">{log.userAgent}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Data Snapshots */}
            {(log.previousData || log.newData) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Data Snapshots</CardTitle>
                  <CardDescription>
                    JSON representations of data before and after the action
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {log.previousData && (
                    <JSONViewer 
                      data={typeof log.previousData === 'string' ? JSON.parse(log.previousData) : log.previousData} 
                      label="Previous Data" 
                    />
                  )}
                  {log.newData && (
                    <JSONViewer 
                      data={typeof log.newData === 'string' ? JSON.parse(log.newData) : log.newData} 
                      label="New Data" 
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

