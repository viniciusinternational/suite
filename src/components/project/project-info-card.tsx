'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  User,
  Calendar,
  DollarSign,
  Clock,
  TrendingUp,
  Flag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { Project } from '@/types';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';

interface ProjectInfoCardProps {
  project: Project | null;
  isLoading?: boolean;
}

export function ProjectInfoCard({ project, isLoading }: ProjectInfoCardProps) {
  // Fetch analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['project', project?.id, 'analytics'],
    queryFn: async () => {
      if (!project?.id) return null;
      const response = await axios.get(`/projects/${project.id}/analytics`);
      return response.data.data;
    },
    enabled: !!project?.id,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityBadgeColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 border-gray-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTimelineStatusIcon = (status: string) => {
    switch (status) {
      case 'on_track':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'at_risk':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'delayed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (isLoading || !project) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  const analytics = analyticsData || {
    progress: project.progress,
    budgetUtilization: {
      budget: project.budget,
      spent: project.spent,
      remaining: project.budget - project.spent,
      percentage: project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0,
    },
    timeline: {
      status: 'on_track' as const,
      daysRemaining: 0,
      completionPercentage: 0,
    },
    milestones: {
      total: 0,
      completed: 0,
      completionRate: 0,
    },
    tasks: {
      total: 0,
      completed: 0,
      completionRate: 0,
    },
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-2xl mb-2">{project.name}</CardTitle>
            <CardDescription className="text-base">{project.code}</CardDescription>
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant="outline" className={getStatusBadgeColor(project.status)}>
              {project.status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
            <Badge variant="outline" className={getPriorityBadgeColor(project.priority)}>
              {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        {project.description && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
            <p className="text-sm text-gray-600">{project.description}</p>
          </div>
        )}

        {/* Project Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Overall Progress</p>
            <span className="text-sm font-bold">{analytics.progress}%</span>
          </div>
          <Progress value={analytics.progress} className="h-3" />
        </div>

        {/* Team & Organization */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Team & Organization</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Project Manager</p>
                <p className="text-sm font-medium">
                  {project.manager?.fullName || 'Unassigned'}
                </p>
              </div>
              {project.manager?.avatar && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {project.manager.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Department</p>
                <p className="text-sm font-medium">
                  {project.department?.name || 'No Department'}
                </p>
              </div>
            </div>
            {project.clientName && (
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-gray-500" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Client</p>
                  <p className="text-sm font-medium">{project.clientName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Timeline</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">Start Date</p>
                <p className="text-sm font-medium">{formatDate(project.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                <p className="text-xs text-gray-500">End Date</p>
                <p className="text-sm font-medium">{formatDate(project.endDate)}</p>
              </div>
            </div>
            {analytics.timeline && (
              <div className="flex items-center gap-2">
                {getTimelineStatusIcon(analytics.timeline.status)}
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Status</p>
                  <p className="text-sm font-medium capitalize">
                    {analytics.timeline.status.replace('_', ' ')}
                  </p>
                </div>
                {analytics.timeline.daysRemaining > 0 && (
                  <p className="text-xs text-gray-500">
                    {analytics.timeline.daysRemaining} days remaining
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Budget */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-700">Budget</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500">Total Budget</p>
              </div>
              <p className="text-sm font-bold">{formatCurrency(analytics.budgetUtilization.budget)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Spent</p>
              <p className="text-sm font-medium">{formatCurrency(analytics.budgetUtilization.spent)}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">Remaining</p>
              <p className="text-sm font-medium text-green-700">
                {formatCurrency(analytics.budgetUtilization.remaining)}
              </p>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-500">Utilization</p>
                <span className="text-xs font-medium">
                  {analytics.budgetUtilization.percentage}%
                </span>
              </div>
              <Progress value={analytics.budgetUtilization.percentage} className="h-2" />
            </div>
          </div>
        </div>

        {/* Statistics */}
        {(analytics.milestones.total > 0 || analytics.tasks.total > 0) && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-medium text-gray-700">Statistics</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Milestones</p>
                <p className="text-lg font-bold">{analytics.milestones.total}</p>
                {analytics.milestones.total > 0 && (
                  <p className="text-xs text-gray-500">
                    {analytics.milestones.completed} completed ({analytics.milestones.completionRate}%)
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">Tasks</p>
                <p className="text-lg font-bold">{analytics.tasks.total}</p>
                {analytics.tasks.total > 0 && (
                  <p className="text-xs text-gray-500">
                    {analytics.tasks.completed} completed ({analytics.tasks.completionRate}%)
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


