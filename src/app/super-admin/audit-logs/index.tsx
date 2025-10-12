'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockAuditLogs } from '../mockdata';

const AuditLogs = () => {
  const logs = mockAuditLogs;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>System Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Comprehensive system audit trail</p>
          <div className="mt-4 space-y-2">
            {logs.length === 0 && <p className="text-sm text-gray-500">No audit events.</p>}
            {logs.map((log: any) => (
              <div key={log.id || log._id} className="border-b py-2">
                <div className="text-sm font-medium">{log.action}</div>
                <div className="text-xs text-gray-600">{log.resource} • {new Date(log.timestamp).toLocaleString()}</div>
                {log.details && <div className="text-xs text-gray-700">{log.details}</div>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogs; 