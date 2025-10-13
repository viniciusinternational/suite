'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AdministratorDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of system health, active users, and recent activities
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Administrative dashboard coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdministratorDashboard; 