import type { User } from './auth';
import type { Department } from './department';
import type { DepartmentUnit } from './department';

export interface Event {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  link?: string;
  startDateTime: string;
  endDateTime: string;
  endTime?: string | null;
  isAllDay: boolean;
  isGlobal: boolean;
  users?: Pick<User, 'id' | 'fullName' | 'email' | 'role'>[];
  departments?: Pick<Department, 'id' | 'name' | 'code'>[];
  units?: Pick<DepartmentUnit, 'id' | 'name' | 'departmentId'>[];
  createdBy?: Pick<User, 'id' | 'fullName' | 'email'>;
  createdAt?: string;
  updatedAt?: string;
}
