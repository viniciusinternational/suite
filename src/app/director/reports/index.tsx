'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ReportsManagement = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Department Reports</h1>
      <Card>
        <CardHeader><CardTitle>Performance Reports</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Department-specific performance reports</p></CardContent>
      </Card>
    </div>
  );
};

export default ReportsManagement; 