'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RequestsPage() {
  useAuthGuard(['view_requests']);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Requests</h1>
        <p className="text-gray-600 mt-1">Manage request forms</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Requests Module</CardTitle>
          <CardDescription>Request forms management coming soon</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">This module is being migrated from role-based routes.</p>
        </CardContent>
      </Card>
    </div>
  );
}

