'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { AccountForm } from '@/components/account/account-form';
import { useCreateAccount } from '@/hooks/use-accounts';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function NewAccountPage() {
  useAuthGuard(['create_accounts']);
  const router = useRouter();
  const createAccount = useCreateAccount();

  const handleSubmit = async (values: {
    name: string;
    code: string;
    currency: string;
    description?: string;
    allowNegativeBalance: boolean;
  }) => {
    await createAccount.mutateAsync(values);
    router.push('/accounts');
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/accounts')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Create Account</h1>
            <p className="text-muted-foreground">Add a new account with basic details</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Enter account name, code, currency, and optionally allow negative balance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountForm
              onSubmit={handleSubmit}
              onCancel={() => router.push('/accounts')}
              isSubmitting={createAccount.isPending}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
