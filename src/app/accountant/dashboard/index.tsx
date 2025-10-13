'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AccountantDashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Accounting Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of financial transactions, pending payments, and revenue
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Accounting dashboard with financial metrics coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountantDashboard; 