'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const FinancialReports = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-muted-foreground">
          Generate balance sheets, income statements, and custom financial reports
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Financial reporting tools coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReports; 