# Authentication and Permission System Guide

This document provides a high-level guide for implementing an authentication and permission system similar to this application.

## Overview

The system uses a **hybrid authentication approach** combining external identity provider authentication with local user management and granular permission-based authorization.

---

## Authentication Flow

### 1. Login Process

1. **User initiates login** → Redirects to external authentication provider
2. **External provider authenticates** → Returns JWT token and refresh token via callback URL
3. **Extract user identifier** → Decode token to get email/user identifier
4. **Local user lookup** → Query local database to find user by email
5. **Validation checks:**
   - User must exist in local database
   - User account must be active (`isActive === true`)
6. **Store authentication state:**
   - Store JWT token and refresh token
   - Store user object in client state
   - Mark user as authenticated
7. **Redirect to application** → Navigate to dashboard/home

#### Code Example: Authentication Callback Handler

```typescript
// app/auth/callback/page.tsx
import { jwtDecode } from 'jwt-decode';
import { useAuthStore } from '@/store';

const handleAuthCallback = async () => {
  // 1. Get token from URL parameters
  const token = searchParams.get('token');
  const refreshToken = searchParams.get('refresh_token');
  
  if (!token) {
    setError('No authentication token received');
    return;
  }

  // 2. Decode token to extract user identifier
  const decodedToken = jwtDecode(token);
  const email = decodedToken.email || decodedToken.sub;
  
  if (!email) {
    setError('Email not found in token');
    return;
  }

  // 3. Lookup user in local database
  const response = await fetch(`/api/users?email=${encodeURIComponent(email)}`);
  const result = await response.json();
  
  if (!result.ok || !result.data) {
    // User not found - deny access
    setIsNoPermission(true);
    logout();
    return;
  }

  const dbUser = result.data;

  // 4. Validate user is active
  if (!dbUser.isActive) {
    setError('Your account has been deactivated');
    return;
  }

  // 5. Store authentication state
  setToken(token, refreshToken || '');
  setAuthenticated(true);
  setUser(dbUser);
  setCurrentAccount({
    _id: dbUser.id,
    email: dbUser.email,
    name: dbUser.fullName,
  });

  // 6. Redirect to dashboard
  router.push('/dashboard');
};
```

### 2. Authentication State Management

- **Client-side storage**: Use persistent storage (localStorage/sessionStorage) to maintain auth state
- **State includes:**
  - User object
  - Authentication tokens (access + refresh)
  - Authentication status flag
  - Current account information

#### Code Example: Auth Store Setup

```typescript
// store/auth-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  refreshToken: string | null;
  currentAccount: CurrentAccount | null;
  hasHydrated: boolean;
  setUser: (user: User) => void;
  setToken: (token: string, refreshToken?: string) => void;
  setAuthenticated: (authenticated: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      currentAccount: null,
      hasHydrated: false,
      setUser: (user) => set({ user }),
      setToken: (token, refreshToken) => set({ token, refreshToken }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      logout: () => set({
        user: null,
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        currentAccount: null,
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
        currentAccount: state.currentAccount,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
```

### 3. Logout Process

- Clear all stored authentication data
- Clear user state
- Redirect to login page

---

## Permission System

### Core Concepts

The permission system is **granular and module-based**, using a simple key-value structure.

#### Permission Structure

- **Format**: `{action}_{module}`
- **Examples**: 
  - `view_projects`
  - `add_users`
  - `edit_documents`
  - `delete_requests`
  - `approve_payments`

#### Permission Storage

- Permissions are stored as a **JSON object** on the user entity
- Each permission key maps to a boolean value (`true` = granted, `false` or missing = denied)
- Example structure:
  ```json
  {
    "view_dashboard": true,
    "view_projects": true,
    "add_projects": true,
    "edit_projects": false,
    "delete_projects": false
  }
  ```

### Permission Actions

Common actions across modules:
- `view` - Read/access module
- `add` - Create new items
- `edit` - Modify existing items
- `delete` - Remove items
- `approve` - Approve/authorize actions (module-specific)

### Permission Checking

The system provides multiple permission check functions:

1. **Single Permission Check**
   - Check if user has a specific permission
   - Returns `true` if permission exists and is `true`

2. **Any Permission Check**
   - Check if user has at least one of the specified permissions
   - Useful for OR logic: "user needs view OR edit permission"

3. **All Permissions Check**
   - Check if user has all of the specified permissions
   - Useful for AND logic: "user needs both view AND edit permissions"

4. **Module Access Check**
   - Check if user can access a module (checks for `view_{module}` permission)

5. **Action Check**
   - Check if user can perform a specific action on a module
   - Example: `canPerformAction(user, 'projects', 'add')` checks for `add_projects`

#### Code Example: Permission Check Functions

