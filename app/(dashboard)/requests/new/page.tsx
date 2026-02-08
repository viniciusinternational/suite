'use client';

import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Button } from '@/components/ui/button';
import { RequestForm } from '@/components/request/request-form';
import { ArrowLeft } from 'lucide-react';

export default function CreateRequestPage() {
  useAuthGuard(['add_requests']);
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/requests');
  };

  return (
    <div className="space-y-6 p-6 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/requests')} className="-ml-2 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Requests
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Request</h1>
            <p className="text-sm text-muted-foreground mt-1">Fill in the details below to create a new request</p>
          </div>
        </div>

        {/* Form */}
        <RequestForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

