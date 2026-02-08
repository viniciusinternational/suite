export interface Role {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  permissions: Record<string, boolean>; // same shape as UserPermissions
  createdAt: string;
  updatedAt: string;
}

export type RoleFormData = Pick<Role, 'name' | 'code' | 'description'> & {
  permissions: Record<string, boolean>;
};
