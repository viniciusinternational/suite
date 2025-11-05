'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateRequest, useUpdateRequest } from '@/hooks/use-requests';
import { useAuthStore } from '@/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { RequestForm as RequestFormType } from '@/types';
import { FileText, Package, DollarSign, Plus, Trash2, X } from 'lucide-react';

// Validation schema
const itemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  description: z.string().optional(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitPrice: z.coerce.number().nonnegative('Unit price must be 0 or greater'),
  specifications: z.string().optional(),
  totalPrice: z.number().optional(),
});

const requestFormSchema = z.object({
  name: z.string().min(3, 'Request name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  type: z.enum(['office_supplies', 'equipment', 'travel', 'training', 'other'], {
    required_error: 'Request type is required',
  }),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  requestDate: z.string().min(1, 'Request date is required'),
  items: z.array(itemSchema).min(1, 'At least one item is required'),
  currency: z.string().default('NGN'),
});

type RequestFormData = z.infer<typeof requestFormSchema>;

interface RequestFormProps {
  request?: RequestFormType;
  onSuccess?: () => void;
}

export function RequestForm({ request, onSuccess }: RequestFormProps) {
  const { user } = useAuthStore();
  const isEditMode = !!request;
  const createRequest = useCreateRequest();
  const updateRequest = useUpdateRequest(request?.id || '');

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axios.get('/departments');
      return response.data.data;
    },
  });

  // Format existing items if in edit mode
  const formatItems = (items?: any[]): z.infer<typeof itemSchema>[] => {
    if (!items || items.length === 0) return [{ name: '', description: '', quantity: 1, unitPrice: 0, specifications: '' }];
    return items.map((item: any) => ({
      name: item.name || '',
      description: item.description || '',
      quantity: item.quantity || 1,
      unitPrice: item.unitPrice || 0,
      specifications: item.specifications || '',
      totalPrice: item.totalPrice || item.quantity * item.unitPrice || 0,
    }));
  };

  const form = useForm<RequestFormData>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      name: request?.name || '',
      description: request?.description || '',
      type: request?.type || 'office_supplies',
      priority: request?.priority || 'medium',
      category: request?.category || '',
      departmentId: request?.departmentId || user?.departmentId || '',
      requestDate: request?.requestDate || new Date().toISOString().split('T')[0],
      items: formatItems(request?.items as any[]),
      currency: request?.currency || 'NGN',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Calculate total amount when items change
  const calculateTotal = () => {
    const items = form.watch('items');
    const total = items.reduce((sum, item) => {
      const itemTotal = item.quantity * item.unitPrice;
      return sum + itemTotal;
    }, 0);
    return total;
  };

  const totalAmount = calculateTotal();

  const onSubmit = async (values: RequestFormData) => {
    try {
      // Calculate total for each item
      const processedItems = values.items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        specifications: item.specifications,
      }));

      const payload = {
        name: values.name,
        description: values.description,
        type: values.type,
        priority: values.priority,
        category: values.category,
        departmentId: values.departmentId,
        requestDate: values.requestDate,
        items: processedItems,
        amount: totalAmount,
        currency: values.currency,
      };

      if (isEditMode) {
        await updateRequest.mutateAsync(payload);
      } else {
        await createRequest.mutateAsync(payload);
      }

      onSuccess?.();
      if (!isEditMode) {
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting request:', error);
    }
  };

  const addItem = () => {
    append({ name: '', description: '', quantity: 1, unitPrice: 0, specifications: '' });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Basic Information Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter request name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="office_supplies">Office Supplies</SelectItem>
                        <SelectItem value="equipment">Equipment</SelectItem>
                        <SelectItem value="travel">Travel</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
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
                      placeholder="Enter detailed description of the request"
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
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
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter category" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requestDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Request Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="departmentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Items Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5" />
                Request Items
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <Card key={field.id} className="border-2">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Item {index + 1}</CardTitle>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <FormField
                    control={form.control}
                    name={`items.${index}.name`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`items.${index}.description`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter item description"
                            {...field}
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="1"
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
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price (₦)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
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
                      name={`items.${index}.specifications`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specifications (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter specifications" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end">
                    <p className="text-sm text-gray-600">
                      Subtotal: ₦
                      {(form.watch(`items.${index}.quantity`) || 0) *
                        (form.watch(`items.${index}.unitPrice`) || 0)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Summary Section */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-lg font-semibold">{fields.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-primary">
                  ₦{totalAmount.toLocaleString('en-NG')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onSuccess} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={createRequest.isPending || updateRequest.isPending} className="gap-2">
            <Plus className="h-4 w-4" />
            {createRequest.isPending || updateRequest.isPending
              ? `${isEditMode ? 'Updating' : 'Creating'}...`
              : isEditMode ? 'Update' : 'Add'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

