import type { User } from './auth';
import type { Task } from './project';

export interface Team {
  id: string;
  title: string;
  purpose?: string;
  leaderId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  leader?: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'avatar'>;
  users?: Pick<User, 'id' | 'fullName' | 'email' | 'role' | 'avatar' | 'position'>[];
  tasks?: Pick<Task, 'id' | 'name' | 'status' | 'priority' | 'dueDate' | 'projectId'>[];
}
