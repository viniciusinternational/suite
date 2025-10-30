# Approval Template System Plan

## Overview
This plan outlines the design and implementation of an approval template system for Request Forms. Templates will allow administrators to pre-configure approval workflows that automatically populate approvers when creating request forms.

## Requirements Analysis

### Core Requirements
1. **Template Selection**: Users can choose from predefined approval templates when creating a request form
2. **Dynamic Approval Population**: Approvals are automatically generated based on the selected template
3. **Flexible Approval Rules**: Support for three types of approval rules:
   - **Department Head (Dynamic)**: Automatically uses the department head of the requester
   - **Multiple Department Heads (Static)**: Pre-select multiple department heads
   - **Multiple Users (Static)**: Pre-select specific users
4. **Approval Sequencing**: Support for approval levels/order (sequential or parallel)
5. **Template Management**: CRUD operations for templates (admin only)

## Database Schema Changes

### 1. Create RequestForm Model
```prisma
model RequestForm {
  id          String   @id @default(cuid())
  name        String
  description String?
  requestedBy String   // User ID of requester
  departmentId String  // Department ID of requester
  type        String   // office_supplies, equipment, travel, training, other
  status      String   @default("pending") // pending_dept_head, pending_admin_head, approved, rejected
  requestDate DateTime @default(now())
  amount      Float?
  currency    String?  @default("USD")
  priority    String?  // low, medium, high, urgent
  category    String?
  attachments String[] // Array of file URLs/paths
  comments    Json?    // Array of comment objects
  templateId  String?  // Reference to the template used
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  requester   User     @relation("RequestFormRequester", fields: [requestedBy], references: [id])
  department  Department @relation(fields: [departmentId], references: [id])
  template    ApprovalTemplate? @relation(fields: [templateId], references: [id])
  approvals   RequestApproval[]
  items       RequestItem[]
  payments    Payment[]

  @@map("request_forms")
}
```

### 2. Create RequestItem Model
```prisma
model RequestItem {
  id            String   @id @default(cuid())
  requestFormId String
  name          String
  description   String?
  vendorId      String?
  quantity      Int
  unitPrice     Float
  totalPrice    Float
  specifications String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  requestForm   RequestForm @relation(fields: [requestFormId], references: [id], onDelete: Cascade)
  vendor        Vendor?     @relation(fields: [vendorId], references: [id])

  @@map("request_items")
}
```

### 3. Create ApprovalTemplate Model
```prisma
model ApprovalTemplate {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)
  isDefault   Boolean  @default(false) // Only one default template
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  rules       ApprovalRule[]
  requestForms RequestForm[]

  @@map("approval_templates")
}
```

### 4. Create ApprovalRule Model
```prisma
model ApprovalRule {
  id          String   @id @default(cuid())
  templateId  String
  type        String   // 'requester_dept_head', 'department_heads', 'users'
  level       Int      // Order/sequence of approval (1, 2, 3, ...)
  isRequired  Boolean  @default(true) // All must approve vs any can approve
  approvalType String  @default("sequential") // sequential, parallel
  
  // For 'department_heads' type - array of department IDs
  departmentIds String[] @default([])
  
  // For 'users' type - array of user IDs
  userIds      String[] @default([])
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  template    ApprovalTemplate @relation(fields: [templateId], references: [id], onDelete: Cascade)

  @@map("approval_rules")
}
```

### 5. Create RequestApproval Model
```prisma
model RequestApproval {
  id          String   @id @default(cuid())
  requestFormId String
  userId      String
  level       Int      // Approval level (from rule)
  ruleId      String?  // Reference to the rule that created this approval
  status      String   @default("pending") // pending, approved, rejected
  actionDate  DateTime?
  comments    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  requestForm RequestForm @relation(fields: [requestFormId], references: [id], onDelete: Cascade)
  user        User        @relation("RequestApprovalUser", fields: [userId], references: [id])

  @@index([requestFormId])
  @@index([userId])
  @@map("request_approvals")
}
```

