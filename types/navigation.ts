import type { PermissionKey } from './auth';

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  permissions?: PermissionKey[];
  badge?: string;
  children?: NavigationItem[];
}
