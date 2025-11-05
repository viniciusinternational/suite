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
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push('/requests')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
      </div>

      {/* Form */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Create New Request</h1>
          <p className="text-muted-foreground mt-1">Fill in the details below to create a new request</p>
        </div>
        <RequestForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}

