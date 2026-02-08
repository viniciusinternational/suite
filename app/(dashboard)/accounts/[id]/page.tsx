'use client';

import { useParams, useRouter, notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wallet, Plus, ArrowRightLeft, TrendingUp, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useAccount, useAccounts, useAddFunds, useTransfer } from '@/hooks/use-accounts';
import { useAccountTransactions } from '@/hooks/use-account-transactions';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/axios';
import { AccountTransactionsTable } from '@/components/account/account-transactions-table';
import { AddFundsDialog } from '@/components/account/add-funds-dialog';
import { TransferDialog } from '@/components/account/transfer-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useState } from 'react';

export default function AccountDetailsPage() {
  useAuthGuard(['view_accounts']);
  const params = useParams();
  const router = useRouter();
  const accountId = params.id as string;

  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const { data: account, isLoading } = useAccount(accountId);
  const { data: accounts = [] } = useAccounts({ isActive: true });
  const { data: transactionsData, isLoading: transactionsLoading } =
    useAccountTransactions(accountId);
  const addFunds = useAddFunds(accountId);
  const transfer = useTransfer(accountId);

  const { data: analyticsData } = useQuery({
    queryKey: ['account', accountId, 'analytics'],
    queryFn: async () => {
      const response = await axios.get(`/accounts/${accountId}/analytics`);
      return response.data.data;
    },
    enabled: !!accountId,
  });

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);

  const handleAddFundsSuccess = async (
    amount: number,
    description?: string,
    reference?: string
  ) => {
    await addFunds.mutateAsync({ amount, description, reference });
  };

  const handleTransferSuccess = async (
    toAccountId: string,
    amount: number,
    description?: string,
    reference?: string
  ) => {
    await transfer.mutateAsync({ toAccountId, amount, description, reference });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 bg-muted/20 min-h-screen">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!account) {
    notFound();
  }

  return (
    <div className="space-y-6 p-6 bg-muted/20 min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/accounts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{account.name}</h1>
            <p className="text-muted-foreground">
              {account.code} • {account.currency}
            </p>
          </div>
          <Badge variant={account.isActive ? 'default' : 'secondary'}>
            {account.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setAddFundsOpen(true)} disabled={!account.isActive}>
            <Plus className="mr-2 h-4 w-4" />
            Add Funds
          </Button>
          <Button
            variant="outline"
            onClick={() => setTransferOpen(true)}
            disabled={!account.isActive}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Transfer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>All transactions and payments for this account</CardDescription>
            </CardHeader>
            <CardContent>
              <AccountTransactionsTable
                transactions={transactionsData?.data ?? []}
                isLoading={transactionsLoading}
                currency={account.currency}
                formatCurrency={formatCurrency}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {formatCurrency(account.balance, account.currency)}
              </p>
            </CardContent>
          </Card>

          {analyticsData && (
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Inflow and outflow summary</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                    Total Inflow
                  </span>
                  <span className="font-medium text-green-600">
                    +{formatCurrency(analyticsData.inflowTotal ?? 0, account.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                    Total Outflow
                  </span>
                  <span className="font-medium text-red-600">
                    -{formatCurrency(analyticsData.outflowTotal ?? 0, account.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Transaction Count</span>
                  <span className="font-medium">{analyticsData.transactionCount ?? 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payments (Paid)</span>
                  <span className="font-medium">{analyticsData.paymentCount ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AddFundsDialog
        account={account}
        open={addFundsOpen}
        onOpenChange={setAddFundsOpen}
        onSuccess={handleAddFundsSuccess}
      />
      <TransferDialog
        fromAccount={account}
        accounts={accounts}
        open={transferOpen}
        onOpenChange={setTransferOpen}
        onSuccess={handleTransferSuccess}
      />
    </div>
  );
}
