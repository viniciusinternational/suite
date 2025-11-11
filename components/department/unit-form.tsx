// UnitForm.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { AlertCircle, Loader2, X, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Department } from "@/types";

interface UnitFormData {
  name: string;
  departmentId: string;
  managerId: string;
  isActive: boolean;
}

interface User {
  id: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

interface UnitFormProps {
  unitFormData: UnitFormData;
  setUnitFormData: (data: UnitFormData) => void;
  departments: Department[];
  availableUsers: User[];
  onCancel: () => void;
  onSubmit: () => void;
  isLoadingDepartments?: boolean;
  isLoadingUsers?: boolean;
}

interface FormErrors {
  name?: string;
  departmentId?: string;
}

export const UnitForm: React.FC<UnitFormProps> = ({
  unitFormData,
  setUnitFormData,
  departments,
  availableUsers,
  onCancel,
  onSubmit,
  isLoadingDepartments = false,
  isLoadingUsers = false,
}) => {
  const [errors, setErrors] = React.useState<FormErrors>({});

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!unitFormData.name.trim()) {
      newErrors.name = "Unit name is required";
    } else if (unitFormData.name.trim().length < 2) {
      newErrors.name = "Unit name must be at least 2 characters";
    }
    
    if (!unitFormData.departmentId) {
      newErrors.departmentId = "Parent department is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit();
    }
  };

  const handleInputChange = (field: keyof UnitFormData, value: any) => {
    setUnitFormData({ ...unitFormData, [field]: value });
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const activeDepartments = departments.filter((d) => d.isActive);

  return (
    <div className="space-y-6">
      {/* Form Fields */}
      <div className="space-y-4">
        {/* Row 1: Unit Name and Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="unitName" className="text-sm font-medium">
              Unit Name *
            </Label>
            <Input
              id="unitName"
              value={unitFormData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter unit name"
              className={errors.name ? "border-destructive" : ""}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription id="name-error">
                  {errors.name}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="parentDept" className="text-sm font-medium">
              Parent Department *
            </Label>
            <Select
              value={unitFormData.departmentId}
              onValueChange={(value: string) => handleInputChange('departmentId', value)}
              disabled={isLoadingDepartments}
            >
              <SelectTrigger className={errors.departmentId ? "border-destructive w-full" : "w-full"} disabled={isLoadingDepartments}>
                <SelectValue placeholder={isLoadingDepartments ? "Loading departments..." : "Select department"} />
              </SelectTrigger>
              <SelectContent>
                {isLoadingDepartments ? (
                  <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading departments...</span>
                  </div>
                ) : (
                  activeDepartments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{dept.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {dept.code} • {dept.sector.replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.departmentId && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errors.departmentId}
                </AlertDescription>
              </Alert>
            )}
            {activeDepartments.length === 0 && !isLoadingDepartments && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No active departments available. Please create a department first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Row 2: Unit Manager (full width) */}
        <div className="space-y-2">
          <Label htmlFor="unitManager" className="text-sm font-medium">
            Unit Manager
            <span className="text-muted-foreground ml-1">(Optional)</span>
          </Label>
          <Select
            value={unitFormData.managerId}
            onValueChange={(value: string) => handleInputChange('managerId', value)}
            disabled={isLoadingUsers}
          >
            <SelectTrigger className="w-full" disabled={isLoadingUsers}>
              <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "Select manager"} />
            </SelectTrigger>
            <SelectContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading users...</span>
                </div>
              ) : (
                <>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">No Manager Assigned</span>
                    </div>
                  </SelectItem>
                  {availableUsers
                    .filter(user => user.isActive)
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.fullName}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.role.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Row 3: Status (full width) */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="unitActive" className="text-sm font-medium">
              Unit Status
            </Label>
            <p className="text-xs text-muted-foreground">
              Active units are visible and operational
            </p>
          </div>
          <Switch
            id="unitActive"
            checked={unitFormData.isActive}
            onCheckedChange={(checked: boolean) => handleInputChange('isActive', checked)}
          />
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button variant="outline" onClick={onCancel} type="button" className="gap-2">
          <X className="h-4 w-4" />
          Cancel
        </Button>
        <Button onClick={handleSubmit} type="button" disabled={activeDepartments.length === 0} className="gap-2">
          <Plus className="h-4 w-4" />
          Add
        </Button>
      </div>
    </div>
  );
};
