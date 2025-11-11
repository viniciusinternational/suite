"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useProjects } from "@/hooks/use-projects";
import { useRequests } from "@/hooks/use-requests";
import { usePayrolls } from "@/hooks/use-payrolls";
import { useUsers } from "@/hooks/use-users";
import { useCreatePayment } from "@/hooks/use-payments";
import {
  paymentMethodValues,
  paymentSourceValues,
  paymentStatusValues,
} from "@/constants/payments";
import { PaymentItemModal, type PaymentItemFormValues } from "./payment-item-modal";

const paymentSchema = z
  .object({
    sourceType: z.enum(paymentSourceValues),
    projectId: z.string().optional(),
    requestFormId: z.string().optional(),
    payrollId: z.string().optional(),
    currency: z.string().min(1),
    method: z.enum(paymentMethodValues),
    status: z.enum(paymentStatusValues),
    paymentDate: z.string().optional(),
    dueDate: z.string().optional(),
    scheduledFor: z.string().optional(),
    payeeId: z.string().optional(),
    requiresApproval: z.boolean().optional(),
    notes: z.string().optional(),
    reference: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceType === "project" && !data.projectId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["projectId"],
        message: "Project is required when the source is a project.",
      });
    }

    if (data.sourceType === "requestForm" && !data.requestFormId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["requestFormId"],
        message: "Request form is required when using a request-form source.",
      });
    }

    if (data.sourceType === "payroll" && !data.payrollId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["payrollId"],
        message: "Payroll is required when the source is payroll.",
      });
    }
  });

type PaymentCreateFormValues = z.infer<typeof paymentSchema>;

export type PaymentLineItem = PaymentItemFormValues & { id: string };

type PaymentCreateFormProps = {
  onCancel: () => void;
  onSuccess?: () => void;
};

