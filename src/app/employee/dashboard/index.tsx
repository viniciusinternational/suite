'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const EmployeeDashboard = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader><CardTitle>My Tasks</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p><p className="text-muted-foreground">Pending tasks</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p><p className="text-muted-foreground">Active projects</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Leave Balance</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p><p className="text-muted-foreground">Days remaining</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">0</p><p className="text-muted-foreground">Unread</p></CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard; 