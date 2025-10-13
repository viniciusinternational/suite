'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ApprovalsManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
        <p className="text-muted-foreground">
          Second-level approval for request forms after Department Head approval
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Approval workflow interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalsManagement; 