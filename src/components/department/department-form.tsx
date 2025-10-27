// DepartmentForm.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { AlertCircle, Building2, User, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Sector } from "@/types";

interface DepartmentFormData {
  name: string;
  code: string;
  sector: Sector;
  description: string;
  headId: string;
  isActive: boolean;
}

interface User {
  id: string;
  fullName: string;
  role: string;
  isActive: boolean;
}

interface DepartmentFormProps {
  deptFormData: DepartmentFormData;
  setDeptFormData: (data: DepartmentFormData) => void;
  availableUsers: User[];
  onCancel: () => void;
  onSubmit: () => void;
  isEdit?: boolean;
}

interface FormErrors {
  name?: string;
  code?: string;
  sector?: string;
  description?: string;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  deptFormData,
  setDeptFormData,
  availableUsers,
  onCancel,
  onSubmit,
  isEdit = false,
}) => {
  const [errors, setErrors] = React.useState<FormErrors>({});

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!deptFormData.name.trim()) {
      newErrors.name = "Department name is required";
    } else if (deptFormData.name.trim().length < 2) {
      newErrors.name = "Department name must be at least 2 characters";
    }
    
    if (!deptFormData.code.trim()) {
      newErrors.code = "Department code is required";
    } else if (deptFormData.code.trim().length < 2) {
      newErrors.code = "Department code must be at least 2 characters";
    }
    
    if (!deptFormData.sector) {
      newErrors.sector = "Sector is required";
    }
    
    if (deptFormData.description && deptFormData.description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit();
    }
  };

  const handleInputChange = (field: keyof DepartmentFormData, value: any) => {
    setDeptFormData({ ...deptFormData, [field]: value });
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="deptName" className="text-sm font-medium">
                Department Name *
              </Label>
              <Input
                id="deptName"
                value={deptFormData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter department name"
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
              <Label htmlFor="deptCode" className="text-sm font-medium">
                Department Code *
              </Label>
              <Input
                id="deptCode"
                value={deptFormData.code}
                onChange={(e) => handleInputChange('code', e.target.value.toUpperCase())}
                placeholder="Enter code (e.g., ENG)"
                className={errors.code ? "border-destructive" : ""}
                aria-describedby={errors.code ? "code-error" : undefined}
                maxLength={10}
              />
              {errors.code && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription id="code-error">
                    {errors.code}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sector" className="text-sm font-medium">
              Sector *
            </Label>
            <Select
              value={deptFormData.sector}
              onValueChange={(value: Sector) => handleInputChange('sector', value)}
            >
              <SelectTrigger className={errors.sector ? "border-destructive" : ""}>
                <SelectValue placeholder="Select sector" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="construction">Construction</SelectItem>
                <SelectItem value="engineering">Engineering</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="administration">Administration</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            {errors.sector && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {errors.sector}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Leadership Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" />
            Leadership
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="head" className="text-sm font-medium">
              Department Head
              <span className="text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Select
              value={deptFormData.headId}
              onValueChange={(value) => handleInputChange('headId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department head" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">No Head Assigned</span>
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
              Assign a department head to manage this department. This can be done later.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Details Section */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Additional Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
              <span className="text-muted-foreground ml-1">(Optional)</span>
            </Label>
            <Textarea
              id="description"
              value={deptFormData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter department description"
              rows={3}
              className={errors.description ? "border-destructive" : ""}
              aria-describedby={errors.description ? "description-error" : undefined}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Brief description of the department's purpose and responsibilities.
              </p>
              <span className="text-xs text-muted-foreground">
                {deptFormData.description.length}/500
              </span>
            </div>
            {errors.description && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription id="description-error">
                  {errors.description}
                </AlertDescription>
              </Alert>
            )}
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="deptActive" className="text-sm font-medium">
                Department Status
              </Label>
              <p className="text-xs text-muted-foreground">
                Active departments are visible and operational
              </p>
            </div>
            <Switch
              id="deptActive"
              checked={deptFormData.isActive}
              onCheckedChange={(checked) => handleInputChange('isActive', checked)}
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="outline" onClick={onCancel} type="button">
          Cancel
        </Button>
        <Button onClick={handleSubmit} type="button">
          {isEdit ? "Update Department" : "Create Department"}
        </Button>
      </div>
    </div>
  );
};
  