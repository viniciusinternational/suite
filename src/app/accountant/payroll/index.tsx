'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PayrollManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
        <p className="text-muted-foreground">
          Process, review, and approve payslip runs
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payroll Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Payroll management interface coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollManagement; 