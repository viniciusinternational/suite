'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, User, Server, CheckCircle2, XCircle, Info } from 'lucide-react';
import type { AuditLog } from '@/types';

interface AuditLogDetailProps {
  log: AuditLog;
  trigger?: React.ReactNode;
}

function JSONViewer({ data, label }: { data: any; label: string }) {
  if (!data) return null;
  
  return (
    <div className="mt-2">
      <h4 className="text-sm font-semibold mb-2">{label}</h4>
      <ScrollArea className="h-32 rounded-md border p-3">
        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
          {JSON.stringify(data, null, 2)}
        </pre>
      </ScrollArea>
    </div>
  );
}

export function AuditLogDetail({ log, trigger }: AuditLogDetailProps) {
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
    if (actionType.startsWith('CREATE')) return 'bg-green-100 text-green-800';
    if (actionType.startsWith('UPDATE')) return 'bg-blue-100 text-blue-800';
    if (actionType.startsWith('DELETE')) return 'bg-red-100 text-red-800';
    if (actionType.startsWith('READ')) return 'bg-gray-100 text-gray-800';
    return 'bg-purple-100 text-purple-800';
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || <Badge variant="outline">View Details</Badge>}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Audit Log Details
          </DialogTitle>
          <DialogDescription>
            Complete information about this audit log entry
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-4">
            {/* Status Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Status</span>
                  {log.isSuccessful ? (
                    <Badge className="bg-green-100 text-green-800">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Successful
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">
                      <XCircle className="h-3 w-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className={getActionColor(log.actionType)}>
                    {log.actionType}
                  </Badge>
                  <span className="text-muted-foreground">on</span>
                  <Badge variant="outline">{log.entityType}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{log.description}</p>
              </CardContent>
            </Card>

            {/* User Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">{userSnapshot.fullName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">{userSnapshot.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Role:</span>
                    <p className="font-medium">{userSnapshot.role}</p>
                  </div>
                  {userSnapshot.departmentId && (
                    <div>
                      <span className="text-muted-foreground">Department:</span>
                      <p className="font-medium">{userSnapshot.departmentId}</p>
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
                  <p className="font-medium">{log.entityType}</p>
                </div>
                {log.entityId && (
                  <div>
                    <span className="text-muted-foreground">Entity ID:</span>
                    <p className="font-medium">{log.entityId}</p>
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
                  <span className="font-medium">{formatDateTime(log.timestamp)}</span>
                </div>
                {log.ipAddress && (
                  <div>
                    <span className="text-muted-foreground">IP Address:</span>
                    <p className="font-medium">{log.ipAddress}</p>
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
                    <JSONViewer data={log.previousData} label="Previous Data" />
                  )}
                  {log.newData && (
                    <JSONViewer data={log.newData} label="New Data" />
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

