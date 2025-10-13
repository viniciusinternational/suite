'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProcurementPayments = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Procurement Payments</h1>
        <p className="text-muted-foreground">
          Manage and process procurement request payments to vendors
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Procurement Payment Processing</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Procurement payment management coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProcurementPayments; 