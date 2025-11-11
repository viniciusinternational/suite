'use client';

import { useRouter } from 'next/navigation';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { PaymentCreateForm } from '@/components/payment/payment-create-form';

export default function NewPaymentPage() {
  useAuthGuard(['add_payments', 'edit_payments']);
  const router = useRouter();
  return (
    <PaymentCreateForm
      onCancel={() => router.push('/payments')}
      onSuccess={() => router.push('/payments')}
    />
  );
}