export function PaymentCreateForm({ onCancel, onSuccess }: PaymentCreateFormProps) {
  const form = useForm<PaymentCreateFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      sourceType: "none",
      currency: "NGN",
      method: "bank_transfer",
      status: "draft",
      requiresApproval: false,
    },
  });

  const createPayment = useCreatePayment();
  const { data: projects = [] } = useProjects();
  const { data: requestForms = [] } = useRequests({ status: "approved" });
  const { data: payrolls = [] } = usePayrolls();
  const { data: users = [] } = useUsers({ status: "active" });

  const [items, setItems] = useState<PaymentLineItem[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const sourceType = form.watch("sourceType");
  const currency = form.watch("currency");

  const totals = useMemo(() => {
    const summary = items.reduce(
      (acc, item) => {
        const lineSubtotal = item.quantity * item.unitPrice;
        const rate = item.taxRate ?? 0;
        const tax = rate > 1 ? lineSubtotal * (rate / 100) : lineSubtotal * rate;
        acc.subtotal += lineSubtotal;
        acc.tax += tax;
        acc.total += lineSubtotal + tax;
        return acc;
      },
      { subtotal: 0, tax: 0, total: 0 }
    );

    return {
      subtotal: Number(summary.subtotal.toFixed(2)),
      tax: Number(summary.tax.toFixed(2)),
      total: Number(summary.total.toFixed(2)),
    };
  }, [items]);

  const handleOpenItemModal = useCallback((index: number | null = null) => {
    setEditingIndex(index);
    setItemModalOpen(true);
  }, []);

  const handleCloseItemModal = useCallback((open: boolean) => {
    setItemModalOpen(open);
    if (!open) {
      setEditingIndex(null);
    }
  }, []);

  const handleSubmitItem = useCallback(
    (values: PaymentItemFormValues) => {
      setItems(current => {
        if (editingIndex !== null) {
          const next = [...current];
          next[editingIndex] = { ...values, id: next[editingIndex].id };
          return next;
        }

        return [
          ...current,
          {
            ...values,
            id: crypto.randomUUID(),
          },
        ];
      });
    },
    [editingIndex]
  );

  const handleRemoveItem = useCallback((id: string) => {
    setItems(current => current.filter(item => item.id !== id));
  }, []);

  const handleSubmit = async (values: PaymentCreateFormValues) => {
    try {
      setFormError(null);

      const payloadItems =
        values.sourceType === "requestForm"
          ? undefined
          : items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              taxRate: item.taxRate,
            }));

      if (values.sourceType !== "requestForm" && payloadItems?.length === 0) {
        setFormError("Add at least one line item or choose a request form source.");
        return;
      }

      await createPayment.mutateAsync({
        source: {
          type: values.sourceType,
          projectId: values.sourceType === "project" ? values.projectId : undefined,
          requestFormId: values.sourceType === "requestForm" ? values.requestFormId : undefined,
          payrollId: values.sourceType === "payroll" ? values.payrollId : undefined,
        },
        currency: values.currency,
        method: values.method,
        status: values.status,
        paymentDate: values.paymentDate || undefined,
        dueDate: values.dueDate || undefined,
        scheduledFor: values.scheduledFor || undefined,
        notes: values.notes || undefined,
        reference: values.reference || undefined,
        requiresApproval: values.requiresApproval ?? false,
        payeeId: values.payeeId || undefined,
        amount: values.sourceType === "requestForm" ? undefined : totals.subtotal,
        taxAmount: values.sourceType === "requestForm" ? undefined : totals.tax,
        totalAmount: values.sourceType === "requestForm" ? undefined : totals.total,
        items: payloadItems,
      });

      onSuccess?.();
    } catch (error) {
      console.error("Failed to create payment", error);
      setFormError(error instanceof Error ? error.message : "Unable to create payment.");
    }
  };

  const isSubmitting = createPayment.isPending || form.formState.isSubmitting;

  const renderSourceFields = () => {
    switch (sourceType) {
      case "project":
        return (
          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project</FormLabel>
                <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "requestForm":
        return (
          <FormField
            control={form.control}
            name="requestFormId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Request Form</FormLabel>
                <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a request form" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {requestForms.map(request => (
                      <SelectItem key={request.id} value={request.id}>
                        {request.name} ({request.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      case "payroll":
        return (
          <FormField
            control={form.control}
            name="payrollId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payroll</FormLabel>
                <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payroll" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {payrolls.map(payroll => (
                      <SelectItem key={payroll.id} value={payroll.id}>
                        {`${payroll.periodMonth}/${payroll.periodYear}`} ({payroll.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      default:
        return null;
    }
  };

  const currentItem = editingIndex !== null ? items[editingIndex] : undefined;

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Create Payment</h1>
            <p className="text-muted-foreground">
              Configure payment metadata, associate it with related entities, and manage line items using modals.
            </p>
          </div>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Payment Details</CardTitle>
                  <CardDescription>
                    Set up payment source, lifecycle status, and descriptive notes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="sourceType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Source Type</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select source" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentSourceValues.map(option => (
                                <SelectItem key={option} value={option}>
                                  {option === "requestForm"
                                    ? "Request Form"
                                    : option === "none"
                                    ? "Standalone"
                                    : option.charAt(0).toUpperCase() + option.slice(1)}
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
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <FormControl>
                            <Input placeholder="Currency (e.g. NGN, USD)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Choose status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentStatusValues.map(option => (
                                <SelectItem key={option} value={option}>
                                  {option.replace(/_/g, " ")}
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
                      name="method"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Method</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {paymentMethodValues.map(option => (
                                <SelectItem key={option} value={option}>
                                  {option.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Date</FormLabel>
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

                    <FormField
                      control={form.control}
                      name="scheduledFor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scheduled For</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {renderSourceFields()}

                    <FormField
                      control={form.control}
                      name="payeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payee</FormLabel>
                          <Select value={field.value ?? undefined} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select payee" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users.map(user => (
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

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="reference"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reference</FormLabel>
                          <FormControl>
                            <Input placeholder="Reference or memo" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="requiresApproval"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Approval Required</FormLabel>
                          <div className="flex items-center justify-between rounded-md border bg-muted/30 px-4 py-2">
                            <span className="text-sm text-muted-foreground">
                              Route payment through the approval workflow.
                            </span>
                            <Switch checked={field.value ?? false} onCheckedChange={field.onChange} />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea rows={4} placeholder="Additional context for this payment" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Line Items</CardTitle>
                  <CardDescription>
                    Use the modal workflow to add or edit payment lines. Request-form payments inherit items automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sourceType === "requestForm" ? (
                    <div className="rounded-md border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
                      Items will be cloned from the selected request form after submission.
                    </div>
                  ) : (
                    <>
                      <Button type="button" size="sm" onClick={() => handleOpenItemModal()}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                      </Button>

                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Qty</TableHead>
                              <TableHead className="text-right">Unit Price</TableHead>
                              <TableHead className="text-right">Tax Rate</TableHead>
                              <TableHead className="text-right">Line Total</TableHead>
                              <TableHead className="w-[60px]" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                                  No items yet. Add a line to calculate totals.
                                </TableCell>
                              </TableRow>
                            ) : (
                              items.map((item, index) => {
                                const subtotal = item.quantity * item.unitPrice;
                                const rate = item.taxRate ?? 0;
                                const tax = rate > 1 ? subtotal * (rate / 100) : subtotal * rate;
                                const total = subtotal + tax;

                                return (
                                  <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.description}</TableCell>
                                    <TableCell className="text-right">{item.quantity}</TableCell>
                                    <TableCell className="text-right">
                                      {currency} {item.unitPrice.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {item.taxRate != null ? `${item.taxRate}%` : "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {currency} {total.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex justify-end gap-2">
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleOpenItemModal(index)}
                                        >
                                          <span className="sr-only">Edit</span>
                                          ✎
                                        </Button>
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          onClick={() => handleRemoveItem(item.id)}
                                        >
                                          <span className="sr-only">Remove</span>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span className="font-medium">
                            {currency} {totals.subtotal.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Tax</span>
                          <span className="font-medium">
                            {currency} {totals.tax.toFixed(2)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total</span>
                          <span className="text-lg font-semibold">
                            {currency} {totals.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {formError && (
              <div className="rounded-md border border-destructive/60 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving
                  </span>
                ) : (
                  "Create Payment"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <PaymentItemModal
        open={itemModalOpen && sourceType !== "requestForm"}
        onOpenChange={handleCloseItemModal}
        onSubmit={handleSubmitItem}
        initialValues={currentItem ?? undefined}
      />
    </div>
  );
}


