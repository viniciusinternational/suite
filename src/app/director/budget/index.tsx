'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileText,
  Download,
  BarChart2,
  PieChart as PieChartIcon
} from 'lucide-react';

const BudgetPage = () => {
  // Mock data - In production, this would come from your API
  const budgetStats = {
    totalBudget: 5000000,
    spent: 3250000,
    committed: 750000,
    remaining: 1000000,
    projectedOverrun: 250000,
    utilizationRate: 65
  };

  const monthlySpending = [
    { month: 'Jan', planned: 400000, actual: 380000 },
    { month: 'Feb', planned: 450000, actual: 420000 },
    { month: 'Mar', planned: 500000, actual: 550000 },
    { month: 'Apr', planned: 550000, actual: 580000 },
    { month: 'May', planned: 600000, actual: 620000 },
    { month: 'Jun', planned: 650000, actual: 700000 }
  ];

  const categoryBreakdown = [
    { name: 'Labor', value: 1500000 },
    { name: 'Materials', value: 1000000 },
    { name: 'Equipment', value: 500000 },
    { name: 'Subcontractors', value: 250000 }
  ];

  const projectBudgets = [
    {
      id: 'PRJ001',
      name: 'Office Complex Development',
      budget: 2500000,
      spent: 1625000,
      committed: 375000,
      remaining: 500000,
      status: 'on_track'
    },
    {
      id: 'PRJ002',
      name: 'Residential Tower Construction',
      budget: 1800000,
      spent: 1200000,
      committed: 300000,
      remaining: 300000,
      status: 'at_risk'
    },
    {
      id: 'PRJ003',
      name: 'Highway Bridge Repair',
      budget: 700000,
      spent: 425000,
      committed: 75000,
      remaining: 200000,
      status: 'over_budget'
    }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      on_track: 'bg-green-100 text-green-800 border-green-200',
      at_risk: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      over_budget: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Department Budget</h1>
          <p className="text-muted-foreground">Financial overview and budget management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Budget Request
          </Button>
        </div>
      </div>

      {/* Budget Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(budgetStats.totalBudget)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span>Utilization</span>
                <span className="font-medium">{budgetStats.utilizationRate}%</span>
              </div>
              <Progress value={budgetStats.utilizationRate} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Spent + Committed</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(budgetStats.spent + budgetStats.committed)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <span>Spent: {formatCurrency(budgetStats.spent)}</span>
                <span className="mx-2">•</span>
                <span>Committed: {formatCurrency(budgetStats.committed)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Remaining Budget</p>
                <p className="text-2xl font-bold">{formatCurrency(budgetStats.remaining)}</p>
              </div>
              <BarChart2 className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <Progress 
                value={(budgetStats.remaining / budgetStats.totalBudget) * 100} 
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Projected Overrun</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(budgetStats.projectedOverrun)}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm text-red-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>5.2% over budget</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Spending Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlySpending}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="planned" 
                    stroke="#8884d8" 
                    name="Planned"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#82ca9d" 
                    name="Actual"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Budget Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Breakdown by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Project Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Total Budget</TableHead>
                <TableHead>Spent</TableHead>
                <TableHead>Committed</TableHead>
                <TableHead>Remaining</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectBudgets.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>{formatCurrency(project.budget)}</TableCell>
                  <TableCell>{formatCurrency(project.spent)}</TableCell>
                  <TableCell>{formatCurrency(project.committed)}</TableCell>
                  <TableCell>{formatCurrency(project.remaining)}</TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {Math.round((project.spent / project.budget) * 100)}%
                        </span>
                      </div>
                      <Progress value={(project.spent / project.budget) * 100} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusBadge(project.status)}>
                      {project.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetPage; 