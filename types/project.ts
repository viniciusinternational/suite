import type { User } from './auth';

export interface Approval {
  id: string;
  userId: string;
  addedById?: string;
  level: 'director' | 'ceo';
  status: 'pending' | 'approved' | 'rejected';
  actionDate?: string;
  comments?: string;
  canAddApprovers?: boolean;
  createdAt?: string;
  updatedAt?: string;
  addedBy?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  managerId: string;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number;
  description?: string;
  clientName?: string;
  milestones?: Milestone[];
  tasks?: Task[];
  approvals?: Approval[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  budget: number;
  spent: number;
  createdAt?: string;
  updatedAt?: string;
  tasks?: Task[];
}

export interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  name: string;
  description?: string;
  assigneeId?: string;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt?: string;
  updatedAt?: string;
}
