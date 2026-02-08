'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Wallet,
  Search,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { useAccounts } from '@/hooks/use-accounts';
import { AccountTable } from '@/components/account/account-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import type { Account } from '@/types';

export default function AccountsPage() {
  useAuthGuard(['view_accounts']);
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState<string>('true');

  const { data: accounts = [], isLoading } = useAccounts({
    search: searchTerm || undefined,
    isActive: isActiveFilter === 'all' ? undefined : isActiveFilter,
  });

  const formatCurrency = (amount: number, currency: string) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN',
      minimumFractionDigits: 2,
    }).format(amount);

  const stats = {
    total: accounts.length,
    active: accounts.filter((a) => a.isActive).length,
    totalBalance: accounts.reduce((sum: number, a: Account) => sum + a.balance, 0),
    avgBalance:
      accounts.length > 0
        ? accounts.reduce((sum: number, a: Account) => sum + a.balance, 0) / accounts.length
        : 0,
  };

  return (
    <div className="space-y-6 p-6 bg-muted/20 min-h-screen">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
          <p className="text-muted-foreground">Manage accounts, add funds, and transfer between accounts</p>
        </div>
        <Button onClick={() => router.push('/accounts/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Account
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Accounts</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Accounts</p>
                    <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Balance</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.totalBalance, 'NGN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Avg Balance</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.avgBalance, 'NGN')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account List</CardTitle>
          <CardDescription>View and manage all accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={isActiveFilter}
              onChange={(e) => setIsActiveFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </select>
          </div>
          <AccountTable
            accounts={accounts}
            formatCurrency={formatCurrency}
            isLoading={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
