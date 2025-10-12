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

export const DepartmentForm: React.FC<DepartmentFormProps> = ({
  deptFormData,
  setDeptFormData,
  availableUsers,
  onCancel,
  onSubmit,
  isEdit = false,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="deptName">Department Name</Label>
          <Input
            id="deptName"
            value={deptFormData.name}
            onChange={(e) =>
              setDeptFormData({ ...deptFormData, name: e.target.value })
            }
            placeholder="Enter department name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="deptCode">Department Code</Label>
          <Input
            id="deptCode"
            value={deptFormData.code}
            onChange={(e) =>
              setDeptFormData({
                ...deptFormData,
                code: e.target.value.toUpperCase(),
              })
            }
            placeholder="Enter code (e.g., ENG)"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sector">Sector</Label>
          <Select
            value={deptFormData.sector}
            onValueChange={(value: Sector) =>
              setDeptFormData({ ...deptFormData, sector: value })
            }
          >
            <SelectTrigger>
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
        </div>
        <div className="space-y-2">
          <Label htmlFor="head">Department Head</Label>
          <Select
            value={deptFormData.headId}
            onValueChange={(value) =>
              setDeptFormData({ ...deptFormData, headId: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department head" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Head Assigned</SelectItem>
              {availableUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.fullName} - {user.role.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={deptFormData.description}
          onChange={(e) =>
            setDeptFormData({ ...deptFormData, description: e.target.value })
          }
          placeholder="Enter department description"
          rows={3}
        />
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch
          id="deptActive"
          checked={deptFormData.isActive}
          onCheckedChange={(checked) =>
            setDeptFormData({ ...deptFormData, isActive: checked })
          }
        />
        <Label htmlFor="deptActive">Active Department</Label>
      </div>
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? "Update Department" : "Add Department"}
        </Button>
      </div>
    </div>
  );
};
  