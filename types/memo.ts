import type { User } from './auth';
import type { Department } from './department';

export interface Memo {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isActive: boolean;
  isGlobal?: boolean;
  expiresAt?: string;
  users?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>[];
  departments?: Pick<Department, 'id' | 'name' | 'code'>[];
  createdBy?: Pick<User, 'id' | 'fullName' | 'email'>;
  createdAt?: string;
  updatedAt?: string;
}
