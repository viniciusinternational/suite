# Create User Implementation - Zitadel Users

This document describes the implementation for creating users from Zitadel authentication system.

## Overview

The user creation flow involves:
1. Fetching available users from Zitadel
2. Selecting a Zitadel user
3. Creating a user profile in the application database with additional information

## Endpoints

### 1. Fetch Zitadel Users

**Endpoint:** `GET /api/users/zitadel`

**Query Parameters:**
- `search` (optional): Search query to filter users by name, email, or username
- `limit` (optional): Maximum number of results (default: 50)

**Response:**
```json
{
  "ok": true,
  "data": [
    {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "displayName": "string",
      "preferredUsername": "string",
      "state": "string"
    }
  ]
}
```

**Example Request:**
```bash
GET /api/users/zitadel?search=john&limit=50
```

---

### 2. Create User

**Endpoint:** `POST /api/users`

**Headers:**
- `Content-Type: application/json`
- `x-user-id`: Current user ID (for audit logging)
- `x-user-fullname`: Current user full name
- `x-user-email`: Current user email
- `x-user-role`: Current user role
- `x-user-department-id`: Current user department ID (optional)

**Request Body:**

```typescript
{
  id?: string;                    // Zitadel user ID (optional - will be auto-generated if not provided)
  firstName: string;              // Required, minimum 1 character
  lastName: string;               // Required, minimum 1 character
  fullName: string;               // Required, minimum 1 character
  email: string;                  // Required, valid email format
  phone: string;                  // Required, minimum 1 character
  dob: string;                    // Required, date format (YYYY-MM-DD)
  gender: string;                 // Required, one of: "Male", "Female", "Other"
  role: string;                   // Required, one of:
                                  //   - "super_admin"
                                  //   - "managing_director"
                                  //   - "department_head"
                                  //   - "hr_manager"
                                  //   - "administrator"
                                  //   - "accountant"
                                  //   - "employee"
  departmentId?: string;          // Optional, department ID
  employeeId?: string;            // Optional, employee ID
  position: string;               // Required, minimum 1 character
  hireDate: string;               // Required, date format (YYYY-MM-DD)
  salary: number;                 // Required, positive number
  avatar?: string;                // Optional, avatar URL
  permissions?: Record<string, boolean>;  // Optional, key-value pairs of permission flags
  isActive?: boolean;             // Optional, defaults to true
}
```

**Example Request:**
```json
{
  "id": "zitadel-user-id-123",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "dob": "1990-01-15",
  "gender": "Male",
  "role": "employee",
  "departmentId": "dept-123",
  "employeeId": "EMP-001",
  "position": "Software Engineer",
  "hireDate": "2024-01-01",
  "salary": 75000,
  "permissions": {
    "view_documents": true,
    "edit_documents": false,
    "manage_users": false
  },
  "isActive": true
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "id": "generated-user-id",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "dob": "1990-01-15",
    "gender": "Male",
    "role": "employee",
    "departmentId": "dept-123",
    "employeeId": "EMP-001",
    "position": "Software Engineer",
    "hireDate": "2024-01-01",
    "salary": 75000,
    "avatar": null,
    "permissions": {
      "view_documents": true,
      "edit_documents": false,
      "manage_users": false
    },
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "User created successfully"
}
```

**Error Responses:**

1. **Validation Error (400):**
```json
{
  "ok": false,
  "error": "Validation error",
  "details": [
    {
      "path": ["email"],
      "message": "Invalid email address"
    }
  ]
}
```

2. **Email Already Exists (400):**
```json
{
  "ok": false,
  "error": "User with this email already exists"
}
```

3. **Department Not Found (400):**
```json
{
  "ok": false,
  "error": "Department not found"
}
```

4. **Server Error (500):**
```json
{
  "ok": false,
  "error": "Failed to create user"
}
```

---

## Data Structures

### ZitadelUser

Type definition for users fetched from Zitadel:

```typescript
interface ZitadelUser {
  id: string;                    // Zitadel user ID
  email: string;                 // User email
  firstName: string;             // First name
  lastName: string;              // Last name
  displayName: string;           // Display name
  preferredUsername?: string;    // Preferred username
  state?: string;                // User state
}
```

