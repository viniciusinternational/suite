'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';

// Validation schema
const milestoneSchema = z.object({
  name: z.string().min(3, 'Milestone name must be at least 3 characters'),
  description: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  budget: z.coerce.number().min(0, 'Budget must be 0 or greater').default(0),
});

type MilestoneFormData = z.infer<typeof milestoneSchema>;

interface MilestoneFormProps {
  onSubmit: (data: MilestoneFormData) => Promise<void>;
  onCancel: () => void;
  defaultValues?: Partial<MilestoneFormData>;
  isSubmitting?: boolean;
}

export function MilestoneForm({
  onSubmit,
  onCancel,
  defaultValues,
  isSubmitting = false,
}: MilestoneFormProps) {
  const form = useForm<MilestoneFormData>({
    resolver: zodResolver(milestoneSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      dueDate: defaultValues?.dueDate || '',
      budget: defaultValues?.budget || 0,
    },
  });

  const handleSubmit = async (values: MilestoneFormData) => {
    await onSubmit(values);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4" id="milestone-form">
          {/* Row 1: Milestone Name */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Milestone Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter milestone name" {...field} />
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
                      placeholder="Enter milestone description"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Row 3: Due Date and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (₦)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Enter milestone budget"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
        <Button 
          type="submit" 
          form="milestone-form"
          disabled={isSubmitting}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {isSubmitting ? 'Saving...' : 'Add'}
        </Button>
      </div>
    </div>
  );
}

