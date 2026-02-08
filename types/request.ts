import type { User } from './auth';
import type { Department } from './department';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  vendorId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specifications?: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
}

export interface RequestForm {
  id: string;
  name: string;
  description: string;
  requestedBy: string;
  departmentId: string;
  type: 'office_supplies' | 'equipment' | 'travel' | 'training' | 'other';
  status: 'pending_dept_head' | 'pending_admin_head' | 'approved' | 'rejected';
  requestDate: string;
  items?: Item[];
  amount?: number;
  currency?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  attachments?: string[];
  comments?: RequestComment[];
  approvals: RequestApproval[];
  createdAt?: string;
  updatedAt?: string;
  requestedByUser?: Pick<User, 'id' | 'fullName' | 'email' | 'avatar'>;
  department?: Pick<Department, 'id' | 'name' | 'code'>;
}

export interface RequestApproval {
  id: string;
  requestFormId: string;
  userId: string;
  addedById?: string;
  level: 'dept_head' | 'admin_head';
  status: 'pending' | 'approved' | 'rejected';
  actionDate?: string;
  comments?: string;
  canAddApprovers?: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
  addedBy?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
}

export interface RequestComment {
  id: string;
  requestFormId: string;
  userId: string;
  content: string;
  createdAt?: string;
  updatedAt?: string;
  user?: Pick<User, 'id' | 'fullName' | 'email' | 'avatar'>;
}
