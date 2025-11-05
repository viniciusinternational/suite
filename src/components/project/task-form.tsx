'use client';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { Milestone } from '@/types';
import { X, Plus } from 'lucide-react';

// Validation schema
const taskSchema = z.object({
  name: z.string().min(3, 'Task name must be at least 3 characters'),
  description: z.string().optional(),
  milestoneId: z.string().optional(),
  assigneeId: z.string().optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.coerce.number().positive().optional(),
  actualHours: z.coerce.number().positive().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  projectId: string;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<TaskFormData>;
  isSubmitting?: boolean;
}

export function TaskForm({
  projectId,
  onSubmit,
  onCancel,
  defaultValues,
  isSubmitting = false,
}: TaskFormProps) {
  // Fetch milestones for the project
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', projectId],
    queryFn: async () => {
      const response = await axios.get(`/projects/${projectId}/milestones`);
      return response.data.data as Milestone[];
    },
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get('/users');
      return response.data.data;
    },
  });

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      milestoneId: defaultValues?.milestoneId || '',
      assigneeId: defaultValues?.assigneeId || '',
      status: defaultValues?.status || 'todo',
      priority: defaultValues?.priority || 'medium',
      startDate: defaultValues?.startDate || '',
      dueDate: defaultValues?.dueDate || '',
      estimatedHours: defaultValues?.estimatedHours,
      actualHours: defaultValues?.actualHours,
    },
  });

  const handleSubmit = async (values: TaskFormData) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Row 1: Task Name */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 2: Description (full width) */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter task description"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 3: Milestone and Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="milestoneId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Milestone (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value || undefined)}
                    defaultValue={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select milestone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No Milestone</SelectItem>
                      {milestones.map((milestone) => (
                        <SelectItem key={milestone.id} value={milestone.id}>
                          {milestone.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assignee (Optional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value || undefined)}
                    defaultValue={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select assignee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 4: Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="todo">To Do</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 5: Start Date and Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 6: Estimated Hours and Actual Hours */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="estimatedHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Hours"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="actualHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Actual Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Hours"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onCancel} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Plus className="h-4 w-4" />
            {isSubmitting ? 'Saving...' : 'Add'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

