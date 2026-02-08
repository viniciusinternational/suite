'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { AccountTransaction } from '@/types';

interface AccountTransactionsTableProps {
  transactions: AccountTransaction[];
  isLoading?: boolean;
  currency?: string;
  formatCurrency?: (amount: number, currency: string) => string;
  formatDate?: (date: string) => string;
}

const typeLabels: Record<string, string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  payment: 'Payment',
};

export function AccountTransactionsTable({
  transactions,
  isLoading,
  currency = 'NGN',
  formatCurrency = (amount, curr) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr || 'NGN',
      minimumFractionDigits: 2,
    }).format(amount),
  formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
}: AccountTransactionsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-32" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Reference</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No transactions yet
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => {
              const isCredit = tx.amount > 0;
              return (
                <TableRow key={tx.id}>
                  <TableCell>{formatDate(tx.createdAt)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        isCredit ? 'default' : 'secondary'
                      }
                    >
                      {typeLabels[tx.type] ?? tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {tx.description ?? (tx.payment ? `Payment #${tx.payment.id?.slice(-6)}` : '—')}
                  </TableCell>
                  <TableCell
                    className={`text-right font-medium ${
                      isCredit ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isCredit ? '+' : ''}
                    {formatCurrency(tx.amount, tx.currency || currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {tx.reference ?? '—'}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
