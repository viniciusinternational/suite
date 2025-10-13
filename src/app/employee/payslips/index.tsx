'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const MyPayslips = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">My Payslips</h1>
      <Card>
        <CardHeader><CardTitle>Payslip History</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Payslip viewing and download</p></CardContent>
      </Card>
    </div>
  );
};

export default MyPayslips; 