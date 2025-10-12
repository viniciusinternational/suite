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

export const UnitForm: React.FC<UnitFormProps> = ({
  unitFormData,
  setUnitFormData,
  departments,
  availableUsers,
  onCancel,
  onSubmit,
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="unitName">Unit Name</Label>
        <Input
          id="unitName"
          value={unitFormData.name}
          onChange={(e) =>
            setUnitFormData({ ...unitFormData, name: e.target.value })
          }
          placeholder="Enter unit name"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="parentDept">Parent Department</Label>
          <Select
            value={unitFormData.departmentId}
            onValueChange={(value: string) =>
              setUnitFormData({ ...unitFormData, departmentId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departments
                .filter((d) => d.isActive)
                .map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitManager">Unit Manager</Label>
          <Select
            value={unitFormData.managerId}
            onValueChange={(value: string) =>
              setUnitFormData({ ...unitFormData, managerId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select manager" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Manager Assigned</SelectItem>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.fullName} - {user.role.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="unitActive"
          checked={unitFormData.isActive}
          onCheckedChange={(checked: boolean) =>
            setUnitFormData({ ...unitFormData, isActive: checked })
          }
        />
        <Label htmlFor="unitActive">Active Unit</Label>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>Add Unit</Button>
      </div>
    </div>
  );
};