'use client';

import { useState, useMemo } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AuditLogTable } from '@/components/audit-log/audit-log-table';
import { AuditLogDetail } from '@/components/audit-log/audit-log-detail';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import { Skeleton } from '@/components/ui/skeleton';
import type { AuditLog, AuditActionType, AuditEntityType } from '@/types';
import { Search, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

// Entity types for filter
const ENTITY_TYPES: AuditEntityType[] = [
  'User',
  'Department',
  'DepartmentUnit',
  'Project',
  'Milestone',
  'Task',
  'Approval',
  'LeaveRequest',
  'Payslip',
  'Payment',
  'RequestForm',
  'RequestApproval',
  'RequestComment',
  'Item',
  'Vendor',
  'Client',
  'AuditLog',
  'Memo',
  'System',
];

// Action types for filter
const ACTION_TYPES: AuditActionType[] = [
  'CREATE',
  'READ',
  'UPDATE',
  'DELETE',
  'USER_LOGIN',
  'USER_LOGOUT',
  'PASSWORD_RESET',
  'PERMISSION_CHANGED',
  'PROJECT_APPROVED',
  'PROJECT_REJECTED',
  'PROJECT_PAUSED',
  'PROJECT_RESUMED',
  'BUDGET_UPDATED',
  'MILESTONE_COMPLETED',
  'TASK_ASSIGNED',
  'TASK_COMPLETED',
  'PAYMENT_PROCESSED',
  'PAYMENT_APPROVED',
  'PAYMENT_REJECTED',
  'LEAVE_REQUESTED',
  'LEAVE_APPROVED',
  'LEAVE_REJECTED',
  'REQUEST_CREATED',
  'REQUEST_APPROVED',
  'REQUEST_REJECTED',
  'REQUEST_COMMENT_ADDED',
  'REQUEST_ATTACHMENT_ADDED',
  'DEPARTMENT_UPDATED',
  'UNIT_CREATED',
  'REPORT_GENERATED',
  'SETTING_CHANGED',
];

const PAGE_SIZES = [10, 25, 50, 100];

export default function AuditLogsPage() {
  const { user } = useAuthGuard(['view_audit_logs']);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [successFilter, setSuccessFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Detail dialog state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Build filter params
  const filterParams = useMemo(() => {
    const params: any = {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
    };

    if (searchQuery.trim()) {
      params.search = searchQuery.trim();
    }
    if (entityTypeFilter !== 'all') {
      params.entityType = entityTypeFilter as AuditEntityType;
    }
    if (actionTypeFilter !== 'all') {
      params.actionType = actionTypeFilter as AuditActionType;
    }
    if (successFilter !== 'all') {
      params.isSuccessful = successFilter === 'success';
    }
    if (startDate) {
      params.startDate = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      params.endDate = end;
    }

    return params;
  }, [searchQuery, entityTypeFilter, actionTypeFilter, successFilter, startDate, endDate, currentPage, pageSize]);

  // Fetch audit logs
  const { data: auditLogsData, isLoading, error } = useAuditLogs(filterParams);

  const logs = auditLogsData?.data || [];
  const total = auditLogsData?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  // Reset to page 1 when filters change
  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setEntityTypeFilter('all');
    setActionTypeFilter('all');
    setSuccessFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  // Handle view detail
  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  // Format action type for display
  const formatActionType = (actionType: string) => {
    return actionType
      .split('_')
      .map(word => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format entity type for display
  const formatEntityType = (entityType: string) => {
    return entityType.replace(/([A-Z])/g, ' $1').trim();
  };

  const hasActiveFilters = searchQuery || entityTypeFilter !== 'all' || actionTypeFilter !== 'all' || successFilter !== 'all' || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Audit Logs</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">View and filter system audit logs</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter audit logs by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilterChange();
                }}
                className="pl-10"
              />
            </div>

            {/* Entity Type */}
            <Select
              value={entityTypeFilter}
              onValueChange={(value) => {
                setEntityTypeFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entity Types</SelectItem>
                {ENTITY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatEntityType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Action Type */}
            <Select
              value={actionTypeFilter}
              onValueChange={(value) => {
                setActionTypeFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Action Types</SelectItem>
                {ACTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatActionType(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Success Status */}
            <Select
              value={successFilter}
              onValueChange={(value) => {
                setSuccessFilter(value);
                handleFilterChange();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success Only</SelectItem>
                <SelectItem value="failed">Failed Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Start Date */}
            <Input
              type="date"
              placeholder="Start Date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleFilterChange();
              }}
            />

            {/* End Date */}
            <Input
              type="date"
              placeholder="End Date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                handleFilterChange();
              }}
            />

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Audit Logs</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${total} log${total !== 1 ? 's' : ''} found`}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Page size:</span>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Failed to load audit logs. Please try again.</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p>No audit logs found matching your filters.</p>
            </div>
          ) : (
            <>
              <AuditLogTable logs={logs} onView={handleViewDetail} />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, total)} of {total} logs
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <AuditLogDetail
        log={selectedLog}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}
