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
import { Button } from '@/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  Users,
  Briefcase,
  Clock,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign
} from 'lucide-react';

const DashboardPage = () => {
  // Mock data - In production, this would come from your API
  const departmentStats = {
    totalEmployees: 45,
    activeProjects: 8,
    pendingApprovals: 12,
    budgetUtilization: 68,
    projectProgress: 75,
    teamUtilization: 82,
    pendingTasks: 24,
    completedTasks: 156
  };

  const projectPerformance = [
    { month: 'Jan', planned: 85, actual: 78 },
    { month: 'Feb', planned: 87, actual: 80 },
    { month: 'Mar', planned: 89, actual: 85 },
    { month: 'Apr', planned: 92, actual: 88 },
    { month: 'May', planned: 94, actual: 90 },
    { month: 'Jun', planned: 96, actual: 92 }
  ];

  const budgetTrends = [
    { month: 'Jan', allocated: 100000, spent: 85000 },
    { month: 'Feb', allocated: 120000, spent: 95000 },
    { month: 'Mar', allocated: 110000, spent: 88000 },
    { month: 'Apr', allocated: 130000, spent: 115000 },
    { month: 'May', allocated: 125000, spent: 105000 },
    { month: 'Jun', allocated: 140000, spent: 120000 }
  ];

  const recentApprovals = [
    { id: 'REQ-001', type: 'Leave Request', employee: 'John Doe', status: 'pending' },
    { id: 'REQ-002', type: 'Procurement', project: 'Project Alpha', status: 'pending' },
    { id: 'REQ-003', type: 'Budget Increase', project: 'Project Beta', status: 'pending' }
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Department Dashboard</h1>
          <p className="text-muted-foreground">Engineering Department Overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{departmentStats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span>Team Utilization</span>
                <span className="font-medium">{departmentStats.teamUtilization}%</span>
              </div>
              <Progress value={departmentStats.teamUtilization} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{departmentStats.activeProjects}</p>
              </div>
              <Briefcase className="h-8 w-8 text-green-500" />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span className="font-medium">{departmentStats.projectProgress}%</span>
              </div>
              <Progress value={departmentStats.projectProgress} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold">{departmentStats.pendingApprovals}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm">
                <AlertCircle className="h-4 w-4 mr-2 text-orange-500" />
                <span>Requires your attention</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Budget Utilization</p>
                <p className="text-2xl font-bold">{departmentStats.budgetUtilization}%</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </div>
            <div className="mt-4">
              <Progress value={departmentStats.budgetUtilization} className="mt-2" />
              <p className="text-sm text-muted-foreground mt-2">
                Of total allocated budget
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Project Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={projectPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="planned" 
                    stroke="#8884d8" 
                    name="Planned Progress"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#82ca9d" 
                    name="Actual Progress"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Budget Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="allocated" fill="#8884d8" name="Allocated Budget" />
                  <Bar dataKey="spent" fill="#82ca9d" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Approvals */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Request ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Requestor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentApprovals.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.id}</TableCell>
                  <TableCell>{request.type}</TableCell>
                  <TableCell>{request.employee || request.project}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      Pending
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm">Review</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Task Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span>Completed Tasks</span>
                </div>
                <span className="font-bold">{departmentStats.completedTasks}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-500 mr-2" />
                  <span>Pending Tasks</span>
                </div>
                <span className="font-bold">{departmentStats.pendingTasks}</span>
              </div>
              <Progress 
                value={(departmentStats.completedTasks / (departmentStats.completedTasks + departmentStats.pendingTasks)) * 100} 
                className="mt-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                <Users className="h-6 w-6 mb-2" />
                Manage Team
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                <FileText className="h-6 w-6 mb-2" />
                View Reports
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                <Briefcase className="h-6 w-6 mb-2" />
                Project Status
              </Button>
              <Button variant="outline" className="h-24 flex flex-col items-center justify-center">
                <DollarSign className="h-6 w-6 mb-2" />
                Budget Review
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage; 