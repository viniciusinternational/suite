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
import { useAccounts } from "@/hooks/use-accounts";
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
    payerAccountId: z.string().min(1, "Payer account is required"),
    currency: z.string().min(1),
    method: z.enum(paymentMethodValues),
    status: z.enum(paymentStatusValues),
    paymentDate: z.string().optional(),
    dueDate: z.string().optional(),
    scheduledFor: z.string().optional(),
    payeeFullName: z.string().optional(),
    payeePhone: z.string().optional(),
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
      requiresApproval: true,
      payerAccountId: "",
      payeeFullName: "",
      payeePhone: "",
    },
  });

  const createPayment = useCreatePayment();
  const { data: projects = [] } = useProjects();
  const { data: requestForms = [] } = useRequests({ status: "approved" });
  const { data: payrolls = [] } = usePayrolls();
  const { data: accounts = [] } = useAccounts({ isActive: true });

  const [items, setItems] = useState<PaymentLineItem[]>([]);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const sourceType = form.watch("sourceType");
  const currency = form.watch("currency");
  const payerAccountId = form.watch("payerAccountId");
  const selectedAccount = accounts.find((a) => a.id === payerAccountId);

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

      if (values.status === "paid" && selectedAccount && !selectedAccount.allowNegativeBalance) {
        if (selectedAccount.balance < totals.total) {
          setFormError(`Insufficient account balance. Available: ${selectedAccount.currency} ${selectedAccount.balance.toFixed(2)}`);
          return;
        }
      }

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
        payerAccountId: values.payerAccountId,
        currency: values.currency,
        method: values.method,
        status: values.status,
        paymentDate: values.paymentDate || undefined,
        dueDate: values.dueDate || undefined,
        scheduledFor: values.scheduledFor || undefined,
        notes: values.notes || undefined,
        reference: values.reference || undefined,
        requiresApproval: values.requiresApproval ?? true,
        payeeFullName: values.payeeFullName || undefined,
        payeePhone: values.payeePhone || undefined,
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
                    <SelectTrigger className="w-full">
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
                    <SelectTrigger className="w-full">
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
                    <SelectTrigger className="w-full">
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
                  {/* Section 1 — Source & account */}
                  <div className="space-y-4" role="group" aria-labelledby="section-source-heading">
                    <div>
                      <h2 id="section-source-heading" className="text-sm font-medium text-foreground">
                        Source & account
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Where the payment comes from and which account pays.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="sourceType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Source Type</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full">
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
                      {renderSourceFields()}
                      <FormField
                        control={form.control}
                        name="payerAccountId"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-2">
                            <FormLabel>Payer Account *</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select account" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {accounts.map((acc) => (
                                  <SelectItem key={acc.id} value={acc.id}>
                                    {acc.name} ({acc.code}) - {acc.currency} {acc.balance.toFixed(2)}
                                  </SelectItem>
                                ))}
                                {accounts.length === 0 && (
                                  <SelectItem value="_none" disabled>
                                    No active accounts. Create an account first.
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {selectedAccount && (
                              <p className="text-xs text-muted-foreground">
                                Balance: {selectedAccount.currency} {selectedAccount.balance.toFixed(2)}
                                {selectedAccount.allowNegativeBalance && " (negative balance allowed)"}
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Section 2 — Payment basics */}
                  <div className="space-y-4" role="group" aria-labelledby="section-basics-heading">
                    <div>
                      <h2 id="section-basics-heading" className="text-sm font-medium text-foreground">
                        Payment basics
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Currency, method, status, and payee details.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        name="method"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full">
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
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full">
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
                        name="payeeFullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payee full name</FormLabel>
                            <FormControl>
                              <Input placeholder="Full name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="payeePhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payee phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Section 3 — Dates */}
                  <div className="space-y-4" role="group" aria-labelledby="section-dates-heading">
                    <div>
                      <h2 id="section-dates-heading" className="text-sm font-medium text-foreground">
                        Dates
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Payment, due, and scheduled dates.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                  </div>

                  <Separator />

                  {/* Section 4 — Reference & approval */}
                  <div className="space-y-4" role="group" aria-labelledby="section-reference-heading">
                    <div>
                      <h2 id="section-reference-heading" className="text-sm font-medium text-foreground">
                        Reference & approval
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Optional reference and approval workflow.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                            <FormLabel>Requires approval</FormLabel>
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
                  </div>

                  <Separator />

                  {/* Section 5 — Notes */}
                  <div className="space-y-4" role="group" aria-labelledby="section-notes-heading">
                    <div>
                      <h2 id="section-notes-heading" className="text-sm font-medium text-foreground">
                        Notes
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Additional context for this payment.
                      </p>
                    </div>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea rows={4} placeholder="Additional context for this payment" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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


