'use client';

import { useRouter } from 'next/navigation';
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
import type { Account } from '@/types';

interface AccountTableProps {
  accounts: Account[];
  formatCurrency?: (amount: number, currency: string) => string;
  isLoading?: boolean;
}

export function AccountTable({
  accounts,
  formatCurrency = (amount, currency) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 2,
    }).format(amount),
  isLoading = false,
}: AccountTableProps) {
  const router = useRouter();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Currency</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell><Skeleton className="h-5 w-32" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              <TableCell><Skeleton className="h-5 w-12" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
              <TableCell><Skeleton className="h-5 w-14" /></TableCell>
            </TableRow>
          ))
        ) : accounts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              No accounts found
            </TableCell>
          </TableRow>
        ) : (
          accounts.map((account) => (
            <TableRow
              key={account.id}
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => router.push(`/accounts/${account.id}`)}
            >
              <TableCell>
                <div>
                  <p className="font-medium">{account.name}</p>
                  {account.description && (
                    <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                      {account.description}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell>{account.code}</TableCell>
              <TableCell>{account.currency}</TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(account.balance, account.currency)}
              </TableCell>
              <TableCell>
                <Badge variant={account.isActive ? 'default' : 'secondary'}>
                  {account.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
