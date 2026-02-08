'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Plus, Search, Edit, Trash2, MoreHorizontal, CheckCircle } from 'lucide-react';
import axiosClient from '@/lib/axios';
import type { Role } from '@/types';
import { RoleForm, getInitialRoleFormState, type RoleFormState } from '@/components/role/role-form';

export default function RolePermissionsPage() {
  useAuthGuard(['view_roles']);
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState<RoleFormState>(getInitialRoleFormState(null));
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: rolesResponse, isLoading, error } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await axiosClient.get<{ ok: boolean; data: Role[] }>('/roles');
      if (!res.data.ok) throw new Error('Failed to fetch roles');
      return Array.isArray(res.data.data) ? res.data.data : [];
    },
  });

  const roles = Array.isArray(rolesResponse) ? rolesResponse : [];

  const createMutation = useMutation({
    mutationFn: async (data: RoleFormState) => {
      const res = await axiosClient.post<{ ok: boolean; data: Role }>('/roles', {
        name: data.name,
        code: data.code || undefined,
        description: data.description || undefined,
        permissions: data.permissions,
      });
      if (!res.data.ok) throw new Error(res.data?.error || 'Failed to create role');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setFormData(getInitialRoleFormState(null));
      setIsCreateOpen(false);
      setSuccessMessage('Role created successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: RoleFormState }) => {
      const res = await axiosClient.put<{ ok: boolean; data: Role }>(`/roles/${id}`, {
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        permissions: data.permissions,
      });
      if (!res.data.ok) throw new Error(res.data?.error || 'Failed to update role');
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setEditingRole(null);
      setFormData(getInitialRoleFormState(null));
      setSuccessMessage('Role updated successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axiosClient.delete(`/roles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setSuccessMessage('Role deleted successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    },
  });

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.code && r.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isMutating = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleCreateSubmit = () => {
    createMutation.mutate(formData);
  };

  const handleUpdateSubmit = () => {
    if (!editingRole) return;
    updateMutation.mutate({ id: editingRole.id, data: formData });
  };

  const handleDelete = (role: Role) => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      deleteMutation.mutate(role.id);
    }
  };

  const openEdit = (role: Role) => {
    setEditingRole(role);
    setFormData(getInitialRoleFormState(role));
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setFormData(getInitialRoleFormState(null));
  };

  const closeEdit = () => {
    setEditingRole(null);
    setFormData(getInitialRoleFormState(null));
  };

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>Failed to load roles: {(error as Error).message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50">
          <Alert className="bg-green-50 border-green-200 text-green-800 shadow-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Role & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Manage permission templates. Use a role to prefill permissions when creating users.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => !open && closeCreate()}>
          <DialogTrigger asChild>
            <Button onClick={() => setFormData(getInitialRoleFormState(null))} disabled={isMutating}>
              <Plus className="h-4 w-4 mr-2" />
              Add role
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create role</DialogTitle>
              <DialogDescription>
                Create a permission template. Users can copy this role when creating new users.
              </DialogDescription>
            </DialogHeader>
            <RoleForm
              formData={formData}
              setFormData={setFormData}
              onCancel={closeCreate}
              onSubmit={handleCreateSubmit}
              isSubmitting={createMutation.isPending}
              isEdit={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Roles
          </CardTitle>
          <CardDescription>Permission templates available for user creation</CardDescription>
          <div className="pt-2">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground py-8 text-center">Loading roles...</div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-muted-foreground py-8 text-center">
              {searchTerm ? 'No roles match your search.' : 'No roles yet. Create one to get started.'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRoles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{role.name}</p>
                    {(role.code || role.description) && (
                      <p className="text-sm text-muted-foreground">
                        {role.code && <span>{role.code}</span>}
                        {role.code && role.description && ' · '}
                        {role.description}
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(role)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(role)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editingRole} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit role</DialogTitle>
            <DialogDescription>
              Update name, code, description, or permissions for this template.
            </DialogDescription>
          </DialogHeader>
          {editingRole && (
            <RoleForm
              formData={formData}
              setFormData={setFormData}
              onCancel={closeEdit}
              onSubmit={handleUpdateSubmit}
              isSubmitting={updateMutation.isPending}
              isEdit
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
