'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PermissionsEditor } from '@/components/user/permissions-editor';
import { Loader2 } from 'lucide-react';
import type { Role } from '@/types';

export interface RoleFormState {
  name: string;
  code: string;
  description: string;
  permissions: Record<string, boolean>;
}

interface RoleFormProps {
  formData: RoleFormState;
  setFormData: (data: RoleFormState) => void;
  onCancel: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  isEdit?: boolean;
}

export function RoleForm({
  formData,
  setFormData,
  onCancel,
  onSubmit,
  isSubmitting = false,
  isEdit = false,
}: RoleFormProps) {
  const [errors, setErrors] = React.useState<{ name?: string; code?: string }>({});

  const validate = (): boolean => {
    const next: { name?: string; code?: string } = {};
    if (!formData.name.trim()) {
      next.name = 'Role name is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit();
  };

  const handleChange = (field: keyof RoleFormState, value: string | Record<string, boolean>) => {
    setFormData({ ...formData, [field]: value });
    if (field === 'name' && errors.name) setErrors({ ...errors, name: undefined });
    if (field === 'code' && errors.code) setErrors({ ...errors, code: undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role-name">Role name *</Label>
          <Input
            id="role-name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. HR Manager"
            className={errors.name ? 'border-destructive' : ''}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-code">Code (optional)</Label>
          <Input
            id="role-code"
            value={formData.code}
            onChange={(e) => handleChange('code', e.target.value)}
            placeholder="e.g. HR_MGR"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="role-description">Description (optional)</Label>
        <Textarea
          id="role-description"
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Brief description of this role"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label>Permissions</Label>
        <p className="text-sm text-muted-foreground">
          Select which permissions this role template grants. These can be applied when creating users.
        </p>
        <PermissionsEditor
          value={formData.permissions}
          onChange={(permissions) => handleChange('permissions', permissions)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEdit ? 'Update role' : 'Create role'}
        </Button>
      </div>
    </form>
  );
}

export function getInitialRoleFormState(role?: Role | null): RoleFormState {
  const permissions = (role?.permissions && typeof role.permissions === 'object')
    ? { ...(role.permissions as Record<string, boolean>) }
    : {};
  return {
    name: role?.name ?? '',
    code: role?.code ?? '',
    description: role?.description ?? '',
    permissions,
  };
}
