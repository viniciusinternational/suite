'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { MilestoneForm } from '@/components/project/milestone-form';
import { useMilestonesWithPagination, useCreateMilestone, useDeleteMilestone } from '@/hooks/use-milestones';
import { Skeleton } from '@/components/ui/skeleton';
import type { Milestone } from '@/types';

interface MilestoneListProps {
  projectId: string;
  projectStartDate: string;
  projectEndDate: string;
}

export function MilestoneList({ projectId, projectStartDate, projectEndDate }: MilestoneListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filters = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchQuery || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  };

  const { data, isLoading } = useMilestonesWithPagination(projectId, filters);
  const createMilestone = useCreateMilestone(projectId);
  const deleteMilestone = useDeleteMilestone(projectId);

  const milestones = data?.data || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 10, totalPages: 0 };
  const analytics = data?.analytics || {
    total: 0,
    completed: 0,
    overdue: 0,
    inProgress: 0,
    totalBudget: 0,
    totalSpent: 0,
    averageProgress: 0,
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const handleMilestoneSubmit = async (formData: any) => {
    await createMilestone.mutateAsync(formData);
    setIsModalOpen(false);
    setPage(1); // Reset to first page after creating
  };

  const handleDelete = async (milestoneId: string) => {
    if (confirm('Are you sure you want to delete this milestone?')) {
      await deleteMilestone.mutateAsync(milestoneId);
    }
  };

  const hasActiveFilters = statusFilter !== 'all' || searchQuery || startDate || endDate;

  const clearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>
              {isLoading ? 'Loading...' : `${pagination.total} milestone${pagination.total !== 1 ? 's' : ''}`}
            </CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Milestone
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analytics Summary */}
        {analytics.total > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold">{analytics.total}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-700">{analytics.completed}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-700">{analytics.inProgress}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-700">{analytics.overdue}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search milestones..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setPage(1);
          }}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Start Date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-40"
          />
          <Input
            type="date"
            placeholder="End Date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full md:w-40"
          />
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </div>

        {/* Milestones Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : milestones.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">No milestones found</p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="mt-2">
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Milestone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {milestones.map((milestone: Milestone & { _count?: { tasks: number } }) => (
                    <TableRow key={milestone.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{milestone.name}</p>
                          {milestone.description && (
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {milestone.description}
                            </p>
                          )}
                          {milestone._count && (
                            <p className="text-xs text-gray-400">
                              {milestone._count.tasks} task{milestone._count.tasks !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeColor(milestone.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(milestone.status)}
                            {milestone.status.replace('_', ' ')}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{milestone.progress}%</span>
                          </div>
                          <Progress value={milestone.progress} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(milestone.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <DollarSign className="h-4 w-4 mr-1 text-gray-500" />
                            {formatCurrency(milestone.budget)}
                          </div>
                          {milestone.spent > 0 && (
                            <p className="text-xs text-gray-500">
                              Spent: {formatCurrency(milestone.spent)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(milestone.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} milestones
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Select
                    value={String(limit)}
                    onValueChange={(value) => {
                      setLimit(Number(value));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Add Milestone Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Milestone</DialogTitle>
            <DialogDescription>
              Add a new milestone to track project progress
            </DialogDescription>
          </DialogHeader>
          <MilestoneForm
            onSubmit={handleMilestoneSubmit}
            onCancel={() => setIsModalOpen(false)}
            isSubmitting={createMilestone.isPending}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}


