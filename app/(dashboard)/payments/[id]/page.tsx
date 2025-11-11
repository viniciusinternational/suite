'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { AxiosError } from 'axios';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { PaymentItemModal, type PaymentItemFormValues } from '@/components/payment/payment-item-modal';
import { PaymentApproval } from '@/components/payment/payment-approval';
import { usePayment } from '@/hooks/use-payments';

export default function PaymentDetailPage() {
  useAuthGuard(['view_payments']);
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PaymentItemFormValues | null>(null);

  const paymentId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  useEffect(() => {
    if (!paymentId) {
      router.replace('/payments');
    }
  }, [paymentId, router]);

  const {
    data: payment,
    isLoading,
    isError,
    error,
    refetch,
  } = usePayment(paymentId);

  useEffect(() => {
    if (isError) {
      const axiosError = error as AxiosError<{ error?: string }> | undefined;
      if (axiosError?.response?.status === 404) {
        router.replace('/payments');
      }
    }
  }, [isError, error, router]);

  const totals = useMemo(() => {
    if (!payment) {
      return { amount: 0, tax: 0, total: 0 };
    }

    const amount = payment.amount ?? 0;
    const tax = payment.taxAmount ?? 0;
    const total = payment.totalAmount ?? amount + tax;
    return { amount, tax, total };
  }, [payment]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payment Details</h1>
          <p className="text-muted-foreground">
            View the payment summary, source linkages, and associated line items.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/payments')}>
            Back to Payments
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              Detailed metadata will appear here once the backend integration is complete.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <SummaryField label="Payment ID" value={paymentId ?? '—'} loading={isLoading || !payment} />
              <SummaryField
                label="Source"
                value={payment ? payment.source.type : 'Loading...'}
                loading={isLoading || !payment}
              />
              <SummaryField
                label="Status"
                value={payment ? payment.status.replace(/_/g, ' ') : 'Loading...'}
                loading={isLoading || !payment}
              />
              <SummaryField
                label="Currency"
                value={payment ? payment.currency : 'Loading...'}
                loading={isLoading || !payment}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SummaryField
                label="Subtotal"
                value={payment ? `${payment.currency} ${totals.amount.toFixed(2)}` : '—'}
                loading={isLoading || !payment}
              />
              <SummaryField
                label="Tax"
                value={payment ? `${payment.currency} ${totals.tax.toFixed(2)}` : '—'}
                loading={isLoading || !payment}
              />
              <SummaryField
                label="Total"
                value={payment ? `${payment.currency} ${totals.total.toFixed(2)}` : '—'}
                loading={isLoading || !payment}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Source Links</CardTitle>
            <CardDescription>
              Related project, request form, or payroll references will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <PlaceholderLine loading={isLoading || !payment}>
              Project: {payment?.project ? payment.project.name : '—'}
            </PlaceholderLine>
            <PlaceholderLine loading={isLoading || !payment}>
              Request Form: {payment?.requestForm ? payment.requestForm.name : '—'}
            </PlaceholderLine>
            <PlaceholderLine loading={isLoading || !payment}>
              Payroll:{' '}
              {payment?.payroll
                ? `${payment.payroll.periodMonth}/${payment.payroll.periodYear} (${payment.payroll.status})`
                : '—'}
            </PlaceholderLine>
          </CardContent>
        </Card>
      </div>

      {isLoading || !payment ? (
        <Card>
          <CardHeader>
            <CardTitle>Approval Workflow</CardTitle>
            <CardDescription>Loading current approvals…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : (
        <PaymentApproval payment={payment} onApprovalChange={() => refetch()} />
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Manage payment line items using the modal workflow.</CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setSelectedItem(null);
              setItemModalOpen(true);
            }}
            disabled={!payment}
          >
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading || !payment ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-10 w-full" />
              ))}
            </div>
          ) : payment.items.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No items yet. Add one to begin tracking payment lines.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead className="text-right">Line Total</TableHead>
                    <TableHead className="w-[72px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payment.items.map(item => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {payment.currency} {item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.taxRate != null ? `${item.taxRate}%` : '—'}
                      </TableCell>
                      <TableCell className="text-right">{item.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedItem({
                              description: item.description,
                              quantity: item.quantity,
                              unitPrice: item.unitPrice,
                              taxRate: item.taxRate,
                            });
                            setItemModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <PaymentItemModal
        open={itemModalOpen}
        onOpenChange={open => {
          setItemModalOpen(open);
          if (!open) {
            setSelectedItem(null);
          }
        }}
        initialValues={selectedItem ?? undefined}
        onSubmit={() => {
          // Persisting edits will be wired in during the API integration step.
        }}
      />
    </div>
  );
}

type SummaryFieldProps = {
  label: string;
  value: string;
  loading?: boolean;
};

function SummaryField({ label, value, loading }: SummaryFieldProps) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/30 p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      {loading ? <Skeleton className="h-5 w-24" /> : <p className="text-sm font-medium">{value}</p>}
    </div>
  );
}

function PlaceholderLine({ children, loading }: { children: React.ReactNode; loading?: boolean }) {
  if (loading) {
    return <Skeleton className="h-4 w-40" />;
  }
  return <p>{children}</p>;
}