### 6. Update Existing Models
```prisma
// Update Approval model to support polymorphic relations
model Approval {
  id          String   @id @default(cuid())
  projectId   String?  // Optional - for project approvals
  requestFormId String? // Optional - for request form approvals
  userId      String
  level       String   // director, ceo, or numeric level
  status      String   @default("pending")
  actionDate  String?
  comments    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  project     Project?  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  requestForm RequestForm? @relation(fields: [requestFormId], references: [id], onDelete: Cascade)
  user        User     @relation(fields: [userId], references: [id])

  @@map("approvals")
}

// Update User model
model User {
  // ... existing fields
  requestApprovals RequestApproval[] @relation("RequestApprovalUser")
  requestFormsCreated RequestForm[] @relation("RequestFormRequester")
}

// Add Vendor model if not exists
model Vendor {
  id          String   @id @default(cuid())
  name        String
  email       String?
  phone       String?
  address     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  items       RequestItem[]

  @@map("vendors")
}
```

## Type Definitions

### Approval Rule Types
```typescript
export type ApprovalRuleType = 
  | 'requester_dept_head'  // Dynamic: department head of requester
  | 'department_heads'      // Static: multiple department heads
  | 'users';                // Static: specific users

export type ApprovalFlowType = 
  | 'sequential'  // Must approve in order
  | 'parallel';   // Can approve simultaneously

export interface ApprovalRule {
  id: string;
  templateId: string;
  type: ApprovalRuleType;
  level: number;           // Order in approval chain (1, 2, 3...)
  isRequired: boolean;      // true = all must approve, false = any can approve
  approvalType: ApprovalFlowType;
  departmentIds?: string[]; // For 'department_heads' type
  userIds?: string[];       // For 'users' type
  createdAt?: string;
  updatedAt?: string;
}

export interface ApprovalTemplate {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  rules: ApprovalRule[];
  createdAt?: string;
  updatedAt?: string;
}

// Enhanced RequestApproval interface
export interface RequestApproval {
  id: string;
  requestFormId: string;
  userId: string;
  level: number;
  ruleId?: string;
  status: 'pending' | 'approved' | 'rejected';
  actionDate?: string;
  comments?: string;
  createdAt?: string;
  updatedAt?: string;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
}
```

## Implementation Plan

### Phase 1: Database & Schema Setup
1. **Update Prisma Schema**
   - Add RequestForm model
   - Add RequestItem model
   - Add ApprovalTemplate model
   - Add ApprovalRule model
   - Add RequestApproval model
   - Add Vendor model (if needed)
   - Update User and Department relations

2. **Create Migration**
   - Generate and run Prisma migration
   - Update seed data with sample templates

### Phase 2: Core Service Logic
1. **Template Service** (`src/services/approval-template-service.ts`)
   - `createTemplate()`: Create new approval template
   - `getTemplates()`: List all templates
   - `getTemplate(id)`: Get single template
   - `updateTemplate()`: Update template
   - `deleteTemplate()`: Delete template
   - `setDefaultTemplate()`: Set default template

2. **Approval Resolution Service** (`src/services/approval-resolver.ts`)
   - `resolveApprovers(template, requestForm)`: Resolve actual approvers from template
     - For `requester_dept_head`: Query department head from requester's department
     - For `department_heads`: Use pre-configured department IDs
     - For `users`: Use pre-configured user IDs
   - `createApprovals(requestForm, approvers)`: Create approval records

### Phase 3: API Routes
1. **Templates API** (`src/app/api/approval-templates/route.ts`)
   - `GET /api/approval-templates`: List all templates
   - `POST /api/approval-templates`: Create template

2. **Template by ID** (`src/app/api/approval-templates/[id]/route.ts`)
   - `GET /api/approval-templates/[id]`: Get template
   - `PUT /api/approval-templates/[id]`: Update template
   - `DELETE /api/approval-templates/[id]`: Delete template

3. **Request Forms API** (`src/app/api/requests/route.ts`)
   - `GET /api/requests`: List request forms
   - `POST /api/requests`: Create request form with template
     - Accept `templateId` in payload
     - Resolve approvers from template
     - Create approval records

