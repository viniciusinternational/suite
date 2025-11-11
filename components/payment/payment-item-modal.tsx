'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const paymentItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().nonnegative('Quantity must be 0 or greater'),
  unitPrice: z.coerce.number().nonnegative('Unit price must be 0 or greater'),
  taxRate: z.coerce.number().nonnegative('Tax rate must be 0 or greater').optional(),
});

export type PaymentItemFormValues = z.infer<typeof paymentItemSchema>;

type PaymentItemModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: PaymentItemFormValues) => void;
  initialValues?: PaymentItemFormValues;
};

export function PaymentItemModal({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
}: PaymentItemModalProps) {
  const form = useForm<PaymentItemFormValues>({
    resolver: zodResolver(paymentItemSchema),
    defaultValues: {
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.reset(initialValues);
      } else {
        form.reset({ description: '', quantity: 1, unitPrice: 0, taxRate: undefined });
      }
    }
  }, [open, initialValues, form]);

  const handleSubmit = (values: PaymentItemFormValues) => {
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Item' : 'Add Item'}</DialogTitle>
          <DialogDescription>
            Provide item details. Amounts are calculated using quantity, unit price, and tax rate.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Describe the payment item" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit Price</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">{initialValues ? 'Save Item' : 'Add Item'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


