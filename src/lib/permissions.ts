import type { User, PermissionKey, UserPermissions } from '@/types';

/**
 * Get user's permissions object, defaulting to empty object if not set
 */
export function getUserPermissions(user: User | null): UserPermissions {
  if (!user || !user.permissions) {
    return {} as UserPermissions;
  }
  return user.permissions;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User | null, permission: PermissionKey): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  return user.permissions[permission] === true;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: User | null, permissions: PermissionKey[]): boolean {
  if (!user || !user.permissions || permissions.length === 0) {
    return false;
  }
  return permissions.some(permission => user.permissions?.[permission] === true);
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(user: User | null, permissions: PermissionKey[]): boolean {
  if (!user || !user.permissions || permissions.length === 0) {
    return false;
  }
  return permissions.every(permission => user.permissions?.[permission] === true);
}

/**
 * Check if user can access a module (has view permission for that module)
 */
export function canAccessModule(user: User | null, module: string): boolean {
  const viewPermission = `view_${module}` as PermissionKey;
  return hasPermission(user, viewPermission);
}

/**
 * Get all permissions the user has (returns array of permission keys that are true)
 */
export function getUserPermissionsList(user: User | null): PermissionKey[] {
  if (!user || !user.permissions) {
    return [];
  }
  return Object.entries(user.permissions)
    .filter(([_, value]) => value === true)
    .map(([key]) => key as PermissionKey);
}

/**
 * Check if user can perform an action on a module
 * Example: canPerformAction(user, 'projects', 'add') checks for 'add_projects' permission
 */
export function canPerformAction(
  user: User | null,
  module: string,
  action: 'view' | 'add' | 'edit' | 'delete' | 'approve'
): boolean {
  const permission = `${action}_${module}` as PermissionKey;
  return hasPermission(user, permission);
}

