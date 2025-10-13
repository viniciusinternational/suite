'use client';

import React, { useState } from 'react';
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
import { mockProjectMonitoring, mockMDDashboardStats } from '../mockdata';
import { useRouter } from 'next/navigation';

const PerformanceOverview = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredProjects = mockProjectMonitoring.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Performance Overview</h1>
        <Input
          placeholder="Search projects..."
          className="max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Overall Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Project Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((mockMDDashboardStats.projectStats.completed / mockMDDashboardStats.projectStats.total) * 100)}%
            </div>
            <Progress 
              value={(mockMDDashboardStats.projectStats.completed / mockMDDashboardStats.projectStats.total) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMDDashboardStats.projectStats.active}</div>
            <div className="text-xs text-muted-foreground">
              Out of {mockMDDashboardStats.projectStats.total} total projects
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Delayed Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {mockMDDashboardStats.projectStats.delayed}
            </div>
            <div className="text-xs text-muted-foreground">
              Requiring immediate attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Hold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">
              {mockMDDashboardStats.projectStats.onHold}
            </div>
            <div className="text-xs text-muted-foreground">
              Temporarily suspended
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Project Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Project Performance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Milestones</TableHead>
                <TableHead>Tasks</TableHead>
                <TableHead>Budget Utilization</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map(project => (
                <TableRow key={project.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/managing-director/project/${project.id}`)}
                >
                  <TableCell className="font-medium">{project.name}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{project.progress}%</div>
                      <Progress value={project.progress} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Total: {project.milestones.total}</div>
                      <div className="text-green-500">Completed: {project.milestones.completed}</div>
                      <div className="text-yellow-500">In Progress: {project.milestones.inProgress}</div>
                      <div className="text-red-500">Delayed: {project.milestones.delayed}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Total: {project.tasks.total}</div>
                      <div className="text-green-500">Completed: {project.tasks.completed}</div>
                      <div className="text-yellow-500">In Progress: {project.tasks.inProgress}</div>
                      <div className="text-red-500">Overdue: {project.tasks.overdue}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        ${project.spent.toLocaleString()} / ${project.budget.toLocaleString()}
                      </div>
                      <Progress 
                        value={(project.spent / project.budget) * 100} 
                        className="h-2"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        project.status === 'active' ? 'bg-green-500' :
                        project.status === 'delayed' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }
                    >
                      {project.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Updates */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Project Updates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredProjects.flatMap(project =>
              project.recentUpdates.map((update, index) => (
                <div key={`${project.id}-${index}`} className="flex items-start space-x-4 p-2 rounded-lg bg-muted/50">
                  <div className="flex-1">
                    <div className="font-medium">{project.name}</div>
                    <div className="text-sm text-muted-foreground">{update.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">{update.date}</div>
                  </div>
                  <Badge>{update.type}</Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceOverview; 