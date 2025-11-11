'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PendingApprovalsList } from '@/components/approvals/pending-approvals-list';
import { usePendingApprovals } from '@/hooks/use-approvals';
import { FileText, FolderKanban, Briefcase, Clock, Wallet, CreditCard } from 'lucide-react';

export default function ApprovalsPage() {
  useAuthGuard(['view_approvals']);
  const { data: pendingApprovals = [] } = usePendingApprovals();

  // Calculate statistics
  const stats = {
    total: pendingApprovals.length,
    requests: pendingApprovals.filter((a) => a.type === 'request').length,
    projects: pendingApprovals.filter((a) => a.type === 'project').length,
    leave: pendingApprovals.filter((a) => a.type === 'leave').length,
    payroll: pendingApprovals.filter((a) => a.type === 'payroll').length,
    payments: pendingApprovals.filter((a) => a.type === 'payment').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-600 mt-1">Manage all pending approvals in one place</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Requests</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.requests}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderKanban className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leave</CardTitle>
            <Briefcase className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.leave}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll</CardTitle>
            <Wallet className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.payroll}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payments</CardTitle>
            <CreditCard className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.payments}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals List */}
      <PendingApprovalsList />
    </div>
  );
}

