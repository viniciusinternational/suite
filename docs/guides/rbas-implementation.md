# Role-Based Access System (RBAS) Implementation Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Type Definitions](#type-definitions)
5. [Permission System Core](#permission-system-core)
6. [Client-Side Implementation](#client-side-implementation)
7. [Server-Side Implementation](#server-side-implementation)
8. [Route Protection](#route-protection)
9. [Component-Level Authorization](#component-level-authorization)
10. [Navigation Filtering](#navigation-filtering)
11. [Permission Management UI](#permission-management-ui)
12. [Best Practices](#best-practices)
13. [Testing](#testing)
14. [Migration Guide](#migration-guide)

---

## Overview

This guide provides a comprehensive implementation of a **Role-Based Access System (RBAS)** using a granular, permission-based authorization model. The system separates authentication (who you are) from authorization (what you can do), providing fine-grained control over user access to application features.

### Key Features

- **Granular Permissions**: Module-based permissions with action-level control
- **Flexible Assignment**: Permissions assigned per user, independent of roles
- **Client & Server Validation**: Authorization checks on both frontend and backend
- **Type-Safe**: Full TypeScript support with strict typing
- **Extensible**: Easy to add new modules and permissions
- **Performance**: Efficient permission checking with minimal overhead

### Core Concepts

1. **Permission Format**: `{action}_{module}` (e.g., `view_projects`, `add_users`)
2. **Permission Storage**: JSON object on user entity with boolean values
3. **Permission Checking**: Multiple utility functions for different use cases
4. **Authorization Flow**: Authentication → Permission Check → Access Grant/Deny

---

## Architecture

### System Components

```
┌─────────────────┐
│  Auth Provider  │ (External - JWT/OAuth)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Database  │ (Local - User + Permissions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Permission     │ (Client & Server)
│  Check Functions│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Route Guards   │ (Frontend)
│  API Middleware │ (Backend)
└─────────────────┘
```

### Data Flow

1. **Authentication**: User authenticates via external provider → receives token
2. **User Lookup**: System looks up user in local database by identifier (email)
3. **Permission Load**: User's permissions loaded from database (JSON field)
4. **Authorization**: Permission checks performed on every protected action
5. **Access Control**: UI and API routes enforce permissions

---

## Database Schema

### User Model

The user model includes a JSON field for storing permissions.

#### Prisma Schema Example

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  firstName    String
  lastName     String
  fullName     String
  role         String   // Optional: role name (admin, employee, etc.)
  isActive     Boolean  @default(true)
  permissions  Json?    // Permission object: { "view_projects": true, ... }
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  // ... other fields
}
```

#### SQL Schema Example (PostgreSQL)

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB,  -- JSONB for better querying in PostgreSQL
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for permission queries
CREATE INDEX idx_users_permissions ON users USING GIN (permissions);
```

#### MongoDB Schema Example

```javascript
{
  _id: ObjectId,
  email: String,
  firstName: String,
  lastName: String,
  fullName: String,
  role: String,
  isActive: Boolean,
  permissions: {
    // Example structure
    view_projects: Boolean,
    add_projects: Boolean,
    edit_projects: Boolean,
    // ... more permissions
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Permission Storage Format

Permissions are stored as a JSON object where:
- **Key**: Permission identifier (e.g., `view_projects`)
- **Value**: Boolean (`true` = granted, `false` or missing = denied)

```json
{
  "view_dashboard": true,
  "view_projects": true,
  "add_projects": true,
  "edit_projects": false,
  "delete_projects": false,
  "view_users": true,
  "add_users": false
}
```

---

## Type Definitions

### Permission Key Types

Define all possible permission keys as a union type for type safety.

```typescript
// types/permissions.ts

/**
 * Permission key format: {action}_{module}
 * 
 * Actions:
 * - view: Read/access module
 * - add: Create new items
 * - edit: Modify existing items
 * - delete: Remove items
 * - approve: Approve/authorize actions (module-specific)
 * 
 * Modules: Define based on your application's modules
 */
export type PermissionKey =
  // Dashboard
  | 'view_dashboard'
  // Projects Module
  | 'view_projects'
  | 'add_projects'
  | 'edit_projects'
  | 'delete_projects'
  | 'approve_projects'
  // Users Module
  | 'view_users'
  | 'add_users'
  | 'edit_users'
  | 'delete_users'
  // Departments Module
  | 'view_departments'
  | 'add_departments'
  | 'edit_departments'
  | 'delete_departments'
  // Add more modules as needed...
  | 'view_reports'
  | 'view_audit_logs'
  | 'view_settings'
  | 'edit_settings';

/**
 * Permission record type - maps permission keys to boolean values
 */
export type UserPermissions = Record<PermissionKey, boolean>;

/**
 * Partial permissions - for updates (not all permissions required)
 */
export type PartialUserPermissions = Partial<UserPermissions>;
```

### User Type

```typescript
// types/user.ts

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role?: string; // Optional role identifier
  isActive: boolean;
  permissions?: UserPermissions; // Permission object
  createdAt: string;
  updatedAt: string;
  // ... other user fields
}
```

---

## Permission System Core

### Core Permission Functions

Create a centralized permission checking module.

```typescript
// lib/permissions.ts

import type { User, PermissionKey, UserPermissions } from '@/types';

/**
 * Get user's permissions object, defaulting to empty object if not set
 * 
 * @param user - User object or null
 * @returns UserPermissions object
 */
export function getUserPermissions(user: User | null): UserPermissions {
  if (!user || !user.permissions) {
    return {} as UserPermissions;
  }
  return user.permissions;
}

/**
 * Check if user has a specific permission
 * 
 * @param user - User object or null
 * @param permission - Permission key to check
 * @returns true if permission exists and is true, false otherwise
 * 
 * @example
 * hasPermission(user, 'view_projects')
 */
export function hasPermission(
  user: User | null,
  permission: PermissionKey
): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  return user.permissions[permission] === true;
}

/**
 * Check if user has any of the specified permissions (OR logic)
 * Useful when user needs at least one permission from a set
 * 
 * @param user - User object or null
 * @param permissions - Array of permission keys to check
 * @returns true if user has at least one permission, false otherwise
 * 
 * @example
 * hasAnyPermission(user, ['view_projects', 'view_reports'])
 */
export function hasAnyPermission(
  user: User | null,
  permissions: PermissionKey[]
): boolean {
  if (!user || !user.permissions || permissions.length === 0) {
    return false;
  }
  return permissions.some(permission => user.permissions?.[permission] === true);
}

/**
 * Check if user has all of the specified permissions (AND logic)
 * Useful when user needs multiple permissions simultaneously
 * 
 * @param user - User object or null
 * @param permissions - Array of permission keys to check
 * @returns true if user has all permissions, false otherwise
 * 
 * @example
 * hasAllPermissions(user, ['view_projects', 'edit_projects'])
 */
export function hasAllPermissions(
  user: User | null,
  permissions: PermissionKey[]
): boolean {
  if (!user || !user.permissions || permissions.length === 0) {
    return false;
  }
  return permissions.every(permission => user.permissions?.[permission] === true);
}

/**
 * Check if user can access a module (has view permission for that module)
 * 
 * @param user - User object or null
 * @param module - Module name (e.g., 'projects', 'users')
 * @returns true if user has view permission for the module
 * 
 * @example
 * canAccessModule(user, 'projects') // Checks for 'view_projects'
 */
export function canAccessModule(user: User | null, module: string): boolean {
  const viewPermission = `view_${module}` as PermissionKey;
  return hasPermission(user, viewPermission);
}

/**
 * Get all permissions the user has (returns array of permission keys that are true)
 * 
 * @param user - User object or null
 * @returns Array of permission keys that are granted
 * 
 * @example
 * getUserPermissionsList(user) // ['view_projects', 'add_projects', ...]
 */
export function getUserPermissionsList(user: User | null): PermissionKey[] {
  if (!user || !user.permissions) {
    return [];
  }
  return Object.entries(user.permissions)
    .filter(([, value]) => value === true)
    .map(([key]) => key as PermissionKey);
}

/**
 * Check if user can perform an action on a module
 * 
 * @param user - User object or null
 * @param module - Module name (e.g., 'projects', 'users')
 * @param action - Action to perform ('view' | 'add' | 'edit' | 'delete' | 'approve')
 * @returns true if user has the permission for the action
 * 
 * @example
 * canPerformAction(user, 'projects', 'add') // Checks for 'add_projects'
 */
export function canPerformAction(
  user: User | null,
  module: string,
  action: 'view' | 'add' | 'edit' | 'delete' | 'approve'
): boolean {
  const permission = `${action}_${module}` as PermissionKey;
  return hasPermission(user, permission);
}
```

### Permission Function Reference

| Function | Parameters | Returns | Use Case | Example |
|----------|-----------|---------|----------|---------|
| `getUserPermissions` | `user: User \| null` | `UserPermissions` | Get all permissions object | `const perms = getUserPermissions(user)` |
| `hasPermission` | `user: User \| null`, `permission: PermissionKey` | `boolean` | Check single permission | `hasPermission(user, 'view_projects')` |
| `hasAnyPermission` | `user: User \| null`, `permissions: PermissionKey[]` | `boolean` | OR logic - user needs at least one | `hasAnyPermission(user, ['view_projects', 'edit_projects'])` |
| `hasAllPermissions` | `user: User \| null`, `permissions: PermissionKey[]` | `boolean` | AND logic - user needs all | `hasAllPermissions(user, ['view_projects', 'edit_projects'])` |
| `canAccessModule` | `user: User \| null`, `module: string` | `boolean` | Check if user can view a module | `canAccessModule(user, 'projects')` |
| `canPerformAction` | `user: User \| null`, `module: string`, `action: string` | `boolean` | Check action on module | `canPerformAction(user, 'projects', 'add')` |
| `getUserPermissionsList` | `user: User \| null` | `PermissionKey[]` | Get list of granted permissions | `getUserPermissionsList(user)` |

---

## Client-Side Implementation

### Authentication Store

Use a state management library (Zustand, Redux, etc.) to store authentication state.

```typescript
// store/auth-store.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  hasHydrated: boolean;
  
  // Actions
  setUser: (user: User) => void;
  setToken: (token: string, refreshToken?: string) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      hasHydrated: false,
      
      setUser: (user) => set({ user }),
      setToken: (token, refreshToken) => set({ token, refreshToken }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      logout: () => set({
        user: null,
        isAuthenticated: false,
        token: null,
        refreshToken: null,
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
```

---

## Route Protection

### Route Guard Hook

Create a reusable hook for protecting routes.

```typescript
// hooks/use-auth-guard.ts

'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { hasAnyPermission } from '@/lib/permissions';
import type { PermissionKey } from '@/types';

interface UseAuthGuardReturn {
  isChecking: boolean;
  user: any | null;
}

/**
 * Hook to protect routes with authentication and optional permission checks
 * 
 * @param requiredPermissions - Optional array of permission keys. User needs at least one.
 * @returns Object with isChecking flag and user object
 * 
 * @example
 * // Require authentication only
 * const { isChecking, user } = useAuthGuard();
 * 
 * // Require specific permission
 * const { isChecking, user } = useAuthGuard(['view_projects']);
 * 
 * // Require any of multiple permissions
 * const { isChecking, user } = useAuthGuard(['view_projects', 'view_reports']);
 */
export function useAuthGuard(
  requiredPermissions?: PermissionKey[]
): UseAuthGuardReturn {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for hydration to complete before checking authentication
    if (!hasHydrated) {
      return;
    }

    // 1. Check authentication
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // 2. Check permissions if required permissions are specified
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasAnyPermission(user, requiredPermissions)) {
        // User doesn't have required permissions
        // If already on dashboard, don't redirect (avoid infinite loop)
        if (pathname !== '/dashboard') {
          router.push('/dashboard');
          return;
        }
        // If on dashboard and missing permission, still allow (will show no access message)
      }
    }

    // User is authenticated and authorized
    setIsChecking(false);
  }, [isAuthenticated, user, hasHydrated, router, requiredPermissions, pathname]);

  return { isChecking, user };
}
```

### Using Route Guards in Pages

```typescript
// app/(dashboard)/projects/page.tsx

'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function ProjectsPage() {
  const { isChecking, user } = useAuthGuard(['view_projects']);
  
  if (isChecking) {
    return <LoadingSpinner />;
  }
  
  return (
    <div>
      <h1>Projects</h1>
      {/* Your projects content */}
    </div>
  );
}
```

### Middleware for Route Protection (Next.js)

```typescript
// middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get token from cookie or header
  const token = request.cookies.get('auth-token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Protected routes
  const protectedPaths = ['/dashboard', '/projects', '/users', '/settings'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  if (isProtectedPath && !token) {
    // Redirect to login
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

---

## Component-Level Authorization

### Conditional Rendering Based on Permissions

```typescript
// components/projects/project-list.tsx

'use client';

import { useAuthStore } from '@/store/auth-store';
import { hasPermission } from '@/lib/permissions';
import { Button } from '@/components/ui/button';

export function ProjectList({ projects }: { projects: Project[] }) {
  const { user } = useAuthStore();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Projects</h1>
        {hasPermission(user, 'add_projects') && (
          <Button onClick={handleAddProject}>Add Project</Button>
        )}
      </div>
      
      <div className="grid gap-4">
        {projects.map(project => (
          <div key={project.id} className="border p-4 rounded">
            <h2>{project.name}</h2>
            <div className="flex gap-2 mt-2">
              {hasPermission(user, 'edit_projects') && (
                <Button 
                  variant="outline" 
                  onClick={() => handleEdit(project)}
                >
                  Edit
                </Button>
              )}
              {hasPermission(user, 'delete_projects') && (
                <Button 
                  variant="destructive" 
                  onClick={() => handleDelete(project)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Action-Based Permission Checks

```typescript
// components/documents/document-actions.tsx

'use client';

import { useAuthStore } from '@/store/auth-store';
import { canPerformAction } from '@/lib/permissions';
import { Button } from '@/components/ui/button';

export function DocumentActions({ document }: { document: Document }) {
  const { user } = useAuthStore();
  
  const canEdit = canPerformAction(user, 'documents', 'edit');
  const canDelete = canPerformAction(user, 'documents', 'delete');
  const canApprove = canPerformAction(user, 'documents', 'approve');
  
  return (
    <div className="flex gap-2">
      {canEdit && (
        <Button onClick={() => handleEdit(document)}>Edit</Button>
      )}
      {canDelete && (
        <Button variant="destructive" onClick={() => handleDelete(document)}>
          Delete
        </Button>
      )}
      {canApprove && (
        <Button variant="outline" onClick={() => handleApprove(document)}>
          Approve
        </Button>
      )}
    </div>
  );
}
```

### Multiple Permission Requirements

```typescript
// Example: Require ALL permissions (AND logic)
import { hasAllPermissions } from '@/lib/permissions';

if (hasAllPermissions(user, ['view_projects', 'edit_projects'])) {
  // User can both view and edit projects
  return <AdvancedProjectEditor />;
}

// Example: Require ANY permission (OR logic)
import { hasAnyPermission } from '@/lib/permissions';

if (hasAnyPermission(user, ['view_projects', 'view_reports'])) {
  // User can view either projects or reports
  return <DashboardContent />;
}
```

---

## Navigation Filtering

### Navigation Configuration

```typescript
// lib/navigation.ts

import type { NavigationItem } from '@/types';
import { hasAnyPermission } from '@/lib/permissions';
import type { User } from '@/types';

export const navigationConfig: NavigationItem[] = [
  // Dashboard - Always accessible to authenticated users
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/dashboard',
    permissions: [], // Empty array means always accessible when authenticated
  },
  // Projects Module
  {
    id: 'projects',
    label: 'Projects',
    icon: 'FolderOpen',
    href: '/projects',
    permissions: ['view_projects'],
  },
  // Users Module
  {
    id: 'users',
    label: 'Users',
    icon: 'UserCheck',
    href: '/users',
    permissions: ['view_users'],
  },
  // Reports Module
  {
    id: 'reports',
    label: 'Reports',
    icon: 'BarChart3',
    href: '/reports',
    permissions: ['view_reports'],
  },
  // Add more navigation items...
];

/**
 * Get navigation items filtered by user permissions
 * 
 * @param user - User object or null
 * @returns Filtered array of navigation items user can access
 */
export function getNavigationForPermissions(
  user: User | null
): NavigationItem[] {
  if (!user) {
    return [];
  }

  return navigationConfig.filter(item => {
    // Dashboard is always available to authenticated users
    if (item.id === 'dashboard') {
      return true;
    }

    // If no permissions required, show item (shouldn't happen but safety check)
    if (!item.permissions || item.permissions.length === 0) {
      return false;
    }

    // User needs at least one of the required permissions
    return hasAnyPermission(user, item.permissions);
  }).map(item => {
    // Recursively filter children
    if (item.children && item.children.length > 0) {
      return {
        ...item,
        children: item.children.filter(child => {
          if (!child.permissions || child.permissions.length === 0) {
            return false;
          }
          return hasAnyPermission(user, child.permissions);
        }),
      };
    }
    return item;
  }).filter(item => {
    // Remove parent items that have no visible children
    if (item.children && item.children.length === 0) {
      return false;
    }
    return true;
  });
}
```

### Using Navigation in Sidebar

```typescript
// components/layout/sidebar.tsx

'use client';

import { useAuthStore } from '@/store/auth-store';
import { getNavigationForPermissions } from '@/lib/navigation';
import { NavLink } from '@/components/ui/nav-link';

export function Sidebar() {
  const { user } = useAuthStore();
  const navigationItems = getNavigationForPermissions(user);
  
  return (
    <nav className="space-y-1">
      {navigationItems.map(item => (
        <NavLink key={item.id} href={item.href} icon={item.icon}>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
```

---

## Server-Side Implementation

### API Route Permission Validation

Always validate permissions on the server side for security.

```typescript
// lib/api-permissions.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import type { PermissionKey } from '@/types';

/**
 * Get user from request headers
 * Assumes user ID is passed in x-user-id header or extracted from token
 */
async function getUserFromRequest(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  
  if (!userId) {
    return null;
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      isActive: true,
      permissions: true,
    },
  });
  
  return user;
}

/**
 * Check if user has required permission
 */
function hasPermission(
  user: any,
  permission: PermissionKey
): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  
  const permissions = user.permissions as Record<string, boolean>;
  return permissions[permission] === true;
}

/**
 * Check if user has any of the required permissions
 */
function hasAnyPermission(
  user: any,
  permissions: PermissionKey[]
): boolean {
  if (!user || !user.permissions || permissions.length === 0) {
    return false;
  }
  
  const userPermissions = user.permissions as Record<string, boolean>;
  return permissions.some(permission => userPermissions[permission] === true);
}

/**
 * Middleware to check authentication and permissions
 */
export async function requireAuth(
  request: NextRequest,
  requiredPermissions?: PermissionKey[]
): Promise<{ user: any } | NextResponse> {
  const user = await getUserFromRequest(request);
  
  // Check authentication
  if (!user) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // Check if user is active
  if (!user.isActive) {
    return NextResponse.json(
      { ok: false, error: 'Account is deactivated' },
      { status: 403 }
    );
  }
  
  // Check permissions if required
  if (requiredPermissions && requiredPermissions.length > 0) {
    if (!hasAnyPermission(user, requiredPermissions)) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Forbidden: Missing required permissions',
          requiredPermissions 
        },
        { status: 403 }
      );
    }
  }
  
  return { user };
}
```

### Using Permission Validation in API Routes

```typescript
// app/api/projects/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-permissions';
import { prisma } from '@/lib/prisma';

// GET /api/projects - List projects
export async function GET(request: NextRequest) {
  // Check authentication and permission
  const authResult = await requireAuth(request, ['view_projects']);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Error response
  }
  
  const { user } = authResult;
  
  try {
    const projects = await prisma.project.findMany({
      // ... query options
    });
    
    return NextResponse.json({
      ok: true,
      data: projects,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create project
export async function POST(request: NextRequest) {
  // Check authentication and permission
  const authResult = await requireAuth(request, ['add_projects']);
  
  if (authResult instanceof NextResponse) {
    return authResult; // Error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    const project = await prisma.project.create({
      data: {
        // ... project data
        createdById: user.id,
      },
    });
    
    return NextResponse.json({
      ok: true,
      data: project,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
```

### Dynamic Route Permission Validation

```typescript
// app/api/projects/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-permissions';
import { prisma } from '@/lib/prisma';

// GET /api/projects/[id] - Get single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, ['view_projects']);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { id } = await params;
  
  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });
    
    if (!project) {
      return NextResponse.json(
        { ok: false, error: 'Project not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      ok: true,
      data: project,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, ['edit_projects']);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { id } = await params;
  const body = await request.json();
  
  try {
    const project = await prisma.project.update({
      where: { id },
      data: body,
    });
    
    return NextResponse.json({
      ok: true,
      data: project,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuth(request, ['delete_projects']);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  const { id } = await params;
  
  try {
    await prisma.project.delete({
      where: { id },
    });
    
    return NextResponse.json({
      ok: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
```

---

## Permission Management UI

### Permissions Editor Component

Create a UI component for managing user permissions.

```typescript
// components/user/permissions-editor.tsx

'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PermissionKey, UserPermissions } from '@/types';

interface PermissionsEditorProps {
  value?: UserPermissions;
  onChange: (permissions: UserPermissions) => void;
}

// Define your module permissions structure
const MODULE_PERMISSIONS = [
  {
    module: 'Dashboard',
    permissions: [
      { key: 'view_dashboard' as PermissionKey, label: 'View Dashboard', description: 'Access the main dashboard' },
    ],
  },
  {
    module: 'Projects',
    permissions: [
      { key: 'view_projects' as PermissionKey, label: 'View Projects', description: 'View project list and details' },
      { key: 'add_projects' as PermissionKey, label: 'Add Projects', description: 'Create new projects' },
      { key: 'edit_projects' as PermissionKey, label: 'Edit Projects', description: 'Modify existing projects' },
      { key: 'delete_projects' as PermissionKey, label: 'Delete Projects', description: 'Remove projects' },
      { key: 'approve_projects' as PermissionKey, label: 'Approve Projects', description: 'Approve project requests' },
    ],
  },
  {
    module: 'Users',
    permissions: [
      { key: 'view_users' as PermissionKey, label: 'View Users', description: 'View user list and details' },
      { key: 'add_users' as PermissionKey, label: 'Add Users', description: 'Create new users' },
      { key: 'edit_users' as PermissionKey, label: 'Edit Users', description: 'Modify user information' },
      { key: 'delete_users' as PermissionKey, label: 'Delete Users', description: 'Remove users' },
    ],
  },
  // Add more modules...
];

export function PermissionsEditor({ value = {} as UserPermissions, onChange }: PermissionsEditorProps) {
  const handlePermissionToggle = (key: PermissionKey, enabled: boolean) => {
    const newPermissions = { ...value, [key]: enabled };
    onChange(newPermissions);
  };

  return (
    <div className="space-y-6">
      {MODULE_PERMISSIONS.map((module) => (
        <Card key={module.module}>
          <CardHeader>
            <CardTitle className="text-lg">{module.module}</CardTitle>
            <CardDescription>Permissions for {module.module} module</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {module.permissions.map((permission) => (
                <div
                  key={permission.key}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <Label className="text-sm font-medium">{permission.label}</Label>
                    <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                  </div>
                  <Switch
                    checked={value[permission.key] || false}
                    onCheckedChange={(checked) => handlePermissionToggle(permission.key, checked)}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### API Route for Updating Permissions

```typescript
// app/api/users/[id]/permissions/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/api-permissions';
import type { UserPermissions } from '@/types';

const updatePermissionsSchema = z.object({
  permissions: z.record(z.string(), z.boolean()).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Require edit_users permission to update user permissions
  const authResult = await requireAuth(request, ['edit_users']);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  try {
    const { id } = await params;
    const body = await request.json();
    const parsedData = updatePermissionsSchema.parse(body);

    if (!Object.prototype.hasOwnProperty.call(parsedData, 'permissions')) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Permissions field is required',
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          ok: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        permissions: parsedData.permissions ?? null,
      },
    });

    return NextResponse.json({
      ok: true,
      data: updatedUser,
      message: 'User permissions updated successfully',
    });
  } catch (error) {
    console.error('Error updating user permissions:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Validation error',
          details: error.errors,
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to update user permissions',
      },
      { status: 500 }
    );
  }
}
```

---

## Best Practices

### 1. Security Principles

- **Defense in Depth**: Always validate permissions on both client and server
- **Never Trust Client**: Client-side checks are for UX only; server-side is for security
- **Principle of Least Privilege**: Grant minimum permissions necessary
- **Regular Audits**: Review and audit permissions regularly

### 2. Permission Naming Conventions

- Use consistent format: `{action}_{module}`
- Use lowercase with underscores
- Be specific: `view_projects` not `view`
- Group by module for easier management

### 3. Performance Optimization

- Cache permission checks when possible
- Use database indexes on permission fields (JSONB in PostgreSQL)
- Minimize permission checks in loops
- Consider permission preloading for authenticated users

### 4. Error Handling

- Return clear error messages (but don't leak sensitive info)
- Log permission denials for security monitoring
- Provide user-friendly error messages
- Use appropriate HTTP status codes (401 Unauthorized, 403 Forbidden)

### 5. Testing

- Test all permission combinations
- Test edge cases (null user, missing permissions, etc.)
- Test both client and server-side validation
- Test permission updates and propagation

### 6. Documentation

- Document all available permissions
- Document permission requirements for each route/feature
- Keep permission list up to date
- Document permission assignment workflows

---

## Testing

### Unit Tests for Permission Functions

```typescript
// __tests__/lib/permissions.test.ts

import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessModule,
  canPerformAction,
} from '@/lib/permissions';
import type { User } from '@/types';

describe('Permission Functions', () => {
  const userWithPermissions: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    isActive: true,
    permissions: {
      view_projects: true,
      add_projects: true,
      edit_projects: false,
      view_users: true,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  describe('hasPermission', () => {
    it('should return true for granted permission', () => {
      expect(hasPermission(userWithPermissions, 'view_projects')).toBe(true);
    });

    it('should return false for denied permission', () => {
      expect(hasPermission(userWithPermissions, 'edit_projects')).toBe(false);
    });

    it('should return false for missing permission', () => {
      expect(hasPermission(userWithPermissions, 'delete_projects')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(hasPermission(null, 'view_projects')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    it('should return true if user has at least one permission', () => {
      expect(hasAnyPermission(userWithPermissions, ['view_projects', 'edit_projects'])).toBe(true);
    });

    it('should return false if user has none of the permissions', () => {
      expect(hasAnyPermission(userWithPermissions, ['delete_projects', 'approve_projects'])).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    it('should return true if user has all permissions', () => {
      expect(hasAllPermissions(userWithPermissions, ['view_projects', 'add_projects'])).toBe(true);
    });

    it('should return false if user is missing any permission', () => {
      expect(hasAllPermissions(userWithPermissions, ['view_projects', 'edit_projects'])).toBe(false);
    });
  });

  describe('canAccessModule', () => {
    it('should return true if user can view module', () => {
      expect(canAccessModule(userWithPermissions, 'projects')).toBe(true);
    });

    it('should return false if user cannot view module', () => {
      expect(canAccessModule(userWithPermissions, 'reports')).toBe(false);
    });
  });

  describe('canPerformAction', () => {
    it('should return true for allowed action', () => {
      expect(canPerformAction(userWithPermissions, 'projects', 'add')).toBe(true);
    });

    it('should return false for denied action', () => {
      expect(canPerformAction(userWithPermissions, 'projects', 'edit')).toBe(false);
    });
  });
});
```

### Integration Tests for API Routes

```typescript
// __tests__/api/projects.test.ts

import { GET, POST } from '@/app/api/projects/route';
import { NextRequest } from 'next/server';

describe('Projects API', () => {
  describe('GET /api/projects', () => {
    it('should return 401 for unauthenticated request', async () => {
      const request = new NextRequest('http://localhost/api/projects');
      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });

    it('should return 403 for user without view_projects permission', async () => {
      const request = new NextRequest('http://localhost/api/projects', {
        headers: {
          'x-user-id': 'user-without-permission',
        },
      });
      const response = await GET(request);
      
      expect(response.status).toBe(403);
    });

    it('should return projects for user with view_projects permission', async () => {
      const request = new NextRequest('http://localhost/api/projects', {
        headers: {
          'x-user-id': 'user-with-permission',
        },
      });
      const response = await GET(request);
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
});
```

---

## Migration Guide

### Adding RBAS to Existing Project

#### Step 1: Database Migration

```sql
-- Add permissions column to users table
ALTER TABLE users ADD COLUMN permissions JSONB;

-- Create index for permission queries (PostgreSQL)
CREATE INDEX idx_users_permissions ON users USING GIN (permissions);
```

#### Step 2: Update User Model

```typescript
// Update your User type/interface
export interface User {
  // ... existing fields
  permissions?: UserPermissions;
}
```

#### Step 3: Create Permission Types

```typescript
// types/permissions.ts
// Copy the PermissionKey and UserPermissions types from this guide
```

#### Step 4: Implement Permission Functions

```typescript
// lib/permissions.ts
// Copy all permission checking functions from this guide
```

#### Step 5: Add Route Guards

```typescript
// hooks/use-auth-guard.ts
// Copy the useAuthGuard hook from this guide
```

#### Step 6: Update API Routes

Add permission validation to all protected API routes:

```typescript
// Before
export async function GET(request: NextRequest) {
  // ... existing code
}

// After
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request, ['view_projects']);
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  // ... existing code
}
```

#### Step 7: Update Components

Add permission checks to UI components:

```typescript
// Before
<Button onClick={handleAdd}>Add</Button>

// After
{hasPermission(user, 'add_projects') && (
  <Button onClick={handleAdd}>Add</Button>
)}
```

#### Step 8: Migrate Existing Users

Create a migration script to assign default permissions:

```typescript
// scripts/migrate-permissions.ts

import { prisma } from '@/lib/prisma';

async function migratePermissions() {
  const users = await prisma.user.findMany();
  
  for (const user of users) {
    // Assign default permissions based on role or other criteria
    const defaultPermissions: UserPermissions = {
      view_dashboard: true,
      // ... assign other permissions
    };
    
    await prisma.user.update({
      where: { id: user.id },
      data: { permissions: defaultPermissions },
    });
  }
}

migratePermissions();
```

---

## Common Patterns

### Pattern 1: Permission-Based Feature Flags

```typescript
// Use permissions as feature flags
const canUseAIFeature = hasPermission(user, 'view_ai_assistant');

if (canUseAIFeature) {
  return <AIAssistant />;
}
```

### Pattern 2: Conditional Module Access

```typescript
// Show/hide entire modules based on permissions
{canAccessModule(user, 'projects') && (
  <ProjectsModule />
)}
```

### Pattern 3: Action-Based UI States

```typescript
// Disable buttons instead of hiding them
<Button 
  disabled={!canPerformAction(user, 'projects', 'edit')}
  onClick={handleEdit}
>
  Edit
</Button>
```

### Pattern 4: Permission-Based Data Filtering

```typescript
// Filter data based on permissions
const visibleProjects = projects.filter(project => {
  if (hasPermission(user, 'view_all_projects')) {
    return true;
  }
  return project.ownerId === user.id;
});
```

---

## Troubleshooting

### Issue: Permissions not working

**Checklist:**
1. Verify user has `permissions` field in database
2. Check permission key format matches exactly
3. Ensure permission value is `true` (not string "true")
4. Verify user object is loaded correctly
5. Check both client and server-side validation

### Issue: Route guard infinite redirect

**Solution:**
- Ensure dashboard route doesn't require permissions
- Check that redirect path is not the same as current path
- Verify `hasHydrated` flag is set correctly

### Issue: Performance issues with permission checks

**Solutions:**
- Cache permission checks in component state
- Use database indexes on permission fields
- Preload permissions on authentication
- Minimize permission checks in loops

---

## Conclusion

This guide provides a complete implementation of a Role-Based Access System (RBAS) that can be adapted to any project. The system is:

- **Flexible**: Easy to extend with new modules and permissions
- **Secure**: Validates permissions on both client and server
- **Type-Safe**: Full TypeScript support
- **Performant**: Efficient permission checking
- **Maintainable**: Clear structure and patterns

Remember to:
- Always validate permissions on the server side
- Keep permission lists up to date
- Document permission requirements
- Test thoroughly
- Follow security best practices

For questions or improvements, refer to the codebase examples and adapt them to your specific needs.

