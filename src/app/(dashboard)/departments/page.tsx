'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  UserCheck,
  Briefcase,
  FolderTree,
  CheckCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

// Import the reusable form components
import { DepartmentForm } from "@/components/department/department-form";
import { UnitForm } from "@/components/department/unit-form";

// Import types and axios client
import type { Department, DepartmentUnit, Sector } from "@/types";
import axiosClient from "@/lib/axios";

// Type definitions from form components
interface DepartmentFormData {
  name: string;
  code: string;
  sector: Sector;
  description: string;
  headId: string;
  isActive: boolean;
}

interface UnitFormData {
  name: string;
  departmentId: string;
  managerId: string;
  isActive: boolean;
}

export default function DepartmentsPage() {
  useAuthGuard(['view_departments']);
  const queryClient = useQueryClient();

  // Fetch departments
  const { data: departmentsResponse, isLoading, isFetching, error } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => {
      const response = await axiosClient.get<{ ok: boolean; data: Department[] }>('/departments');
      if (!response.data.ok) {
        throw new Error('Failed to fetch departments');
      }
      // Ensure we always return an array
      return Array.isArray(response.data.data) ? response.data.data : [];
    },
  });
  
  // Ensure departments is always an array
  const departments = Array.isArray(departmentsResponse) ? departmentsResponse : [];

  // Mock users for now - in a real app, this would come from an API
  const availableUsers: { id: string; fullName: string; role: string; isActive: boolean }[] = [
    { id: '1', fullName: 'John Smith', role: 'super_admin', isActive: true },
    { id: '2', fullName: 'Sarah Johnson', role: 'managing_director', isActive: true },
    { id: '3', fullName: 'Mike Wilson', role: 'department_head', isActive: true },
    { id: '4', fullName: 'Emily Chen', role: 'employee', isActive: true },
    { id: '5', fullName: 'David Brown', role: 'hr_manager', isActive: true },
    { id: '6', fullName: 'Lisa Garcia', role: 'accountant', isActive: true },
    { id: '7', fullName: 'Robert Taylor', role: 'administrator', isActive: true },
    { id: '8', fullName: 'Maria Rodriguez', role: 'employee', isActive: true }
  ];

  // Mutations
  const createDepartmentMutation = useMutation({
    mutationFn: async (data: DepartmentFormData) => {
      const response = await axiosClient.post<{ ok: boolean; data: Department }>('/departments', data);
      if (!response.data.ok) {
        throw new Error('Failed to create department');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const updateDepartmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DepartmentFormData }) => {
      const response = await axiosClient.put<{ ok: boolean; data: Department }>(`/departments/${id}`, data);
      if (!response.data.ok) {
        throw new Error('Failed to update department');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async (data: UnitFormData) => {
      const response = await axiosClient.post<{ ok: boolean; data: DepartmentUnit }>(`/departments/${data.departmentId}/units`, data);
      if (!response.data.ok) {
        throw new Error('Failed to create unit');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: async ({ departmentId, unitId }: { departmentId: string; unitId: string }) => {
      await axiosClient.delete(`/departments/${departmentId}/units/${unitId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const toggleDepartmentStatusMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await axiosClient.put<{ ok: boolean; data: Department }>(`/departments/${id}`, { isActive });
      if (!response.data.ok) {
        throw new Error('Failed to update department status');
      }
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  // ---- Local UI states ----
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state for new/edit department
  const [deptFormData, setDeptFormData] = useState<DepartmentFormData>({
    name: "",
    code: "",
    sector: "administration" as Sector,
    description: "",
    headId: "none",
    isActive: true,
  });

  // Form state for new unit
  const [unitFormData, setUnitFormData] = useState<UnitFormData>({
    name: "",
    departmentId: "",
    managerId: "none",
    isActive: true,
  });

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isMutating = createDepartmentMutation.isPending || 
    updateDepartmentMutation.isPending || 
    deleteDepartmentMutation.isPending ||
    createUnitMutation.isPending ||
    deleteUnitMutation.isPending ||
    toggleDepartmentStatusMutation.isPending;

  // ---- Helper functions ----
  const getSectorBadgeColor = (sector: Sector) => {
    const colors = {
      construction: "bg-orange-100 text-orange-800 border-orange-200",
      engineering: "bg-blue-100 text-blue-800 border-blue-200",
      legal: "bg-purple-100 text-purple-800 border-purple-200",
      administration: "bg-green-100 text-green-800 border-green-200",
      consulting: "bg-cyan-100 text-cyan-800 border-cyan-200",
      other: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[sector] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getDepartmentHead = (headId?: string) =>   
    availableUsers.find((user) => user.id === headId);

  // ---- Reset form functions ----
  const resetDeptForm = () => {
    setDeptFormData({
      name: "",
      code: "",
      sector: "administration" as Sector,
      description: "",
      headId: "none",
      isActive: true,
    });
  };

  const resetUnitForm = () => {
    setUnitFormData({
      name: "",
      departmentId: "",
      managerId: "none",
      isActive: true,
    });
  };

  // ---- Event handlers ----
  const handleAddDepartment = async () => {
    try {
      await createDepartmentMutation.mutateAsync(deptFormData);
      resetDeptForm();
      setIsAddDeptOpen(false);
      setSuccessMessage(`Department "${deptFormData.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error creating department:', error);
      // Error is already handled by the mutation's onError callback
    }
  };

  const handleEditDepartment = async () => {
    if (!selectedDepartment) return;
    try {
      await updateDepartmentMutation.mutateAsync({
        id: selectedDepartment.id,
        data: deptFormData,
      });
      resetDeptForm();
      setSelectedDepartment(null);
      setIsEditDeptOpen(false);
      setSuccessMessage(`Department "${deptFormData.name}" updated successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error updating department:', error);
      // Error is already handled by the mutation's onError callback
    }
  };

  const handleDeleteDepartment = async (deptId: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDepartmentMutation.mutateAsync(deptId);
      } catch (error: any) {
        console.error('Error deleting department:', error);
        // Error is already handled by the mutation's onError callback
      }
    }
  };

  const handleAddUnit = async () => {
    try {
      await createUnitMutation.mutateAsync(unitFormData);
      resetUnitForm();
      setIsAddUnitOpen(false);
      setSuccessMessage(`Unit "${unitFormData.name}" created successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: any) {
      console.error('Error creating unit:', error);
      // Error is already handled by the mutation's onError callback
    }
  };

  const handleDeleteUnit = async (deptId: string, unitId: string) => {
    if (confirm('Are you sure you want to delete this unit?')) {
      try {
        await deleteUnitMutation.mutateAsync({ departmentId: deptId, unitId });
      } catch (error: any) {
        console.error('Error deleting unit:', error);
        // Error is already handled by the mutation's onError callback
      }
    }
  };

  const handleToggleDepartmentStatus = async (department: Department) => {
    try {
      await toggleDepartmentStatusMutation.mutateAsync({
        id: department.id,
        isActive: !department.isActive,
      });
    } catch (error: any) {
      console.error('Error toggling department status:', error);
      // Error is already handled by the mutation's onError callback
    }
  };

  const openEditDialog = (department: Department) => {
    setSelectedDepartment(department);
    setDeptFormData({
      name: department.name,
      code: department.code,
      sector: department.sector,
      description: department.description || "",
      headId: department.headId || "none",
      isActive: department.isActive,
    });
    setIsEditDeptOpen(true);
  };

  // ---- Cancel handlers for forms ----
  const handleDeptCancel = () => {
    resetDeptForm();
    setIsAddDeptOpen(false);
  };

  const handleEditDeptCancel = () => {
    resetDeptForm();
    setSelectedDepartment(null);
    setIsEditDeptOpen(false);
  };

  const handleUnitCancel = () => {
    resetUnitForm();
    setIsAddUnitOpen(false);
  };

  if (error) {
    return <div className="p-6 text-red-600">Error loading departments: {error.message}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Success Notification */}
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="bg-green-50 border-green-200 text-green-800 shadow-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Department Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage organizational structure and departments
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isAddUnitOpen} onOpenChange={setIsAddUnitOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={resetUnitForm} disabled={isMutating}>
                <FolderTree className="h-4 w-4 mr-2" />
                Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Unit</DialogTitle>
                <DialogDescription>
                  Create a new unit within a department.
                </DialogDescription>
              </DialogHeader>
              <UnitForm
                unitFormData={unitFormData}
                setUnitFormData={setUnitFormData}
                departments={departments}
                availableUsers={availableUsers}
                onCancel={handleUnitCancel}
                onSubmit={handleAddUnit}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetDeptForm} disabled={isMutating}>
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Department</DialogTitle>
                <DialogDescription>
                  Create a new department with organizational details.
                </DialogDescription>
              </DialogHeader>
              <DepartmentForm
                deptFormData={deptFormData}
                setDeptFormData={setDeptFormData}
                availableUsers={availableUsers}
                onCancel={handleDeptCancel}
                onSubmit={handleAddDepartment}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Departments
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {departments.length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Departments
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {departments.filter((d) => d.isActive).length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Units</p>
                <p className="text-2xl font-bold text-purple-600">
                  {departments.reduce(
                    (sum, dept) => sum + dept.units.length,
                    0
                  )}
                </p>
              </div>
              <FolderTree className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Department Heads
                </p>
                <p className="text-2xl font-bold text-orange-600">
                  {departments.filter((d) => d.headId).length}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Directory */}
      <Card>
        <CardHeader>
          <CardTitle>Department Directory</CardTitle>
          <CardDescription>
            Organizational structure and department units
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  disabled={isMutating}
                />
              </div>
            </div>
          </div>

          {/* Loading state for refetching */}
          {isFetching && !isLoading && (
            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Refreshing departments...</span>
            </div>
          )}

          {/* Loading state for mutations */}
          {isMutating && (
            <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Processing...</span>
            </div>
          )}

          {/* Department grid with loading state */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-12" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-16" />
                      <div className="flex gap-1">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Skeleton className="h-5 w-10" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDepartments.map((department) => (
                <Card key={department.id} className="hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col space-y-1">
                          <h3 className="text-lg font-semibold text-foreground truncate">
                            {department.name}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="outline"
                              className={`${getSectorBadgeColor(
                                department.sector
                              )} text-xs`}
                            >
                              {department.sector}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {department.code}
                            </span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isMutating}>
                            <MoreHorizontal className="h-5 w-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openEditDialog(department)}
                            disabled={isMutating}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Department
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteDepartment(department.id)}
                            disabled={isMutating}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Department
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Head</p>
                        <p className="text-sm font-medium text-foreground truncate">
                          {getDepartmentHead(department.headId)?.fullName ||
                            "No Head Assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Units ({department.units.length})</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {department.units.slice(0, 2).map((unit: DepartmentUnit) => (
                            <div
                              key={unit.id}
                              className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-full text-xs"
                            >
                              <span className="truncate max-w-[60px]">
                                {unit.name}
                              </span>
                              <button
                                onClick={() =>
                                  handleDeleteUnit(department.id, unit.id)
                                }
                                className="text-red-500 hover:text-red-700 disabled:opacity-50"
                                disabled={isMutating}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          {department.units.length > 2 && (
                            <span className="text-xs text-muted-foreground px-2 py-1">
                              +{department.units.length - 2} more
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <Switch
                          id={`active-${department.id}`}
                          checked={department.isActive}
                          disabled={isMutating}
                          onCheckedChange={() => handleToggleDepartmentStatus(department)}
                        />
                        <Label htmlFor={`active-${department.id}`} className="text-xs">Active</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDeptOpen} onOpenChange={setIsEditDeptOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update department details and information.
            </DialogDescription>
          </DialogHeader>
          <DepartmentForm
            deptFormData={deptFormData}
            setDeptFormData={setDeptFormData}
            availableUsers={availableUsers}
            onCancel={handleEditDeptCancel}
            onSubmit={handleEditDepartment}
            isEdit
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
