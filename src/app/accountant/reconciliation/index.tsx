'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PaymentReconciliation = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Reconciliation</h1>
        <p className="text-muted-foreground">
          Track and reconcile all payment records against request forms
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Payment reconciliation tools coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentReconciliation; 