'use client';

import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import type { User, Department } from '@/types';

interface Props {
  users: User[];
  departments: Department[];
  viewUserIds: string[];
  editUserIds: string[];
  deleteUserIds: string[];
  viewDepartmentIds: string[];
  editDepartmentIds: string[];
  deleteDepartmentIds: string[];
  onViewUsersChange: (ids: string[]) => void;
  onEditUsersChange: (ids: string[]) => void;
  onDeleteUsersChange: (ids: string[]) => void;
  onViewDepartmentsChange: (ids: string[]) => void;
  onEditDepartmentsChange: (ids: string[]) => void;
  onDeleteDepartmentsChange: (ids: string[]) => void;
  isPublic?: boolean;
}

export function DocumentPermissions({
  users,
  departments,
  viewUserIds,
  editUserIds,
  deleteUserIds,
  viewDepartmentIds,
  editDepartmentIds,
  deleteDepartmentIds,
  onViewUsersChange,
  onEditUsersChange,
  onDeleteUsersChange,
  onViewDepartmentsChange,
  onEditDepartmentsChange,
  onDeleteDepartmentsChange,
  isPublic = false,
}: Props) {
  const userOptions = users.map((u) => ({
    id: u.id,
    label: u.fullName,
    value: u.id,
    avatar: u.avatar,
    description: u.position,
  }));

  const departmentOptions = departments.map((d) => ({
    id: d.id,
    label: d.name,
    value: d.id,
    description: d.sector,
  }));

  return (
    <div className="space-y-6">
      {!isPublic && (
        <div>
          <h3 className="text-sm font-semibold mb-4">View Permissions</h3>
          <div className="space-y-4">
            <div>
              <Label>Users with View Access</Label>
              <div className="mt-2">
                <MultiSelect
                  options={userOptions}
                  selected={viewUserIds}
                  onChange={onViewUsersChange}
                  placeholder="Select users..."
                  searchPlaceholder="Search users..."
                  emptyMessage="No users found"
                />
              </div>
            </div>
            <div>
              <Label>Departments with View Access</Label>
              <div className="mt-2">
                <MultiSelect
                  options={departmentOptions}
                  selected={viewDepartmentIds}
                  onChange={onViewDepartmentsChange}
                  placeholder="Select departments..."
                  searchPlaceholder="Search departments..."
                  emptyMessage="No departments found"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold mb-4">Edit Permissions</h3>
        <div className="space-y-4">
          <div>
            <Label>Users with Edit Access</Label>
            <div className="mt-2">
              <MultiSelect
                options={userOptions}
                selected={editUserIds}
                onChange={onEditUsersChange}
                placeholder="Select users..."
                searchPlaceholder="Search users..."
                emptyMessage="No users found"
              />
            </div>
          </div>
          <div>
            <Label>Departments with Edit Access</Label>
            <div className="mt-2">
              <MultiSelect
                options={departmentOptions}
                selected={editDepartmentIds}
                onChange={onEditDepartmentsChange}
                placeholder="Select departments..."
                searchPlaceholder="Search departments..."
                emptyMessage="No departments found"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-4">Delete Permissions</h3>
        <div className="space-y-4">
          <div>
            <Label>Users with Delete Access</Label>
            <div className="mt-2">
              <MultiSelect
                options={userOptions}
                selected={deleteUserIds}
                onChange={onDeleteUsersChange}
                placeholder="Select users..."
                searchPlaceholder="Search users..."
                emptyMessage="No users found"
              />
            </div>
          </div>
          <div>
            <Label>Departments with Delete Access</Label>
            <div className="mt-2">
              <MultiSelect
                options={departmentOptions}
                selected={deleteDepartmentIds}
                onChange={onDeleteDepartmentsChange}
                placeholder="Select departments..."
                searchPlaceholder="Search departments..."
                emptyMessage="No departments found"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

