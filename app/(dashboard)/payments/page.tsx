'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { usePayments } from '@/hooks/use-payments';
import { paymentSourceValues, paymentStatusValues } from '@/constants/payments';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import type { Payment } from '@/types';
import { hasAnyPermission } from '@/lib/permissions';

const statusColorMap: Record<Payment['status'], string> = {
  draft: 'bg-muted text-foreground',
  scheduled: 'bg-blue-500/10 text-blue-700 dark:text-blue-300',
  partially_paid: 'bg-amber-500/10 text-amber-700 dark:text-amber-300',
  paid: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
  voided: 'bg-destructive/10 text-destructive',
};

function formatCurrency(amount: number, currency: string) {
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

export default function PaymentsPage() {
  const { user } = useAuthGuard(['view_payments']);
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<'all' | Payment['status']>('all');
  const [selectedSource, setSelectedSource] = useState<'all' | Payment['source']['type']>('all');

  const filters = useMemo(
    () => ({
      status: selectedStatus === 'all' ? undefined : selectedStatus,
      sourceType: selectedSource === 'all' ? undefined : selectedSource,
    }),
    [selectedStatus, selectedSource]
  );

  const {
    data: payments = [],
    isLoading,
    isFetching,
  } = usePayments(filters);

  const canCreatePayments = hasAnyPermission(user, ['add_payments', 'edit_payments']);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Payments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track outgoing payments across projects, request forms, payroll, or standalone entries.
          </p>
        </div>
        <Button
          onClick={() => router.push('/payments/new')}
          disabled={!canCreatePayments}
        >
          New Payment
        </Button>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Payment Activity</CardTitle>
              <CardDescription>
                {isFetching ? 'Refreshing payments...' : `${payments.length} payments found`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <Select
                value={selectedStatus}
                onValueChange={value =>
                  setSelectedStatus(value as 'all' | Payment['status'])
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {paymentStatusValues.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSource}
                onValueChange={value =>
                  setSelectedSource(value as 'all' | Payment['source']['type'])
                }
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {paymentSourceValues.map(source => (
                    <SelectItem key={source} value={source}>
                      {source === 'requestForm'
                        ? 'Request Form'
                        : source === 'none'
                        ? 'Standalone'
                        : source.charAt(0).toUpperCase() + source.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-muted-foreground">
              No payments match the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payee</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map(payment => (
                    <TableRow
                      key={payment.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/payments/${payment.id}`)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {payment.reference || '—'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {payment.items.length} item{payment.items.length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col text-sm">
                          <span className="font-medium">
                            {payment.source.type === 'project' && payment.project
                              ? payment.project.name
                              : payment.source.type === 'requestForm' && payment.requestForm
                              ? payment.requestForm.name
                              : payment.source.type === 'payroll' && payment.payroll
                              ? `Payroll ${payment.payroll.periodMonth}/${payment.payroll.periodYear}`
                              : 'Standalone'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {payment.source.type === 'project'
                              ? 'Project'
                              : payment.source.type === 'requestForm'
                              ? 'Request Form'
                              : payment.source.type === 'payroll'
                              ? 'Payroll'
                              : 'No Source'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {formatCurrency(payment.totalAmount, payment.currency)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Subtotal: {formatCurrency(payment.amount, payment.currency)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColorMap[payment.status] ?? ''}>
                          {payment.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.payee ? payment.payee.fullName : '—'}
                      </TableCell>
                      <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

