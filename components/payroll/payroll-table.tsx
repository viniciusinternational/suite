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
import type { Payroll } from '@/types';

interface PayrollTableProps {
  payrolls: Payroll[];
  isLoading?: boolean;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const statusColors = {
  draft: 'bg-gray-100 text-gray-700',
  pending_dept_head: 'bg-yellow-100 text-yellow-700',
  pending_admin_head: 'bg-orange-100 text-orange-700',
  pending_accountant: 'bg-purple-100 text-purple-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  processed: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
};

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending_dept_head: 'Pending Dept Head',
  pending_admin_head: 'Pending Admin Head',
  pending_accountant: 'Pending Accountant',
  approved: 'Approved',
  rejected: 'Rejected',
  processed: 'Processed',
  paid: 'Paid',
};

export function PayrollTable({ payrolls, isLoading = false }: PayrollTableProps) {
  const router = useRouter();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colorClass = statusColors[status as keyof typeof statusColors] || statusColors.draft;
    const label = statusLabels[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
    return (
      <Badge className={colorClass} variant="outline">
        {label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Period</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Employees</TableHead>
              <TableHead className="text-right">Total Amount</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-auto" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse ml-auto" />
                </TableCell>
                <TableCell>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (payrolls.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-gray-500">
        No payrolls found. Create your first payroll to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Period</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Employees</TableHead>
            <TableHead className="text-right">Total Amount</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payrolls.map((payroll) => {
            const totalAmount = (payroll.entries || []).reduce(
              (sum, entry) => sum + entry.netSalary,
              0
            );
            const employeeCount = payroll.entries?.length || 0;
            const periodLabel = `${monthNames[payroll.periodMonth - 1]} ${payroll.periodYear}`;

            return (
              <TableRow
                key={payroll.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => router.push(`/payroll/${payroll.id}`)}
              >
                <TableCell className="font-medium">{periodLabel}</TableCell>
                <TableCell>{getStatusBadge(payroll.status)}</TableCell>
                <TableCell className="text-right">{employeeCount}</TableCell>
                <TableCell className="text-right font-semibold">
                  {formatCurrency(totalAmount)}
                </TableCell>
                <TableCell className="text-gray-600">
                  {new Date(payroll.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