```typescript
// lib/permissions.ts
import type { User, PermissionKey, UserPermissions } from '@/types';

// Get user's permissions object
export function getUserPermissions(user: User | null): UserPermissions {
  if (!user || !user.permissions) {
    return {} as UserPermissions;
  }
  return user.permissions;
}

// Check if user has a specific permission
export function hasPermission(user: User | null, permission: PermissionKey): boolean {
  if (!user || !user.permissions) {
    return false;
  }
  return user.permissions[permission] === true;
}

// Check if user has any of the specified permissions (OR logic)
export function hasAnyPermission(user: User | null, permissions: PermissionKey[]): boolean {
  if (!user || !user.permissions || permissions.length === 0) {
    return false;
  }
  return permissions.some(permission => user.permissions?.[permission] === true);
}

// Check if user has all of the specified permissions (AND logic)
export function hasAllPermissions(user: User | null, permissions: PermissionKey[]): boolean {
  if (!user || !user.permissions || permissions.length === 0) {
    return false;
  }
  return permissions.every(permission => user.permissions?.[permission] === true);
}

// Check if user can access a module
export function canAccessModule(user: User | null, module: string): boolean {
  const viewPermission = `view_${module}` as PermissionKey;
  return hasPermission(user, viewPermission);
}

// Check if user can perform an action on a module
export function canPerformAction(
  user: User | null,
  module: string,
  action: 'view' | 'add' | 'edit' | 'delete' | 'approve'
): boolean {
  const permission = `${action}_${module}` as PermissionKey;
  return hasPermission(user, permission);
}
```

### Permission Functions Usage Table

| Function | Parameters | Returns | Use Case | Example |
|----------|-----------|---------|----------|---------|
| `getUserPermissions` | `user: User \| null` | `UserPermissions` | Get all permissions object | `const perms = getUserPermissions(user)` |
| `hasPermission` | `user: User \| null`, `permission: PermissionKey` | `boolean` | Check single permission | `hasPermission(user, 'view_projects')` |
| `hasAnyPermission` | `user: User \| null`, `permissions: PermissionKey[]` | `boolean` | OR logic - user needs at least one | `hasAnyPermission(user, ['view_projects', 'edit_projects'])` |
| `hasAllPermissions` | `user: User \| null`, `permissions: PermissionKey[]` | `boolean` | AND logic - user needs all | `hasAllPermissions(user, ['view_projects', 'edit_projects'])` |
| `canAccessModule` | `user: User \| null`, `module: string` | `boolean` | Check if user can view a module | `canAccessModule(user, 'projects')` |
| `canPerformAction` | `user: User \| null`, `module: string`, `action: 'view' \| 'add' \| 'edit' \| 'delete' \| 'approve'` | `boolean` | Check action on module | `canPerformAction(user, 'projects', 'add')` |

### Common Permission Patterns

| Pattern | Function to Use | Example |
|---------|----------------|---------|
| Show/hide button | `hasPermission` | `{hasPermission(user, 'add_projects') && <Button>Add</Button>}` |
| Show/hide navigation item | `canAccessModule` | `{canAccessModule(user, 'projects') && <NavLink>Projects</NavLink>}` |
| Enable/disable action | `canPerformAction` | `<Button disabled={!canPerformAction(user, 'projects', 'edit')}>Edit</Button>` |
| Route requires any permission | `hasAnyPermission` | `useAuthGuard(['view_projects', 'view_reports'])` |
| Route requires all permissions | `hasAllPermissions` | `if (hasAllPermissions(user, ['view_projects', 'edit_projects']))` |
| Conditional feature access | `hasPermission` | `{hasPermission(user, 'view_ai_assistant') && <AIAssistant />}` |

### Permission Key Format Reference

| Format | Pattern | Examples |
|--------|---------|----------|
| View permission | `view_{module}` | `view_projects`, `view_users`, `view_dashboard` |
| Add permission | `add_{module}` | `add_projects`, `add_users`, `add_documents` |
| Edit permission | `edit_{module}` | `edit_projects`, `edit_users`, `edit_settings` |
| Delete permission | `delete_{module}` | `delete_projects`, `delete_users`, `delete_documents` |
| Approve permission | `approve_{module}` | `approve_projects`, `approve_requests`, `approve_payments` |
| Special permissions | `{action}_{module}` | `view_audit_logs`, `manage_approvers`, `add_approvers` |

---

## Authorization Flow

### Route Protection

1. **Authentication Check** (first)
   - Verify user is authenticated
   - If not authenticated → redirect to login

2. **Permission Check** (if required)
   - Check if route/component requires specific permissions
   - If user lacks required permissions → redirect to dashboard/home
   - If user has permissions → allow access

### Implementation Pattern

```
1. Check if user is authenticated
   └─ No → Redirect to login
   └─ Yes → Continue

2. Check if route requires permissions
   └─ No → Allow access
   └─ Yes → Check user permissions
       └─ Missing → Redirect to dashboard
       └─ Has → Allow access
```

#### Code Example: Route Guard Hook

