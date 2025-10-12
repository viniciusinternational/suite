'use client';

import { useState } from "react";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Import the reusable form components
import { DepartmentForm } from "@/components/department/department-form";
import { UnitForm } from "@/components/department/unit-form";

// Import types and mock data
import type { Department, DepartmentFormData, DepartmentUnit, Sector, UnitFormData, User } from "@/types";
import { mockDepartments } from "../mockdata";

const DepartmentManagement = () => {
  // Use mock data for now
  const departments = mockDepartments;
  const isLoading = false;
  const isMutating = false;

  // ---- Local UI states ----
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [isEditDeptOpen, setIsEditDeptOpen] = useState(false);

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

  const availableUsers: Partial<User>[] = [
    { id: '1', fullName: 'John Smith', role: 'super_admin', isActive: true },
    { id: '2', fullName: 'Sarah Johnson', role: 'managing_director', isActive: true },
    { id: '3', fullName: 'Mike Wilson', role: 'department_head', isActive: true },
    { id: '4', fullName: 'Emily Chen', role: 'employee', isActive: true },
    { id: '5', fullName: 'David Brown', role: 'hr_manager', isActive: true },
    { id: '6', fullName: 'Lisa Garcia', role: 'accountant', isActive: true },
    { id: '7', fullName: 'Robert Taylor', role: 'administrator', isActive: true },
    { id: '8', fullName: 'Maria Rodriguez', role: 'employee', isActive: true }
  ];

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getUnitManager = (managerId?: string) =>
    availableUsers.find((user) => user.id === managerId);

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
  const handleAddDepartment = () => {
    console.log("Add department:", deptFormData);
    resetDeptForm();
    setIsAddDeptOpen(false);
  };

  const handleEditDepartment = () => {
    if (!selectedDepartment) return;
    console.log("Edit department:", selectedDepartment, deptFormData);
    resetDeptForm();
    setSelectedDepartment(null);
    setIsEditDeptOpen(false);
  };

  const handleDeleteDepartment = (deptId: string) => {
    console.log("Delete department:", deptId);
  };

  const handleAddUnit = () => {
    console.log("Add unit:", unitFormData);
    resetUnitForm();
    setIsAddUnitOpen(false);
  };

  const handleDeleteUnit = (deptId: string, unitId: string) => {
    console.log("Delete unit:", deptId, unitId);
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

  if (isLoading) {
    return <div className="p-6">Loading departments…</div>;
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Department Management
          </h1>
          <p className="text-gray-600 mt-1">
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Unit</DialogTitle>
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
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Department</DialogTitle>
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

      {/* Stats Cards - Fixed dimming */}
      <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 transition-all duration-200 ${
        isMutating ? "opacity-60 pointer-events-none" : ""
      }`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Departments
                </p>
                <p className="text-2xl font-bold text-gray-900">
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
                <p className="text-sm font-medium text-gray-600">
                  Active Departments
                </p>
                <p className="text-2xl font-bold text-green-700">
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
                <p className="text-sm font-medium text-gray-600">Total Units</p>
                <p className="text-2xl font-bold text-purple-700">
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
                <p className="text-sm font-medium text-gray-600">
                  Department Heads
                </p>
                <p className="text-2xl font-bold text-orange-700">
                  {departments.filter((d) => d.headId).length}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Departments - Fixed dimming */}
      <Card className={`transition-all duration-200 ${
        isMutating ? "opacity-60" : ""
      }`}>
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

          {/* Loading overlay */}
          <div className="relative">
            {isMutating && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[0.5px] z-10 flex items-center justify-center">
                <div className="bg-white px-4 py-2 rounded-lg shadow-lg border flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">Processing...</span>
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-200 ${
              isMutating ? "pointer-events-none" : ""
            }`}>
              {filteredDepartments.map((department) => (
                <Card
                  key={department.id}
                  className="hover:shadow-lg transition-shadow duration-300"
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {department.name}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`${getSectorBadgeColor(
                              department.sector
                            )} text-xs`}
                          >
                            {department.sector}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Code: {department.code}
                        </p>
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
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Department Head</p>
                        <p className="font-medium text-gray-900">
                          {getDepartmentHead(department.headId)?.fullName ||
                            "No Head Assigned"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Units</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {department.units.map((unit: DepartmentUnit) => (
                            <div
                              key={unit.id}
                              className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                            >
                              <span>
                                {unit.name}{" "}
                                {unit.managerId &&
                                  `- ${getUnitManager(unit.managerId)?.fullName}`}
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
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`active-${department.id}`}
                          checked={department.isActive}
                          disabled={isMutating}
                          onCheckedChange={(checked) =>
                            console.log("Toggle department active:", department.id, checked)
                          }
                        />
                        <Label htmlFor={`active-${department.id}`}>Active</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Department Dialog */}
      <Dialog open={isEditDeptOpen} onOpenChange={setIsEditDeptOpen}>
        <DialogContent className="max-w-lg">
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

export default DepartmentManagement;