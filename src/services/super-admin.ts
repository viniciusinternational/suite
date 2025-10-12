import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiController } from '@/axios';
import { BASE_URL_API } from '@/config';
import type { Department, DepartmentUnit, Employee, Project } from '@/types';

// Single API instance for super-admin endpoints
const superAdminApi = new ApiController(BASE_URL_API, {
  'Content-Type': 'application/json',
});

// Backend DTOs (local only; do not modify shared types)
interface BackendDepartmentUnit {
  _id: string;
  name: string;
  departmentId: string;
  managerId?: string;
  isActive: boolean;
}

interface BackendDepartment {
  _id: string;
  name: string;
  code: string;
  sector: Department['sector'];
  description?: string;
  isActive: boolean;
  headId?: string;
  units: BackendDepartmentUnit[];
  createdAt?: string;
  updatedAt?: string;
}

// Mappers
const mapDepartmentUnit = (u: BackendDepartmentUnit): DepartmentUnit => ({
  id: u._id,
  name: u.name,
  departmentId: u.departmentId,
  managerId: u.managerId,
  isActive: u.isActive,
});

const mapDepartment = (d: BackendDepartment): Department => ({
  id: d._id,
  name: d.name,
  code: d.code,
  sector: d.sector,
  description: d.description,
  headId: d.headId,
  units: Array.isArray(d.units) ? d.units.map(mapDepartmentUnit) : [],
  isActive: d.isActive,
});

// Queries: Departments
export const useDepartmentsQuery = (params?: { search?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['super-admin', 'departments', params],
    queryFn: async () => {
      const data = await superAdminApi.get<BackendDepartment[]>('super-admin/departments', params);
      return data.map(mapDepartment);
    },
  });
};

export const useDepartmentQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: ['super-admin', 'departments', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const data = await superAdminApi.get<BackendDepartment>(`super-admin/departments/${id}`);
      return mapDepartment(data);
    },
  });
};

// Mutations: Departments
type CreateDepartmentPayload = {
  name: string;
  code: string;
  sector: Department['sector'];
  description?: string;
  headId?: string;
  isActive?: boolean;
};

type UpdateDepartmentPayload = Partial<CreateDepartmentPayload>;

export const useCreateDepartmentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDepartmentPayload) => {
      const data = await superAdminApi.post<BackendDepartment>('super-admin/departments', payload);
      return mapDepartment(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments'] });
    },
  });
};

export const useUpdateDepartmentMutation = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateDepartmentPayload) => {
      const data = await superAdminApi.put<BackendDepartment>(`super-admin/departments/${id}`, payload);
      return mapDepartment(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments', id] });
    },
  });
};

// Flexible update mutation accepting id in variables to avoid defining hooks in handlers
export const useUpdateDepartmentByIdMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; payload: UpdateDepartmentPayload }) => {
      const data = await superAdminApi.put<BackendDepartment>(`super-admin/departments/${vars.id}`, vars.payload);
      return mapDepartment(data);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments', vars.id] });
    },
  });
};

export const useDeleteDepartmentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await superAdminApi.delete<null>(`super-admin/departments/${id}`);
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments'] });
    },
  });
};

// Department Units
type CreateDepartmentUnitPayload = {
  name: string;
  departmentId: string;
  managerId?: string;
  isActive?: boolean;
};

type UpdateDepartmentUnitPayload = Partial<CreateDepartmentUnitPayload>;

export const useAddDepartmentUnitMutation = (departmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDepartmentUnitPayload) => {
      const data = await superAdminApi.post<BackendDepartment>(`super-admin/departments/${departmentId}/units`, payload);
      return mapDepartment(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments', departmentId] });
    },
  });
};

export const useUpdateDepartmentUnitMutation = (departmentId: string, unitId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: UpdateDepartmentUnitPayload) => {
      const data = await superAdminApi.put<BackendDepartment>(`super-admin/departments/${departmentId}/units/${unitId}`, payload);
      return mapDepartment(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments', departmentId] });
    },
  });
};

export const useDeleteDepartmentUnitMutation = (departmentId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unitId: string) => {
      const data = await superAdminApi.delete<BackendDepartment>(`super-admin/departments/${departmentId}/units/${unitId}`);
      return mapDepartment(data);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments', departmentId] });
    },
  });
};

// Flexible unit mutations (accept departmentId/unitId via variables)
export const useAddDepartmentUnitByIdMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { departmentId: string; payload: CreateDepartmentUnitPayload }) => {
      const data = await superAdminApi.post<BackendDepartment>(`super-admin/departments/${vars.departmentId}/units`, vars.payload);
      return mapDepartment(data);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments', vars.departmentId] });
    },
  });
};

export const useUpdateDepartmentUnitByIdMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { departmentId: string; unitId: string; payload: UpdateDepartmentUnitPayload }) => {
      const data = await superAdminApi.put<BackendDepartment>(`super-admin/departments/${vars.departmentId}/units/${vars.unitId}`, vars.payload);
      return mapDepartment(data);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments', vars.departmentId] });
    },
  });
};

export const useDeleteDepartmentUnitByIdMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { departmentId: string; unitId: string }) => {
      const data = await superAdminApi.delete<BackendDepartment>(`super-admin/departments/${vars.departmentId}/units/${vars.unitId}`);
      return mapDepartment(data);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments'] });
      qc.invalidateQueries({ queryKey: ['super-admin', 'departments', vars.departmentId] });
    },
  });
};

// Simple lists for other super-admin areas (kept minimal)
// Employees
export const useEmployeesQuery = (params?: { search?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['super-admin', 'employees', params],
    queryFn: async () => {
      const data = await superAdminApi.get<any[]>('super-admin/employees', params);
      return data.map((e) => ({ id: e._id ?? e.id, ...e })) as Employee[];
    },
  });
};

// Projects
export const useProjectsQuery = (params?: { search?: string; page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['super-admin', 'projects', params],
    queryFn: async () => {
      const data = await superAdminApi.get<any[]>('super-admin/projects', params);
      return data.map((p) => ({ id: p._id ?? p.id, ...p })) as Project[];
    },
  });
};

// Audit Logs (shape not defined; return as-is)
export const useAuditLogsQuery = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['super-admin', 'audit-logs', params],
    queryFn: async () => {
      const data = await superAdminApi.get<any[]>('super-admin/audit-logs', params);
      return data;
    },
  });
};

// System Settings (get/update)
export const useSystemSettingsQuery = () => {
  return useQuery({
    queryKey: ['super-admin', 'system-settings'],
    queryFn: async () => {
      const data = await superAdminApi.get<any>('super-admin/system-settings');
      return data;
    },
  });
};

export const useUpdateSystemSettingsMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const data = await superAdminApi.put<any>('super-admin/system-settings', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['super-admin', 'system-settings'] });
    },
  });
};


