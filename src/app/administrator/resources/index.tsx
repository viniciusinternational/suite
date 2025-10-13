'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SharedResources = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Shared Resources</h1>
        <p className="text-muted-foreground">
          Manage company-wide shared resources like vehicles and equipment
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Shared resources management coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharedResources; 