```typescript
// hooks/use-auth-guard.ts
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store';
import { hasAnyPermission } from '@/lib/permissions';
import type { PermissionKey } from '@/types';

export function useAuthGuard(requiredPermissions?: PermissionKey[]) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, hasHydrated } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for hydration to complete
    if (!hasHydrated) {
      return;
    }

    // 1. Check authentication
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }

    // 2. Check permissions if required
    if (requiredPermissions && requiredPermissions.length > 0) {
      if (!hasAnyPermission(user, requiredPermissions)) {
        // User doesn't have required permissions
        if (pathname !== '/dashboard') {
          router.push('/dashboard');
          return;
        }
      }
    }

    // User is authenticated and authorized
    setIsChecking(false);
  }, [isAuthenticated, user, hasHydrated, router, requiredPermissions, pathname]);

  return { isChecking, user };
}

// Usage in a page component:
export default function ProjectsPage() {
  const { isChecking, user } = useAuthGuard(['view_projects']);
  
  if (isChecking) {
    return <LoadingSpinner />;
  }
  
  return <ProjectsContent />;
}
```

---

## Key Design Principles

1. **Separation of Concerns**
   - Authentication (who you are) is separate from Authorization (what you can do)
   - External provider handles identity verification
   - Local system handles authorization

2. **Granular Permissions**
   - Fine-grained control per module and action
   - Permissions are independent (not hierarchical)
   - Flexible assignment per user

3. **Client-Side State**
   - Authentication state persists in client storage
   - Permissions checked on client-side for UI rendering
   - Server-side validation should also be implemented for API routes

4. **User Status**
   - Active status check prevents disabled users from accessing system
   - Must be validated during authentication flow

---

## Implementation Checklist

### Authentication
- [ ] External auth provider integration
- [ ] Token handling (JWT decode, storage)
- [ ] User lookup by identifier (email)
- [ ] Active user validation
- [ ] Client-side state management
- [ ] Logout functionality

### Permissions
- [ ] Permission data structure (JSON object on user)
- [ ] Permission check functions (single, any, all)
- [ ] Module access checks
- [ ] Action-based permission checks

### Authorization
- [ ] Route guards (authentication + permission checks)
- [ ] Component-level permission checks
- [ ] Redirect logic for unauthorized access
- [ ] Server-side permission validation (for API routes)

---

## Usage Examples

### Example 1: Component-Level Permission Check

```typescript
// components/projects/project-list.tsx
import { useAuthStore } from '@/store';
import { hasPermission } from '@/lib/permissions';

export function ProjectList() {
  const { user } = useAuthStore();
  
  return (
    <div>
      <h1>Projects</h1>
      {hasPermission(user, 'add_projects') && (
        <button onClick={handleAddProject}>Add Project</button>
      )}
      {projects.map(project => (
        <div key={project.id}>
          <h2>{project.name}</h2>
          {hasPermission(user, 'edit_projects') && (
            <button onClick={() => handleEdit(project)}>Edit</button>
          )}
          {hasPermission(user, 'delete_projects') && (
            <button onClick={() => handleDelete(project)}>Delete</button>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Conditional Rendering Based on Permissions

```typescript
// components/navigation/sidebar.tsx
import { canAccessModule } from '@/lib/permissions';

export function Sidebar() {
  const { user } = useAuthStore();
  
  return (
    <nav>
      {canAccessModule(user, 'dashboard') && (
        <NavLink href="/dashboard">Dashboard</NavLink>
      )}
      {canAccessModule(user, 'projects') && (
        <NavLink href="/projects">Projects</NavLink>
      )}
      {canAccessModule(user, 'users') && (
        <NavLink href="/users">Users</NavLink>
      )}
      {canAccessModule(user, 'reports') && (
        <NavLink href="/reports">Reports</NavLink>
      )}
    </nav>
  );
}
```

### Example 3: Action-Based Permission Check

```typescript
// components/documents/document-actions.tsx
import { canPerformAction } from '@/lib/permissions';

export function DocumentActions({ document }) {
  const { user } = useAuthStore();
  
  const canEdit = canPerformAction(user, 'documents', 'edit');
  const canDelete = canPerformAction(user, 'documents', 'delete');
  const canApprove = canPerformAction(user, 'documents', 'approve');
  
  return (
    <div>
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
      {canApprove && <ApproveButton />}
    </div>
  );
}
```

### Example 4: Multiple Permission Requirements

```typescript
// Require user to have ANY of these permissions (OR logic)
const { isChecking } = useAuthGuard(['view_projects', 'view_reports']);

// Require user to have ALL of these permissions (AND logic)
import { hasAllPermissions } from '@/lib/permissions';

if (hasAllPermissions(user, ['view_projects', 'edit_projects'])) {
  // User can both view and edit projects
}
```

---

## Notes

- This system uses **role-based user types** (admin, employee, etc.) but authorization is primarily **permission-based**
- Permissions can be updated independently of user roles
- The permission system is **generic** and can be extended with new modules/actions as needed
- Always validate permissions on both client and server side for security
- Use `hasAnyPermission` for OR logic (user needs at least one permission)
- Use `hasAllPermissions` for AND logic (user needs all permissions)
