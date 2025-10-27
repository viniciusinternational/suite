'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, TrendingUp, TrendingDown, Calendar, DollarSign, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import { mockHistoricalFinancialData, mockFiscalYearSummary, type HistoricalFinancialData, type FiscalYearSummary, type MonthlyExpenditure } from '../historical-data';

const HistoryManagement = () => {
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary');

  // Helper functions
  const getRandomColor = () => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'active': '#22c55e',
      'completed': '#3b82f6',
      'on_hold': '#f59e0b',
      'cancelled': '#ef4444',
      'planning': '#8b5cf6'
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    // Export functionality would be implemented here
    console.log(`Exporting data in ${format} format for year ${selectedYear}`);
  };

  // Get available years from historical data
  const availableYears = useMemo(() => {
    return Array.from(new Set(mockHistoricalFinancialData.map(item => item.fiscalYear)))
      .sort((a, b) => b - a);
  }, []);

  // Filter data based on selected criteria
  const filteredData = useMemo(() => {
    let data = mockHistoricalFinancialData.filter(item => 
      item.fiscalYear.toString() === selectedYear
    );

    if (selectedQuarter !== 'all') {
      const quarterMonths = {
        'Q1': [1, 2, 3],
        'Q2': [4, 5, 6],
        'Q3': [7, 8, 9],
        'Q4': [10, 11, 12]
      };
      data = data.filter(item => 
        quarterMonths[selectedQuarter as keyof typeof quarterMonths]?.includes(item.month)
      );
    }

    if (selectedDepartment !== 'all') {
      data = data.filter(item => 
        item.departmentExpenses.some(dept => dept.departmentId === selectedDepartment)
      );
    }

    return data;
  }, [selectedYear, selectedQuarter, selectedDepartment]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalBudget = filteredData.reduce((sum, item) => sum + item.totalBudget, 0);
    const totalSpent = filteredData.reduce((sum, item) => sum + item.totalSpent, 0);
    const totalProjectBudget = filteredData.reduce((sum, item) => sum + item.projects.reduce((pSum, p) => pSum + p.budget, 0), 0);
    const totalProjectSpent = filteredData.reduce((sum, item) => sum + item.projects.reduce((pSum, p) => pSum + p.spent, 0), 0);
    
    return {
      totalBudget,
      totalSpent,
      totalProjectBudget,
      totalProjectSpent,
      variance: totalBudget - totalSpent,
      utilizationRate: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      projectUtilization: totalProjectBudget > 0 ? (totalProjectSpent / totalProjectBudget) * 100 : 0
    };
  }, [filteredData]);

  // Prepare chart data
  const monthlyChartData = useMemo(() => {
    return filteredData.map(item => ({
      month: `${item.fiscalYear}-${String(item.month).padStart(2, '0')}`,
      budget: item.totalBudget,
      spent: item.totalSpent,
      variance: item.totalBudget - item.totalSpent,
      projects: item.projects.length
    }));
  }, [filteredData]);

  // Department expenditure data for pie chart
  const departmentData = useMemo(() => {
    const deptMap = new Map();
    filteredData.forEach(item => {
      item.departmentExpenses.forEach(dept => {
        const existing = deptMap.get(dept.departmentName) || 0;
        deptMap.set(dept.departmentName, existing + dept.totalSpent);
      });
    });
    
    return Array.from(deptMap.entries()).map(([name, value]) => ({
      name,
      value,
      color: getRandomColor()
    }));
  }, [filteredData]);

  // Project status distribution
  const projectStatusData = useMemo(() => {
    const statusMap = new Map();
    filteredData.forEach(item => {
      item.projects.forEach(project => {
        const existing = statusMap.get(project.status) || 0;
        statusMap.set(project.status, existing + 1);
      });
    });
    
    return Array.from(statusMap.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: getStatusColor(name)
    }));
  }, [filteredData]);



  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial History</h1>
          <p className="text-gray-600 mt-2">
            Consolidated view of project budgets and expenses across fiscal years
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleExport('csv')} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => handleExport('pdf')} variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filters & View Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Fiscal Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      FY {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Quarter</label>
              <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select quarter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Quarters</SelectItem>
                  <SelectItem value="Q1">Q1 (Jan-Mar)</SelectItem>
                  <SelectItem value="Q2">Q2 (Apr-Jun)</SelectItem>
                  <SelectItem value="Q3">Q3 (Jul-Sep)</SelectItem>
                  <SelectItem value="Q4">Q4 (Oct-Dec)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="ENG">Engineering</SelectItem>
                  <SelectItem value="ADM">Administration</SelectItem>
                  <SelectItem value="FIN">Finance</SelectItem>
                  <SelectItem value="HR">Human Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(value: 'summary' | 'detailed') => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary View</SelectItem>
                  <SelectItem value="detailed">Detailed View</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">
              For selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalSpent)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress value={summaryStats.utilizationRate} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {summaryStats.utilizationRate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
            {summaryStats.variance >= 0 ? 
              <TrendingUp className="h-4 w-4 text-green-600" /> : 
              <TrendingDown className="h-4 w-4 text-red-600" />
            }
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summaryStats.variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summaryStats.variance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {summaryStats.variance >= 0 ? 'Under budget' : 'Over budget'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Project Utilization</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryStats.projectUtilization.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Project budget utilization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data Visualization */}
      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Budget Trends</TabsTrigger>
          <TabsTrigger value="departments">Department Analysis</TabsTrigger>
          <TabsTrigger value="projects">Project Status</TabsTrigger>
          <TabsTrigger value="details">Detailed View</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Budget vs Actual Spending</CardTitle>
              <CardDescription>
                Track budget allocation against actual expenditure over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="budget" fill="#3b82f6" name="Budget" />
                  <Bar dataKey="spent" fill="#ef4444" name="Actual Spent" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Expenditure Distribution</CardTitle>
                <CardDescription>
                  Spending breakdown by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [formatCurrency(value), 'Spent']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>
                  Budget utilization by department
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departmentData.map((dept, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{dept.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {formatCurrency(dept.value)}
                        </span>
                      </div>
                      <Progress 
                        value={(dept.value / Math.max(...departmentData.map(d => d.value))) * 100} 
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Project Status Distribution</CardTitle>
                <CardDescription>
                  Current status of all projects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={projectStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Budget Variance</CardTitle>
                <CardDescription>
                  Budget vs actual spending by project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredData.slice(0, 1).map(monthData => 
                    monthData.projects.slice(0, 5).map((project, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{project.name}</span>
                          <Badge variant={project.budget - project.spent >= 0 ? "default" : "destructive"}>
                            {formatCurrency(project.budget - project.spent)}
                          </Badge>
                        </div>
                        <div className="flex gap-2 text-sm text-muted-foreground">
                          <span>Budget: {formatCurrency(project.budget)}</span>
                          <span>•</span>
                          <span>Spent: {formatCurrency(project.spent)}</span>
                        </div>
                        <Progress 
                          value={(project.spent / project.budget) * 100} 
                          className="h-2"
                        />
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Financial Breakdown</CardTitle>
              <CardDescription>
                Comprehensive view of all financial activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Spent</TableHead>
                    <TableHead>Variance</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => {
                    const variance = item.totalBudget - item.totalSpent;
                    const utilization = (item.totalSpent / item.totalBudget) * 100;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {new Date(item.fiscalYear, item.month - 1).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short' 
                          })}
                        </TableCell>
                        <TableCell>{formatCurrency(item.totalBudget)}</TableCell>
                        <TableCell>{formatCurrency(item.totalSpent)}</TableCell>
                        <TableCell className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(variance)}
                        </TableCell>
                        <TableCell>{item.projects.length}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={utilization} className="w-16 h-2" />
                            <span className="text-sm">{utilization.toFixed(1)}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={utilization > 100 ? "destructive" : utilization > 90 ? "secondary" : "default"}>
                            {utilization > 100 ? 'Over Budget' : utilization > 90 ? 'Near Limit' : 'On Track'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoryManagement; 