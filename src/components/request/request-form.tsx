'use client';

import { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCreateRequest, useUpdateRequest } from '@/hooks/use-requests';
import { useAuthStore } from '@/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { RequestForm as RequestFormType } from '@/types';
import { FileText, Package, DollarSign, Plus, Trash2, X, Loader2, Edit } from 'lucide-react';

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
type ItemFormData = z.infer<typeof itemSchema>;

interface RequestFormProps {
  request?: RequestFormType;
  onSuccess?: () => void;
}

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ItemFormData | null;
  itemIndex?: number;
  onSave: (item: ItemFormData, index?: number) => void;
}

function ItemModal({ open, onOpenChange, item, itemIndex, onSave }: ItemModalProps) {
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    specifications: '',
  });

  // Update form data when item or open state changes
  useEffect(() => {
    if (open && item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        specifications: item.specifications || '',
      });
    } else if (open && !item) {
      setFormData({
        name: '',
        description: '',
        quantity: 1,
        unitPrice: 0,
        specifications: '',
      });
    }
  }, [open, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalPrice = formData.quantity * formData.unitPrice;
    onSave({ ...formData, totalPrice }, itemIndex);
    setFormData({
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      specifications: '',
    });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      specifications: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{itemIndex !== undefined ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <DialogDescription>
            {itemIndex !== undefined ? 'Update item details' : 'Add a new item to the request'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Item Name *</label>
            <Input
              placeholder="Enter item name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              placeholder="Enter item description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity *</label>
              <Input
                type="number"
                placeholder="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) || 1 })}
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unit Price (₦) *</label>
              <Input
                type="number"
                placeholder="0.00"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: Number(e.target.value) || 0 })}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Specifications (Optional)</label>
              <Input
                placeholder="Enter specifications"
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCancel} className="gap-2">
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <Plus className="h-4 w-4" />
              {itemIndex !== undefined ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function RequestForm({ request, onSuccess }: RequestFormProps) {
  const { user } = useAuthStore();
  const isEditMode = !!request;
  const createRequest = useCreateRequest();
  const updateRequest = useUpdateRequest(request?.id || '');
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | undefined>(undefined);
  const [editingItem, setEditingItem] = useState<ItemFormData | null>(null);

  // Fetch departments
  const { data: departments = [], isLoading: isLoadingDepartments } = useQuery({
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

  const { fields, append, remove, update } = useFieldArray({
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

  const handleAddItem = () => {
    setEditingItem(null);
    setEditingItemIndex(undefined);
    setIsItemModalOpen(true);
  };

  const handleEditItem = (index: number) => {
    const item = fields[index];
    setEditingItem(item);
    setEditingItemIndex(index);
    setIsItemModalOpen(true);
  };

  const handleSaveItem = (item: ItemFormData, index?: number) => {
    if (index !== undefined) {
      // Update existing item
      update(index, item);
    } else {
      // Add new item
      append(item);
    }
    setIsItemModalOpen(false);
    setEditingItem(null);
    setEditingItemIndex(undefined);
  };

  const handleRemoveItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="request-form">
        {/* Split Layout: Left (Basic Info 70%), Right (Items List 30%) */}
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left Column: Basic Information (70% width) */}
          <div className="lg:col-span-7 space-y-6">
            <Card className="shadow-sm border-2">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isLoadingDepartments}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={isLoadingDepartments ? "Loading..." : "Select department"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingDepartments ? (
                            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Loading departments...</span>
                            </div>
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
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card className="shadow-sm border-2 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Items</p>
                    <p className="text-2xl font-bold text-foreground">{fields.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">
                      ₦{totalAmount.toLocaleString('en-NG')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Items List (30% width) */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="shadow-sm border-2">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Request Items
                  </CardTitle>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddItem}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Package className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-xs text-muted-foreground mb-1">No items added</p>
                    <p className="text-[10px] text-muted-foreground">Click "Add" to add items</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto pr-2">
                    {fields.map((field, index) => {
                      const item = form.watch(`items.${index}`);
                      const itemTotal = (item?.quantity || 0) * (item?.unitPrice || 0);
                      return (
                        <Card 
                          key={field.id} 
                          className="border hover:shadow-sm transition-shadow bg-card"
                        >
                          <CardContent className="p-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-xs truncate">
                                    {item?.name || 'Unnamed Item'}
                                  </h4>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                    {item?.quantity || 0}x
                                  </Badge>
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                                    {formatCurrency(item?.unitPrice || 0)}
                                  </Badge>
                                  {item?.specifications && (
                                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                      {item.specifications}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-bold text-primary whitespace-nowrap">
                                  {formatCurrency(itemTotal)}
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditItem(index)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                {fields.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(index)}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onSuccess} className="gap-2">
            <X className="h-4 w-4" />
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createRequest.isPending || updateRequest.isPending} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            {createRequest.isPending || updateRequest.isPending
              ? `${isEditMode ? 'Updating' : 'Creating'}...`
              : isEditMode ? 'Update' : 'Add'}
          </Button>
        </div>
      </form>

      {/* Item Modal */}
      <ItemModal
        open={isItemModalOpen}
        onOpenChange={setIsItemModalOpen}
        item={editingItem}
        itemIndex={editingItemIndex}
        onSave={handleSaveItem}
      />
    </Form>
  );
}
