'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { mockProjects } from '../../super-admin/mockdata';
import { mockDepartments, mockEmployees } from '../../super-admin/mockdata';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const router = useRouter();
  
  // Find the project
  const project = mockProjects.find(p => p.id === projectId);
  
  if (!project) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
        <Button onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  // Find related data
  const department = mockDepartments.find(d => d.id === project.departmentId);
  const manager = mockEmployees.find(e => e.id === project.managerId);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">Project Code: {project.code}</p>
        </div>
        <Button onClick={() => router.back()}>Back to Projects</Button>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Status</span>
                <Badge>{project.status}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Priority</span>
                <Badge variant={
                  project.priority === 'high' ? 'destructive' :
                  project.priority === 'medium' ? 'default' :
                  'secondary'
                }>{project.priority}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <Progress value={project.progress} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project References</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Department:</span>
                <p>{department?.name} (ID: {project.departmentId})</p>
              </div>
              <div>
                <span className="text-muted-foreground">Project Manager:</span>
                <p>{manager?.firstName} {manager?.lastName} (ID: {project.managerId})</p>
              </div>
              <div>
                <span className="text-muted-foreground">Client:</span>
                <p>{project.clientName || 'N/A'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-muted-foreground">Total Budget:</span>
                <p className="text-xl font-bold">${project.budget.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Spent:</span>
                <p className="text-xl font-bold">${project.spent.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>Budget Utilization</span>
                  <span>{((project.spent / project.budget) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(project.spent / project.budget) * 100} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Milestones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.milestones.map(milestone => (
                <TableRow key={milestone.id}>
                  <TableCell className="font-mono">{milestone.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{milestone.name}</p>
                      <p className="text-sm text-muted-foreground">{milestone.description}</p>
                    </div>
                  </TableCell>
                  <TableCell>{milestone.dueDate}</TableCell>
                  <TableCell>
                    <Badge>{milestone.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>{milestone.progress}%</span>
                      </div>
                      <Progress value={milestone.progress} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell>${milestone.budget?.toLocaleString() || 'N/A'}</TableCell>
                  <TableCell>${milestone.spent?.toLocaleString() || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Milestone</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.tasks.map(task => {
                const milestone = project.milestones.find(m => m.id === task.milestoneId);
                const assignee = mockEmployees.find(e => e.id === task.assigneeId);
                
                return (
                  <TableRow key={task.id}>
                    <TableCell className="font-mono">{task.id}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{task.name}</p>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {milestone ? (
                        <div className="text-sm">
                          <p>{milestone.name}</p>
                          <p className="text-muted-foreground">ID: {task.milestoneId}</p>
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {assignee ? (
                        <div className="text-sm">
                          <p>{assignee.firstName} {assignee.lastName}</p>
                          <p className="text-muted-foreground">ID: {task.assigneeId}</p>
                        </div>
                      ) : 'Unassigned'}
                    </TableCell>
                    <TableCell>
                      <Badge>{task.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        task.priority === 'high' ? 'destructive' :
                        task.priority === 'medium' ? 'default' :
                        'secondary'
                      }>{task.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      {task.estimatedHours ? (
                        <div className="text-sm">
                          <p>Est: {task.estimatedHours}h</p>
                          {task.actualHours && <p>Actual: {task.actualHours}h</p>}
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectDetails; 