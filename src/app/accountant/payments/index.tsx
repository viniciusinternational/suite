'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const GeneratePayments = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Generate Payments</h1>
        <p className="text-muted-foreground">
          Create payment records directly from approved request forms
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Generation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Payment generation tools coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneratePayments; 