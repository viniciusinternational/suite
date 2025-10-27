'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Payment, RequestForm } from '@/types';
import {
  mockMDDashboardStats,
  mockPaymentMonitoring,
  mockProjectedExpenditure,
  mockProjectMonitoring,
  mockRevenueStats,
  mockIncomeExpenseComparison
} from '../mockdata';
import { PaymentActionModal } from '@/components/ui/payment-action-modal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell
} from 'recharts';

const FinancialsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  // Calculate total payments and amounts
  const totalPayments = Object.values(mockPaymentMonitoring).reduce(
    (acc, curr) => acc + curr.count,
    0
  );
  const totalAmount = Object.values(mockPaymentMonitoring).reduce(
    (acc, curr) => acc + curr.totalAmount,
    0
  );

  const handlePaymentAction = (action: 'approve' | 'reject', comments: string) => {
    if (!selectedPayment) return;
    
    // Here you would typically make an API call to update the payment status
    console.log('Payment action:', {
      paymentId: selectedPayment.id,
      action,
      comments
    });

    // For now, just log the action
    alert(`Payment ${selectedPayment.id} ${action}ed with comments: ${comments}`);
  };

  const getRandomColor = () => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Financial Overview</h1>
        <Input
          placeholder="Search payments..."
          className="max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${mockRevenueStats.totalRevenue.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              YTD Growth: {mockRevenueStats.yearToDateGrowth}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(mockRevenueStats.totalRevenue - mockMDDashboardStats.financialStats.totalSpent).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Profit Margin: {((mockRevenueStats.totalRevenue - mockMDDashboardStats.financialStats.totalSpent) / mockRevenueStats.totalRevenue * 100).toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mockMDDashboardStats.financialStats.totalBudget.toLocaleString()}
            </div>
            <Progress
              value={(mockMDDashboardStats.financialStats.totalSpent / mockMDDashboardStats.financialStats.totalBudget) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mockMDDashboardStats.financialStats.totalSpent.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              vs ${mockMDDashboardStats.financialStats.previousMonthSpent.toLocaleString()} last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenditure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mockMDDashboardStats.financialStats.currentMonthSpent.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              vs ${mockMDDashboardStats.financialStats.previousMonthSpent.toLocaleString()} last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mockMDDashboardStats.financialStats.upcomingPayments.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">
              Due in next 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="payments">Payment Monitoring</TabsTrigger>
          <TabsTrigger value="projects">Project Financials</TabsTrigger>
          <TabsTrigger value="projections">Financial Projections</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Income vs Expenditure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockIncomeExpenseComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="#22c55e" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Analysis Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Project</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockRevenueStats.revenueByProject}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {mockRevenueStats.revenueByProject.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getRandomColor()} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Client</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockRevenueStats.revenueByClient}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {mockRevenueStats.revenueByClient.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={getRandomColor()} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mockRevenueStats.revenueTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#22c55e" name="Revenue" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Expenses" />
                    <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Object.entries(mockPaymentMonitoring).map(([status, data]) => (
                  <div key={status} className="p-4 rounded-lg bg-muted">
                    <div className="font-medium capitalize">{status}</div>
                    <div className="text-2xl font-bold mt-1">
                      ${data.totalAmount.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {data.count} payments
                    </div>
                  </div>
                ))}
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Request Forms</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(mockPaymentMonitoring)
                    .flatMap(([status, data]) => 
                      data.payments.map((payment: Payment) => ({
                        ...payment,
                        status: status as Payment['status']
                      }))
                    )
                    .filter(payment =>
                      payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (payment.vendorId?.toLowerCase() || '').includes(searchTerm.toLowerCase())
                    )
                    .map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">{payment.id}</TableCell>
                        <TableCell>{payment.date}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {payment.requestForms?.map((form: RequestForm) => (
                              <div key={form.id} className="text-sm">
                                <Badge variant="outline" className="mr-2">
                                  {form.id}
                                </Badge>
                                {form.name}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>{payment.vendorId || 'N/A'}</TableCell>
                        <TableCell>${payment.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge>{payment.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/managing-director/payment/${payment.id}`)}
                            >
                              View
                            </Button>
                            {payment.status === 'pending' && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setIsModalOpen(true);
                                }}
                              >
                                Take Action
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Financial Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Projected Spend</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockProjectMonitoring
                    .filter(project =>
                      project.name.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>${project.budget.toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>${project.spent.toLocaleString()}</div>
                            <Progress
                              value={(project.spent / project.budget) * 100}
                              className="h-2"
                            />
                          </div>
                        </TableCell>
                        <TableCell>${project.projectedSpend.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              (project.spent / project.budget) > 0.9 ? 'bg-red-500' :
                              (project.spent / project.budget) > 0.7 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }
                          >
                            {(project.spent / project.budget) > 0.9 ? 'Critical' :
                             (project.spent / project.budget) > 0.7 ? 'Warning' :
                             'Healthy'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projections Tab */}
        <TabsContent value="projections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Projections - {mockProjectedExpenditure.month}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-muted">
                  <div className="font-medium">Total Projected</div>
                  <div className="text-2xl font-bold mt-1">
                    ${mockProjectedExpenditure.total.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="font-medium">Salaries</div>
                  <div className="text-2xl font-bold mt-1">
                    ${mockProjectedExpenditure.salaries.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="font-medium">Procurement</div>
                  <div className="text-2xl font-bold mt-1">
                    ${mockProjectedExpenditure.procurement.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <div className="font-medium">Operational</div>
                  <div className="text-2xl font-bold mt-1">
                    ${mockProjectedExpenditure.operational.toLocaleString()}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Project-wise Expenditure</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Projected Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockProjectedExpenditure.projects.map(project => (
                      <TableRow key={project.projectId}>
                        <TableCell className="font-medium">{project.projectName}</TableCell>
                        <TableCell>{project.category}</TableCell>
                        <TableCell>${project.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <PaymentActionModal
        payment={selectedPayment}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedPayment(null);
        }}
        onAction={handlePaymentAction}
      />
    </div>
  );
};

export default FinancialsPage; 