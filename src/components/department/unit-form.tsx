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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, FolderTree, User, Building2 } from "lucide-react";
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
    <div className="space-y-4">
      {/* Basic Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FolderTree className="h-5 w-5" />
            Unit Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            >
              <SelectTrigger className={errors.departmentId ? "border-destructive" : ""}>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {activeDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{dept.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {dept.code} • {dept.sector.replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                  </SelectItem>
                ))}
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
            {activeDepartments.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No active departments available. Please create a department first.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Management Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="unitManager" className="text-sm font-medium">
              Unit Manager
              <span className="text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Select
              value={unitFormData.managerId}
              onValueChange={(value: string) => handleInputChange('managerId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select manager" />
              </SelectTrigger>
              <SelectContent>
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
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Assign a manager to oversee this unit. This can be done later.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Status Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Status
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button onClick={handleSubmit} type="button" disabled={activeDepartments.length === 0}>
          Create Unit
        </Button>
      </div>
    </div>
  );
};