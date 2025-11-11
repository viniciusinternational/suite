'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateProject } from '@/hooks/use-projects';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import {
  FolderKanban,
  Building2,
  Calendar,
  ArrowLeft,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';

// Validation schema
const createProjectSchema = z.object({
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  code: z.string().min(3, 'Project code must be at least 3 characters'),
  description: z.string().optional(),
  clientName: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  managerId: z.string().min(1, 'Project manager is required'),
  budget: z
    .number()
    .min(0, 'Budget must be zero or greater'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

const milestoneSchema = z.object({
  name: z.string().min(3, 'Milestone name must be at least 3 characters'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  budget: z.coerce.number().min(0, 'Budget must be 0 or greater'),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;
type MilestoneFormData = z.infer<typeof milestoneSchema>;

export default function NewProjectPage() {
  useAuthGuard(['add_projects']);
  const router = useRouter();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [milestones, setMilestones] = useState<MilestoneFormData[]>([]);
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [editingMilestoneIndex, setEditingMilestoneIndex] = useState<number | null>(null);
  const [isCreatingMilestones, setIsCreatingMilestones] = useState(false);

  const createProject = useCreateProject();

  // Fetch departments
  const { data: departments = [], isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axios.get('/departments');
      return response.data.data;
    },
  });

  // Fetch users for selected department
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users', selectedDepartment],
    queryFn: async () => {
      if (!selectedDepartment) return [];
      const response = await axios.get(`/users?department=${selectedDepartment}`);
      return response.data.data;
    },
    enabled: !!selectedDepartment,
  });

  const createProjectResolver = zodResolver<
    CreateProjectFormData,
    typeof createProjectSchema,
    CreateProjectFormData
  >(createProjectSchema);
  const milestoneResolver = zodResolver<
    MilestoneFormData,
    typeof milestoneSchema,
    MilestoneFormData
  >(milestoneSchema);

  const form = useForm<CreateProjectFormData>({
    resolver: createProjectResolver,
    defaultValues: {
      name: '',
      code: '',
      description: '',
      clientName: '',
      departmentId: '',
      managerId: '',
      budget: 0,
      startDate: '',
      endDate: '',
      priority: 'medium',
    },
  });

  const milestoneForm = useForm<MilestoneFormData>({
    resolver: milestoneResolver,
    defaultValues: {
      name: '',
      description: '',
      dueDate: '',
      budget: 0,
    },
  });

  const addMilestone = (data: MilestoneFormData) => {
    if (editingMilestoneIndex !== null) {
      // Update existing milestone
      const updated = [...milestones];
      updated[editingMilestoneIndex] = data;
      setMilestones(updated);
      setEditingMilestoneIndex(null);
    } else {
      // Add new milestone
      setMilestones([...milestones, data]);
    }
    milestoneForm.reset();
    setIsMilestoneModalOpen(false);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const editMilestone = (index: number) => {
    const milestone = milestones[index];
    milestoneForm.reset(milestone);
    setEditingMilestoneIndex(index);
    setIsMilestoneModalOpen(true);
  };

  const validateMilestoneDates = (dueDate: string): boolean => {
    const startDate = form.getValues('startDate');
    const endDate = form.getValues('endDate');
    if (!startDate || !endDate) return false;
    
    const milestoneDate = new Date(dueDate);
    const projectStart = new Date(startDate);
    const projectEnd = new Date(endDate);
    
    return milestoneDate >= projectStart && milestoneDate <= projectEnd;
  };

  const onSubmit = async (values: CreateProjectFormData) => {
    try {
      // Validate milestone dates
      const invalidMilestones = milestones.filter(
        (m) => !validateMilestoneDates(m.dueDate)
      );
      
      if (invalidMilestones.length > 0) {
        form.setError('root', {
          message: 'Some milestone dates are outside the project timeline. Please check and update them.',
        });
        return;
      }

      // Create project
      const projectResponse = await createProject.mutateAsync(values);
      const projectId = projectResponse.data.id;

      // Create milestones if any
      if (milestones.length > 0) {
        setIsCreatingMilestones(true);
        try {
          for (const milestone of milestones) {
            try {
              await axios.post(`/projects/${projectId}/milestones`, milestone);
            } catch (error: any) {
              console.error('Error creating milestone:', error);
              // Continue creating other milestones even if one fails
            }
          }
        } finally {
          setIsCreatingMilestones(false);
        }
      }

      // Redirect to project detail page
      router.push(`/projects/${projectId}`);
    } catch (error: any) {
      form.setError('root', {
        message: error?.response?.data?.error || 'Failed to create project',
      });
    }
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

  const projectStartDate = form.watch('startDate');
  const projectEndDate = form.watch('endDate');

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/projects')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Project</h1>
            <p className="text-gray-600 mt-1">Fill in project details and add milestones</p>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Project Basic Information
              </CardTitle>
              <CardDescription>
                Enter the essential details for your new project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Basic Information Section */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter project name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Code</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., PRJ-2024-001" {...field} />
                            </FormControl>
                            <FormDescription>
                              A unique identifier for the project
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter project description"
                              {...field}
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Team & Organization Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Team & Organization
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="departmentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Department</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedDepartment(value);
                                form.setValue('managerId', '');
                              }}
                              defaultValue={field.value}
                              disabled={departmentsLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  {departmentsLoading ? (
                                    <span className="text-gray-400">Loading departments...</span>
                                  ) : (
                                    <SelectValue placeholder="Select department" />
                                  )}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {departmentsLoading ? (
                                  <SelectItem value="_loading" disabled>Loading...</SelectItem>
                                ) : departments.length === 0 ? (
                                  <SelectItem value="_empty" disabled>No departments found</SelectItem>
                                ) : (
                                  departments.map((dept: any) => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                      {dept.name}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="managerId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Project Manager</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              disabled={!selectedDepartment || usersLoading}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  {usersLoading ? (
                                    <span className="text-gray-400">Loading managers...</span>
                                  ) : (
                                    <SelectValue placeholder="Select project manager" />
                                  )}
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {usersLoading ? (
                                  <SelectItem value="_loading" disabled>Loading...</SelectItem>
                                ) : users.length === 0 ? (
                                  <SelectItem value="_empty" disabled>No managers found</SelectItem>
                                ) : (
                                  users.map((user: any) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.fullName}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              {!selectedDepartment && 'Select department first'}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Name (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter client name" {...field} />
                          </FormControl>
                          <FormDescription>
                            Leave empty for internal projects
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Timeline & Budget Section */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Timeline & Budget
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="budget"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Budget (₦)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter project budget"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {form.formState.errors.root && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                      {form.formState.errors.root.message}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.push('/projects')}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createProject.isPending || isCreatingMilestones}>
                      {createProject.isPending || isCreatingMilestones
                        ? isCreatingMilestones
                          ? 'Creating milestones...'
                          : 'Creating...'
                        : 'Create Project'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Milestones */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Milestones</CardTitle>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingMilestoneIndex(null);
                    milestoneForm.reset();
                    setIsMilestoneModalOpen(true);
                  }}
                  disabled={!projectStartDate || !projectEndDate}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
              <CardDescription>
                {milestones.length === 0
                  ? 'Add milestones to track project progress'
                  : `${milestones.length} milestone${milestones.length !== 1 ? 's' : ''} added`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!projectStartDate || !projectEndDate ? (
                <div className="text-center py-8 text-sm text-gray-500">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>Set project dates first to add milestones</p>
                </div>
              ) : milestones.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500 mb-4">No milestones added yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className="border rounded-lg p-3 space-y-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{milestone.name}</p>
                          {milestone.description && (
                            <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                              {milestone.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => editMilestone(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600"
                            onClick={() => removeMilestone(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>{formatDate(milestone.dueDate)}</span>
                        {milestone.budget > 0 && (
                          <span>{formatCurrency(milestone.budget)}</span>
                        )}
                      </div>
                      {!validateMilestoneDates(milestone.dueDate) && (
                        <Badge variant="outline" className="text-xs text-red-600 border-red-200">
                          Date outside project timeline
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Milestone Modal */}
      <Dialog open={isMilestoneModalOpen} onOpenChange={setIsMilestoneModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMilestoneIndex !== null ? 'Edit Milestone' : 'Add Milestone'}
            </DialogTitle>
            <DialogDescription>
              {projectStartDate && projectEndDate
                ? `Due date must be between ${formatDate(projectStartDate)} and ${formatDate(projectEndDate)}`
                : 'Set project dates first'}
            </DialogDescription>
          </DialogHeader>
          <Form {...milestoneForm}>
            <form
              onSubmit={milestoneForm.handleSubmit(addMilestone)}
              className="space-y-4"
            >
              <FormField
                control={milestoneForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter milestone name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={milestoneForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter milestone description"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={milestoneForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={projectStartDate || undefined}
                          max={projectEndDate || undefined}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={milestoneForm.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget (₦)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === '' ? 0 : Number(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsMilestoneModalOpen(false);
                    setEditingMilestoneIndex(null);
                    milestoneForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingMilestoneIndex !== null ? 'Update' : 'Add'} Milestone
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
