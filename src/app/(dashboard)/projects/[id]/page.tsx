'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MilestoneForm } from '@/components/project/milestone-form';
import { TaskForm } from '@/components/project/task-form';
import { ApprovalStatus } from '@/components/project/approval-status';
import { useProject } from '@/hooks/use-projects';
import { useMilestones, useCreateMilestone, useUpdateMilestone, useDeleteMilestone } from '@/hooks/use-milestones';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/use-tasks';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function ProjectDetailsPage() {
  useAuthGuard(['view_projects']);
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [activeTab, setActiveTab] = useState('overview');
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [milestoneFilter, setMilestoneFilter] = useState<string>('all');

  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: milestones = [] } = useMilestones(projectId);
  const { data: tasks = [] } = useTasks(projectId, { milestoneId: milestoneFilter });

  const createMilestone = useCreateMilestone(projectId);
  const updateMilestone = useUpdateMilestone(projectId, editingMilestone?.id || '');
  const deleteMilestone = useDeleteMilestone(projectId);

  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask(projectId, editingTask?.id || '');
  const deleteTask = useDeleteTask(projectId);

  if (projectLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
        <Button onClick={() => router.push('/projects')}>Go Back</Button>
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      pending: 'bg-gray-100 text-gray-800 border-gray-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const budgetUtilization = (project.spent / project.budget) * 100;

  const handleMilestoneSubmit = async (data: any) => {
    if (editingMilestone) {
      await updateMilestone.mutateAsync(data);
      setEditingMilestone(null);
    } else {
      await createMilestone.mutateAsync(data);
    }
    setIsMilestoneDialogOpen(false);
  };

  const handleTaskSubmit = async (data: any) => {
    if (editingTask) {
      await updateTask.mutateAsync(data);
      setEditingTask(null);
    } else {
      await createTask.mutateAsync(data);
    }
    setIsTaskDialogOpen(false);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => router.push('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-gray-600">{project.code}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className={getStatusBadgeColor(project.status)}>
            {project.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
          <Badge variant="outline" className={getPriorityBadgeColor(project.priority)}>
            {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Manager</p>
                  <p className="text-sm">{project.manager?.fullName || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Department</p>
                  <p className="text-sm">{project.department?.name || 'No Department'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Client</p>
                  <p className="text-sm">{project.clientName || 'Internal Project'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Timeline</p>
                  <p className="text-sm">
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </p>
                </div>
                {project.description && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Description</p>
                    <p className="text-sm text-gray-700">{project.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Budget</p>
                    <p className="text-lg font-bold">{formatCurrency(project.budget)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Spent</p>
                    <p className="text-lg font-bold">{formatCurrency(project.spent)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Remaining</p>
                    <p className="text-lg font-bold text-green-700">
                      {formatCurrency(project.budget - project.spent)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Utilization</p>
                    <p className="text-lg font-bold">{budgetUtilization.toFixed(1)}%</p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-500">Budget Utilization</p>
                    <span className="text-sm">{budgetUtilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={budgetUtilization} className="h-3" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium text-gray-500">Overall Progress</p>
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-3" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Milestones</p>
                    <p className="text-2xl font-bold">{milestones.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tasks</p>
                    <p className="text-2xl font-bold">{tasks.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {project.approvals && project.approvals.length > 0 && (
              <ApprovalStatus approvals={project.approvals} />
            )}
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Project Milestones</CardTitle>
                <Button onClick={() => {
                  setEditingMilestone(null);
                  setIsMilestoneDialogOpen(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Milestone
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {milestones.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No milestones defined yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsMilestoneDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Milestone
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {milestones.map((milestone: any) => (
                    <div key={milestone.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{milestone.name}</h3>
                          {milestone.description && (
                            <p className="text-sm text-gray-500 mt-1">{milestone.description}</p>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setEditingMilestone(milestone);
                              setIsMilestoneDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={async () => {
                                if (confirm('Are you sure you want to delete this milestone?')) {
                                  await deleteMilestone.mutateAsync(milestone.id);
                                }
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span>Progress</span>
                          <span>{milestone.progress}%</span>
                        </div>
                        <Progress value={milestone.progress} className="h-2" />
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          Due: {formatDate(milestone.dueDate)}
                        </div>
                        <div className="flex items-center space-x-4">
                          <div>
                            <span className="text-gray-500">Budget: </span>
                            {formatCurrency(milestone.budget)}
                          </div>
                          <div>
                            <span className="text-gray-500">Spent: </span>
                            {formatCurrency(milestone.spent)}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusBadgeColor(milestone.status)}>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Project Tasks</CardTitle>
                <div className="flex gap-2">
                  <Select value={milestoneFilter} onValueChange={setMilestoneFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by milestone" />
                    </SelectTrigger>
                  </Select>
                  <Button onClick={() => {
                    setEditingTask(null);
                    setIsTaskDialogOpen(true);
                  }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tasks assigned yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setIsTaskDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Task
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Task</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Timeline</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task: any) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.name}</p>
                            {task.description && (
                              <p className="text-sm text-gray-500">{task.description}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusBadgeColor(task.status)}>
                            {task.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getPriorityBadgeColor(task.priority)}>
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{task.assignee?.fullName || 'Unassigned'}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(task.startDate)}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {formatDate(task.dueDate)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setEditingTask(task);
                                setIsTaskDialogOpen(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this task?')) {
                                    await deleteTask.mutateAsync(task.id);
                                  }
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals">
          {project.approvals && project.approvals.length > 0 ? (
            <ApprovalStatus approvals={project.approvals} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No approval workflow configured</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Milestone Dialog */}
      <Dialog open={isMilestoneDialogOpen} onOpenChange={setIsMilestoneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMilestone ? 'Edit Milestone' : 'Create Milestone'}
            </DialogTitle>
            <DialogDescription>
              {editingMilestone
                ? 'Update milestone details'
                : 'Add a new milestone to track project progress'}
            </DialogDescription>
          </DialogHeader>
          <MilestoneForm
            onSubmit={handleMilestoneSubmit}
            onCancel={() => {
              setIsMilestoneDialogOpen(false);
              setEditingMilestone(null);
            }}
            defaultValues={editingMilestone}
            isSubmitting={
              editingMilestone ? updateMilestone.isPending : createMilestone.isPending
            }
          />
        </DialogContent>
      </Dialog>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTask ? 'Edit Task' : 'Create Task'}
            </DialogTitle>
            <DialogDescription>
              {editingTask
                ? 'Update task details'
                : 'Add a new task to the project'}
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            projectId={projectId}
            onSubmit={handleTaskSubmit}
            onCancel={() => {
              setIsTaskDialogOpen(false);
              setEditingTask(null);
            }}
            defaultValues={editingTask}
            isSubmitting={
              editingTask ? updateTask.isPending : createTask.isPending
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