### User (Created User)

Type definition for users in the application database:

```typescript
interface User {
  id: string;                    // Generated user ID (CUID)
  firstName: string;             // First name
  lastName: string;              // Last name
  fullName: string;              // Full name
  phone: string;                 // Phone number
  dob: string;                   // Date of birth (ISO string)
  gender: string;                // Gender
  email: string;                 // Email address
  role: UserRole;                // User role (see roles below)
  departmentId?: string;         // Department ID (optional)
  employeeId?: string;           // Employee ID (optional)
  position: string;              // Job position
  hireDate: string;              // Hire date (ISO string)
  salary: number;                // Annual salary
  avatar?: string;               // Avatar URL (optional)
  permissions?: Record<string, boolean>;  // Permissions object
  isActive: boolean;             // Active status
  createdAt: string;             // Creation timestamp (ISO string)
  updatedAt: string;             // Last update timestamp (ISO string)
}
```

### UserRole

Available user roles:

```typescript
type UserRole = 
  | 'super_admin'
  | 'managing_director'
  | 'department_head'
  | 'hr_manager'
  | 'administrator'
  | 'accountant'
  | 'employee';
```

---

## Implementation Flow

### Frontend Flow

1. **Select Zitadel User:**
   - User navigates to `/users/new`
   - `ZitadelUserSelector` component fetches available Zitadel users via `GET /api/users/zitadel`
   - User selects a Zitadel user from the list
   - Form fields (firstName, lastName, fullName, email) are auto-populated from Zitadel user data

2. **Fill User Details:**
   - User completes required fields:
     - Personal information (phone, dob, gender)
     - Employment information (department, role, position, employeeId, hireDate, salary)
   - User configures permissions (optional)

3. **Submit Form:**
   - Form validation using Zod schema
   - `useCreateUser` hook calls `POST /api/users` with complete user data
   - Zitadel user ID is included in the request body
   - On success, redirect to `/users`

### Backend Flow

1. **Validate Request:**
   - Parse and validate request body using Zod schema
   - Check if user with email already exists
   - Validate department ID if provided

2. **Create User:**
   - Insert user record into database
   - User ID is auto-generated (CUID) if not provided
   - Default `isActive` to `true` if not specified

3. **Audit Logging:**
   - Create audit log entry with user creation details
   - Include IP address and user agent from request headers

4. **Return Response:**
   - Format DateTime fields to ISO strings
   - Return created user data

---

## Frontend Hooks

### useCreateUser()

React Query mutation hook for creating users:

```typescript
const createUser = useCreateUser();

// Usage
await createUser.mutateAsync({
  id: selectedZitadelUser.id,
  firstName: 'John',
  lastName: 'Doe',
  // ... other fields
});
```

**Auto-invalidates:**
- `['users']` query cache after successful creation

### useZitadelUsers()

React Query hook for fetching Zitadel users:

```typescript
const { data: zitadelUsers, isLoading } = useZitadelUsers('search term');
```

**Query Key:** `['zitadel-users', search]`

---

## Validation Rules

- **firstName**: Required, minimum 1 character
- **lastName**: Required, minimum 1 character
- **fullName**: Required, minimum 1 character
- **email**: Required, valid email format, must be unique
- **phone**: Required, minimum 1 character
- **dob**: Required, valid date string
- **gender**: Required, one of: "Male", "Female", "Other"
- **role**: Required, must be one of the defined roles
- **position**: Required, minimum 1 character
- **hireDate**: Required, valid date string
- **salary**: Required, must be a positive number
- **departmentId**: Optional, must exist in database if provided
- **employeeId**: Optional
- **permissions**: Optional, key-value pairs where values are booleans
- **isActive**: Optional, defaults to `true`

---

## Related Files

- **API Route:** `app/api/users/route.ts`
- **Zitadel API Route:** `app/api/users/zitadel/route.ts`
- **Frontend Hook:** `hooks/use-users.ts`
- **User Creation Page:** `app/(dashboard)/users/new/page.tsx`
- **Zitadel User Selector:** `components/user/zitadel-user-selector.tsx`
- **Types:** `types/index.ts`