4. **Request Form by ID** (`src/app/api/requests/[id]/route.ts`)
   - `GET /api/requests/[id]`: Get request form with approvals
   - `PUT /api/requests/[id]`: Update request form
   - `PATCH /api/requests/[id]/approve`: Approve/reject request

### Phase 4: UI Components
1. **Template Management** (Admin Only)
   - `src/components/approval/template-list.tsx`: List all templates
   - `src/components/approval/template-form.tsx`: Create/edit template form
   - `src/components/approval/template-rules-editor.tsx`: Configure approval rules
   - `src/app/(dashboard)/approval-templates/page.tsx`: Template management page

2. **Request Form Enhancement**
   - Update request form component to include template selector
   - Show preview of approvers based on selected template
   - Display approval status/chain

3. **Approval Display**
   - `src/components/approval/approval-chain.tsx`: Visual approval chain
   - `src/components/approval/approval-action.tsx`: Approve/reject component

## Template Resolution Logic

### Example Template Structure
```typescript
{
  name: "Standard Equipment Request",
  rules: [
    {
      type: "requester_dept_head",
      level: 1,
      approvalType: "sequential",
      isRequired: true
    },
    {
      type: "department_heads",
      level: 2,
      departmentIds: ["dept-1", "dept-2"],
      approvalType: "parallel",
      isRequired: true  // Both must approve
    },
    {
      type: "users",
      level: 3,
      userIds: ["user-1", "user-2", "user-3"],
      approvalType: "parallel",
      isRequired: false  // Any one can approve
    }
  ]
}
```

### Resolution Flow
When creating a request form:
1. User selects a template (or uses default)
2. System loads template rules
3. For each rule:
   - **requester_dept_head**: Query `Department.headId` from requester's `departmentId`
   - **department_heads**: Query all users where `User.id IN (department.headId for each deptId)`
   - **users**: Use provided `userIds` directly
4. Create `RequestApproval` records for each resolved approver
5. Set initial status to "pending"
6. Determine overall request status based on approval flow

## Status Flow Logic

### Request Form Status
- `pending`: Waiting for approvals (default)
- `pending_dept_head`: Waiting for department head approval (if applicable)
- `pending_admin_head`: Waiting for admin/director approval
- `approved`: All required approvals received
- `rejected`: Any approval rejected

### Approval Status Determination
```typescript
function determineRequestStatus(approvals: RequestApproval[]): string {
  const rejected = approvals.find(a => a.status === 'rejected');
  if (rejected) return 'rejected';
  
  // Check sequential requirements
  const levels = approvals.map(a => a.level).sort((a, b) => a - b);
  for (const level of levels) {
    const levelApprovals = approvals.filter(a => a.level === level);
    const requiredApprovals = levelApprovals.filter(a => a.rule?.isRequired);
    
    if (requiredApprovals.length > 0) {
      const allApproved = requiredApprovals.every(a => a.status === 'approved');
      if (!allApproved && requiredApprovals.some(a => a.status === 'pending')) {
        return `pending_level_${level}`;
      }
    }
  }
  
  // All required approvals complete
  return 'approved';
}
```

## Security & Permissions

1. **Template Management**
   - Only admins/directors can create/edit/delete templates
   - Regular users can only view active templates

2. **Approval Actions**
   - Users can only approve requests assigned to them
   - Department heads can approve requests from their department
   - Admins can view all approvals

## Testing Considerations

1. **Unit Tests**
   - Approval resolver logic
   - Status determination logic
   - Template CRUD operations

2. **Integration Tests**
   - Request form creation with template
   - Approval flow execution
   - Status updates

3. **Edge Cases**
   - Department without head
   - Deleted user in template
   - Deleted department in template
   - Multiple templates with same name

## Migration Strategy

1. Create new models alongside existing Approval model
2. Migrate existing approval logic if any exists for requests
3. Create default templates
4. Update request form creation flows to use templates
5. Deprecate old approval system once migration complete

## Next Steps

1. Review and approve this plan
2. Start with Phase 1 (Database & Schema)
3. Implement Phase 2 (Core Services)
4. Build API routes (Phase 3)
5. Create UI components (Phase 4)
6. Testing and refinement

