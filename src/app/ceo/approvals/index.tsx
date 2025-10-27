'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils";
import { CalendarIcon } from "@radix-ui/react-icons";
import type { Payment, Project } from '@/types';
import { mockPaymentMonitoring, mockMDDashboardStats, mockPendingProjects } from '../mockdata';

const ApprovalsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });
  const router = useRouter();

  // Get pending payments with date filter
  const pendingPayments = mockPaymentMonitoring.pending.payments.filter(payment => {
    const matchesSearch = payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.vendorId?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;

    // Apply date range filter if dates are selected
    if (dateRange.from && dateRange.to) {
      const paymentDate = new Date(payment.date);
      return paymentDate >= dateRange.from && paymentDate <= dateRange.to;
    }

    return true;
  });

  const handleProjectApproval = (projectId: string) => {
    console.log(`Approving project with ID: ${projectId}`);
    // In a real application, you would update the project status in your data source
    // For now, we'll just simulate an approval
    const updatedProjects = mockPendingProjects.map(project =>
      project.id === projectId ? { ...project, approvalStatus: 'approved' as const } : project
    );
    // Assuming mockPendingProjects is a state or prop, update it here
    // setMockPendingProjects(updatedProjects); 
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="text-3xl font-bold">Approvals & Decisions</h1>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !dateRange.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} -{" "}
                      {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range) => setDateRange({
                  from: range?.from,
                  to: range?.to,
                })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Input
            placeholder="Search approvals..."
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Approval Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMDDashboardStats.approvalStats.pendingProjects}
            </div>
            <div className="text-xs text-muted-foreground">
              New project approvals
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMDDashboardStats.approvalStats.pendingPayments}
            </div>
            <div className="text-xs text-muted-foreground">
              Total value: ${mockPaymentMonitoring.pending.totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMDDashboardStats.approvalStats.pendingRequests}
            </div>
            <div className="text-xs text-muted-foreground">
              Requiring your attention
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Procurements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMDDashboardStats.approvalStats.pendingProcurements}
            </div>
            <div className="text-xs text-muted-foreground">
              High-value purchases
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockMDDashboardStats.approvalStats.pendingLeaves}
            </div>
            <div className="text-xs text-muted-foreground">
              Leave requests
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Project Approvals</TabsTrigger>
          <TabsTrigger value="payments">Payment Approvals</TabsTrigger>
          <TabsTrigger value="requests">Request Forms</TabsTrigger>
          <TabsTrigger value="procurements">Procurements</TabsTrigger>
          <TabsTrigger value="leaves">Leave Requests</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Project Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Timeline</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPendingProjects.map(project => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.name}</div>
                          <div className="text-sm text-muted-foreground">{project.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{project.departmentName}</TableCell>
                      <TableCell>${project.budget.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(project.startDate), "MMM d, yyyy")}</div>
                          <div>{format(new Date(project.endDate), "MMM d, yyyy")}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Pending Approval</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/managing-director/project-details/${project.id}`)}
                          >
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleProjectApproval(project.id)}
                          >
                            Approve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payment Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Request Form</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map(payment => (
                    <TableRow key={payment.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/managing-director/payment/${payment.id}`)}
                    >
                      <TableCell className="font-medium">{payment.id}</TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>
                        {payment.requestForms?.map(form => (
                          <Badge key={form.id} variant="outline">
                            {form.id}
                          </Badge>
                        ))}
                      </TableCell>
                      <TableCell>{payment.vendorId}</TableCell>
                      <TableCell>${payment.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/managing-director/payment/${payment.id}`)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Request Forms</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                Request form approvals will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Procurements Tab */}
        <TabsContent value="procurements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Procurement Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                Procurement approvals will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves Tab */}
        <TabsContent value="leaves" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Leave Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center py-8">
                Leave request approvals will be implemented here
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ApprovalsPage; 