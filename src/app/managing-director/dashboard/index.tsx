'use client';

import React from 'react';
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
import { 
  mockMDDashboardStats, 
  mockProjectMonitoring,
  mockPaymentMonitoring,
  mockProjectedExpenditure,
  mockSalaryDistribution 
} from '../mockdata';

const DashboardPage = () => {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Executive Dashboard</h1>
      
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMDDashboardStats.projectStats.total}</div>
            <div className="text-xs text-muted-foreground">
              Active: {mockMDDashboardStats.projectStats.active} | 
              Completed: {mockMDDashboardStats.projectStats.completed}
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
            <div className="text-xs text-muted-foreground">
              Spent: ${mockMDDashboardStats.financialStats.totalSpent.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMDDashboardStats.totalEmployees}</div>
            <div className="text-xs text-muted-foreground">
              Total Salaries: ${mockMDDashboardStats.totalSalaries.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMDDashboardStats.approvalStats.pendingPayments + 
              mockMDDashboardStats.approvalStats.pendingRequests}</div>
            <div className="text-xs text-muted-foreground">
              Payments: {mockMDDashboardStats.approvalStats.pendingPayments} | 
              Requests: {mockMDDashboardStats.approvalStats.pendingRequests}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Projects Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial Insights</TabsTrigger>
          <TabsTrigger value="workforce">Workforce & Salaries</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Month</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {mockProjectMonitoring.map(project => (
              <Card key={project.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <div className="flex justify-between items-center">
                    <Badge>{project.status}</Badge>
                    <span className="text-sm">Progress: {project.progress}%</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={project.progress} />
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-medium">${project.budget.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spent</p>
                        <p className="font-medium">${project.spent.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm font-medium">Milestones</p>
                      <div className="text-xs grid grid-cols-4 gap-1">
                        <div>Completed: {project.milestones.completed}</div>
                        <div>In Progress: {project.milestones.inProgress}</div>
                        <div>Pending: {project.milestones.pending}</div>
                        <div>Delayed: {project.milestones.delayed}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Financial Insights Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(mockPaymentMonitoring).map(([key, data]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium capitalize">{key}</TableCell>
                      <TableCell>{data.count}</TableCell>
                      <TableCell>${data.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workforce & Salaries Tab */}
        <TabsContent value="workforce" className="space-y-4">
          {mockSalaryDistribution.map(dept => (
            <Card key={dept.departmentId}>
              <CardHeader>
                <CardTitle>{dept.departmentName} Department</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Employees</p>
                      <p className="text-lg font-bold">{dept.employeeCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Salary</p>
                      <p className="text-lg font-bold">${dept.totalSalary.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Average Salary</p>
                      <p className="text-lg font-bold">${dept.averageSalary.toLocaleString()}</p>
                    </div>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Salary Range</TableHead>
                        <TableHead>Employee Count</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dept.salaryRanges.map(range => (
                        <TableRow key={range.range}>
                          <TableCell>{range.range}</TableCell>
                          <TableCell>{range.count}</TableCell>
                          <TableCell>${range.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Upcoming Month Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projected Expenditure - {mockProjectedExpenditure.month}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Projected</p>
                    <p className="text-lg font-bold">
                      ${mockProjectedExpenditure.total.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Salaries</p>
                    <p className="text-lg font-bold">
                      ${mockProjectedExpenditure.salaries.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Procurement</p>
                    <p className="text-lg font-bold">
                      ${mockProjectedExpenditure.procurement.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Operational</p>
                    <p className="text-lg font-bold">
                      ${mockProjectedExpenditure.operational.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Project-wise Breakdown</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Project</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockProjectedExpenditure.projects.map(project => (
                        <TableRow key={project.projectId}>
                          <TableCell>{project.projectName}</TableCell>
                          <TableCell>{project.category}</TableCell>
                          <TableCell>${project.amount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage; 