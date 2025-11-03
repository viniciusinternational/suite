'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePendingApprovals } from '@/hooks/use-approvals';
import { Clock } from 'lucide-react';
import { ApprovalItem } from './approval-item';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PendingApprovalsList() {
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

  // Group approvals by type
  const requestApprovals = pendingApprovals.filter((a) => a.type === 'request');
  const projectApprovals = pendingApprovals.filter((a) => a.type === 'project');
  const leaveApprovals = pendingApprovals.filter((a) => a.type === 'leave');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Approvals
          </CardTitle>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {pendingApprovals.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              All ({pendingApprovals.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests ({requestApprovals.length})
            </TabsTrigger>
            <TabsTrigger value="projects">
              Projects ({projectApprovals.length})
            </TabsTrigger>
            <TabsTrigger value="leave">
              Leave ({leaveApprovals.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <ApprovalItem key={approval.id} approval={approval} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <div className="space-y-4">
              {requestApprovals.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No pending request approvals</p>
              ) : (
                requestApprovals.map((approval) => (
                  <ApprovalItem key={approval.id} approval={approval} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="projects" className="mt-4">
            <div className="space-y-4">
              {projectApprovals.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No pending project approvals</p>
              ) : (
                projectApprovals.map((approval) => (
                  <ApprovalItem key={approval.id} approval={approval} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="leave" className="mt-4">
            <div className="space-y-4">
              {leaveApprovals.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No pending leave approvals</p>
              ) : (
                leaveApprovals.map((approval) => (
                  <ApprovalItem key={approval.id} approval={approval} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

