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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateRequest, useUpdateRequest } from '@/hooks/use-requests';
import { useAuthStore } from '@/store/auth-store';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import type { RequestForm as RequestFormType } from '@/types';
import { FileText, Package, DollarSign, Plus, Trash2, X, Loader2, Edit, Building2 } from 'lucide-react';

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

interface ItemModalFormState {
  name: string;
  description: string;
  quantity: string;
  unitPrice: string;
  specifications: string;
}

interface ItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ItemFormData | null;
  itemIndex?: number;
  onSave: (item: ItemFormData, index?: number) => void;
}

function ItemModal({ open, onOpenChange, item, itemIndex, onSave }: ItemModalProps) {
  const [formData, setFormData] = useState<ItemModalFormState>({
    name: '',
    description: '',
    quantity: '',
    unitPrice: '',
    specifications: '',
  });
  const [error, setError] = useState<string | null>(null);

  // Update form data when item or open state changes
  useEffect(() => {
    if (open && item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        quantity: item.quantity != null ? String(item.quantity) : '',
        unitPrice: item.unitPrice != null ? String(item.unitPrice) : '',
        specifications: item.specifications || '',
      });
    } else if (open && !item) {
      setFormData({
        name: '',
        description: '',
        quantity: '',
        unitPrice: '',
        specifications: '',
      });
    }
    if (open) setError(null);
  }, [open, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNum = formData.quantity.trim() === '' ? NaN : parseFloat(formData.quantity);
    const priceNum = formData.unitPrice.trim() === '' ? NaN : parseFloat(formData.unitPrice);

    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (Number.isNaN(qtyNum) || qtyNum <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError('Unit price must be 0 or greater');
      return;
    }

    const totalPrice = qtyNum * priceNum;
    onSave(
      {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        quantity: qtyNum,
        unitPrice: priceNum,
        totalPrice,
        specifications: formData.specifications.trim() || undefined,
      },
      itemIndex
    );
    setFormData({ name: '', description: '', quantity: '', unitPrice: '', specifications: '' });
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFormData({ name: '', description: '', quantity: '', unitPrice: '', specifications: '' });
    setError(null);
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
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Item Name *</label>
            <Input
              className="w-full"
              placeholder="Enter item name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description (Optional)</label>
            <Textarea
              className="w-full"
              placeholder="Enter item description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Quantity *</label>
            <Input
              className="w-full"
              type="number"
              placeholder="1"
              min="1"
              step="1"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Unit Price (₦) *</label>
            <Input
              className="w-full"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Specifications (Optional)</label>
            <Input
              className="w-full"
              placeholder="Enter specifications"
              value={formData.specifications}
              onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
            />
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

  // Format existing items if in edit mode; filter out empty/unnamed placeholders
  const formatItems = (items?: any[]): z.infer<typeof itemSchema>[] => {
    if (!items || items.length === 0) return [];
    return items
      .filter((item: any) => item && typeof item === 'object' && String(item.name ?? '').trim() !== '')
      .map((item: any) => ({
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

  // Inherit department from user context in create mode
  useEffect(() => {
    if (!isEditMode && user?.departmentId) {
      form.setValue('departmentId', user.departmentId);
    }
  }, [isEditMode, user?.departmentId, form]);

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
        form.reset({
          name: '',
          description: '',
          type: 'office_supplies',
          priority: 'medium',
          category: '',
          departmentId: user?.departmentId || '',
          requestDate: new Date().toISOString().split('T')[0],
          items: [],
          currency: 'NGN',
        });
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
    remove(index);
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
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left: Request Details + Classification */}
          <div className="lg:col-span-6 space-y-6">
        {/* Section 1: Request Details */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Request Details
            </CardTitle>
            <CardDescription>Core identity and context for your request</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="lg:col-span-2">
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
                  <FormItem className="w-full">
                    <FormLabel>Request Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
                  <FormItem className="w-full">
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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
          </CardContent>
        </Card>

        {/* Section 2: Classification */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Classification
            </CardTitle>
            <CardDescription>Organization and metadata for routing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="departmentId"
                render={({ field }) => {
                  const departmentName = departments.find((d: any) => d.id === field.value)?.name;
                  return (
                    <FormItem className="w-full">
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 py-1 text-sm text-muted-foreground">
                          {departmentName ?? (user?.departmentId ? 'Loading...' : 'No department assigned')}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NGN">NGN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Right: Line Items + Summary + Actions */}
          <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Section 3: Line Items */}
        <Card className="border shadow-sm lg:flex-1 flex flex-col min-h-0 lg:min-h-[320px]">
          <CardHeader className="pb-4 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Line Items
                </CardTitle>
                <CardDescription>Add items with quantities and unit prices</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-2 shrink-0">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center rounded-lg border-2 border-dashed border-muted bg-muted/30 flex-1">
                <Package className="h-10 w-10 text-muted-foreground mb-3 opacity-60" />
                <p className="text-sm font-medium text-muted-foreground mb-1">No items added</p>
                <p className="text-xs text-muted-foreground mb-4">Add at least one item to your request</p>
                <Button type="button" variant="secondary" size="sm" onClick={handleAddItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 min-h-0 divide-y divide-border border rounded-md">
                {fields.map((field, index) => {
                  const item = form.watch(`items.${index}`);
                  const itemTotal = (item?.quantity || 0) * (item?.unitPrice || 0);
                  return (
                    <div
                      key={field.id}
                      className="flex items-center gap-2 py-2 px-3 hover:bg-muted/50 transition-colors"
                    >
                      <span className="flex-1 min-w-0 truncate text-sm font-medium">
                        {item?.name || 'Unnamed Item'}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        {item?.quantity ?? '—'} × {formatCurrency(item?.unitPrice ?? 0)}
                      </span>
                      <span className="text-sm font-semibold text-primary shrink-0 tabular-nums w-20 text-right">
                        {formatCurrency(itemTotal)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(index)}
                        className="h-7 w-7 p-0 shrink-0"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(index)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Summary & Actions */}
        <Card className="border shadow-sm bg-gradient-to-br from-primary/5 to-primary/10 shrink-0">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">Total Items</p>
                  <p className="text-xl font-bold text-foreground">{fields.length}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-0.5">Total Amount</p>
                  <p className="text-xl font-bold text-primary">
                    ₦{totalAmount.toLocaleString('en-NG')}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={createRequest.isPending || updateRequest.isPending}
                  className="gap-2 flex-1"
                >
                  {createRequest.isPending || updateRequest.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {createRequest.isPending || updateRequest.isPending
                    ? isEditMode ? 'Updating...' : 'Creating...'
                    : isEditMode ? 'Update Request' : 'Create Request'}
                </Button>
                <Button type="button" variant="outline" onClick={() => onSuccess?.()} className="gap-2 flex-1">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
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
