'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const LeaveManagement = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Leave Requests</h1>
      <Card>
        <CardHeader><CardTitle>Leave Management</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Leave request form and history</p></CardContent>
      </Card>
    </div>
  );
};

export default LeaveManagement; 