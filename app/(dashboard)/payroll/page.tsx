'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { usePayrolls } from '@/hooks/use-payrolls';
import { hasPermission } from '@/lib/permissions';
import { PayrollTable } from '@/components/payroll/payroll-table';
import { DeductionTable } from '@/components/payroll/deduction-table';
import { AllowanceTable } from '@/components/payroll/allowance-table';
import { PayrollTrackingView } from '@/components/payroll/payroll-tracking-view';

export default function PayrollPage() {
  const { user } = useAuthGuard(['view_payroll']);
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('payrolls');

  // Handle tab query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['payrolls', 'deductions', 'allowances', 'tracking'].includes(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const { data: payrolls = [], isLoading } = usePayrolls();

  const canAddPayroll = user && hasPermission(user, 'add_payroll');

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payroll</h1>
          <p className="text-gray-600 mt-1">Manage employee payroll, deductions, and allowances</p>
        </div>
        {canAddPayroll && activeTab === 'payrolls' && (
          <Button onClick={() => router.push('/payroll/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Payroll
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          // Update URL without reload
          const url = new URL(window.location.href);
          url.searchParams.set('tab', value);
          window.history.replaceState({}, '', url.toString());
        }}
        className="space-y-4"
      >
        <TabsList>
          <TabsTrigger value="payrolls">Payrolls</TabsTrigger>
          <TabsTrigger value="deductions">Deductions</TabsTrigger>
          <TabsTrigger value="allowances">Allowances</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="payrolls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Records</CardTitle>
              <CardDescription>View and manage monthly payroll records</CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollTable
                payrolls={payrolls}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Deductions</CardTitle>
                  <CardDescription>Manage payroll deduction rules</CardDescription>
                </div>
                {canAddPayroll && (
                  <Button onClick={() => router.push('/payroll/deductions/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Deduction
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <DeductionTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allowances" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Allowances</CardTitle>
                  <CardDescription>Manage payroll allowance rules</CardDescription>
                </div>
                {canAddPayroll && (
                  <Button onClick={() => router.push('/payroll/allowances/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Allowance
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <AllowanceTable />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tracking</CardTitle>
              <CardDescription>View deduction and allowance application history</CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollTrackingView />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

