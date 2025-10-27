'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AuditLogDetail } from '@/components/audit/audit-log-detail';
import { useAuditLogs } from '@/hooks/use-audit-logs';
import type { AuditActionType, AuditEntityType } from '@/types';
import { 
  Search, 
  RefreshCw, 
  Filter, 
  FileText, 
  Shield,
  CheckCircle2,
  XCircle,
  Calendar,
  Trash2,
  Plus,
  Edit,
  Eye
} from 'lucide-react';

const AuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [search, setSearch] = useState('');
  const [actionType, setActionType] = useState<string>('all');
  const [entityType, setEntityType] = useState<string>('all');
  const [isSuccessfulFilter, setIsSuccessfulFilter] = useState<string>('all');

  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useAuditLogs({
    search: search || undefined,
    actionType: actionType !== 'all' ? actionType as AuditActionType : undefined,
    entityType: entityType !== 'all' ? entityType as AuditEntityType : undefined,
    isSuccessful: isSuccessfulFilter !== 'all' ? isSuccessfulFilter === 'true' : undefined,
    limit,
    offset,
  });

  const logs = data?.data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const clearFilters = () => {
    setSearch('');
    setActionType('all');
    setEntityType('all');
    setIsSuccessfulFilter('all');
    setPage(1);
  };

  const getActionIcon = (actionType: string) => {
    if (actionType.startsWith('CREATE')) return <Plus className="h-4 w-4" />;
    if (actionType.startsWith('UPDATE') || actionType.startsWith('EDIT')) return <Edit className="h-4 w-4" />;
    if (actionType.startsWith('DELETE')) return <Trash2 className="h-4 w-4" />;
    if (actionType.startsWith('READ') || actionType.startsWith('VIEW')) return <Eye className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getActionColor = (actionType: string) => {
    if (actionType.startsWith('CREATE')) return 'bg-green-100 text-green-800 border-green-300';
    if (actionType.startsWith('UPDATE') || actionType.startsWith('EDIT')) return 'bg-blue-100 text-blue-800 border-blue-300';
    if (actionType.startsWith('DELETE')) return 'bg-red-100 text-red-800 border-red-300';
    if (actionType.startsWith('READ') || actionType.startsWith('VIEW')) return 'bg-gray-100 text-gray-800 border-gray-300';
    if (actionType.includes('LOGIN')) return 'bg-purple-100 text-purple-800 border-purple-300';
    if (actionType.includes('APPROVED') || actionType.includes('SUCCESS')) return 'bg-green-100 text-green-800 border-green-300';
    if (actionType.includes('REJECTED') || actionType.includes('FAILED')) return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) return d.toLocaleDateString();
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getUserInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive system audit trail and activity monitoring
        </p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Action Type */}
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger>
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="READ">Read</SelectItem>
                <SelectItem value="USER_LOGIN">User Login</SelectItem>
                <SelectItem value="USER_LOGOUT">User Logout</SelectItem>
                <SelectItem value="PROJECT_APPROVED">Project Approved</SelectItem>
                <SelectItem value="PROJECT_REJECTED">Project Rejected</SelectItem>
              </SelectContent>
            </Select>

            {/* Entity Type */}
            <Select value={entityType} onValueChange={setEntityType}>
              <SelectTrigger>
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="User">User</SelectItem>
                <SelectItem value="Project">Project</SelectItem>
                <SelectItem value="Department">Department</SelectItem>
                <SelectItem value="DepartmentUnit">Department Unit</SelectItem>
                <SelectItem value="Task">Task</SelectItem>
                <SelectItem value="Milestone">Milestone</SelectItem>
                <SelectItem value="Approval">Approval</SelectItem>
                <SelectItem value="Payment">Payment</SelectItem>
                <SelectItem value="RequestForm">Request Form</SelectItem>
              </SelectContent>
            </Select>

            {/* Success Status */}
            <Select value={isSuccessfulFilter} onValueChange={setIsSuccessfulFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Successful</SelectItem>
                <SelectItem value="false">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>System Activity Logs</CardTitle>
              <CardDescription>
                {total} total entries found
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">Failed to load audit logs</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => {
                      const userSnapshot = typeof log.userSnapshot === 'string' 
                        ? JSON.parse(log.userSnapshot) 
                        : log.userSnapshot;

                      return (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{formatDate(log.timestamp)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {getUserInitials(userSnapshot.fullName)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">{userSnapshot.fullName}</p>
                                <p className="text-xs text-muted-foreground">{userSnapshot.role}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getActionColor(log.actionType)}>
                                <span className="mr-1">{getActionIcon(log.actionType)}</span>
                                {log.actionType}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{log.entityType}</Badge>
                          </TableCell>
                          <TableCell>
                            {log.isSuccessful ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Success
                              </Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="h-3 w-3 mr-1" />
                                Failed
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm truncate">{log.description}</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <AuditLogDetail log={log} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} • Showing {offset + 1} - {Math.min(offset + limit, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogsPage;
