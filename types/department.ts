export type Sector = 'construction' | 'engineering' | 'legal' | 'administration' | 'consulting' | 'other';

export interface Department {
  id: string;
  name: string;
  code: string;
  headId?: string;
  sector: Sector;
  description?: string;
  units: DepartmentUnit[];
  isActive: boolean;
}

export interface DepartmentUnit {
  id: string;
  name: string;
  departmentId: string;
  managerId?: string;
  isActive: boolean;
}
