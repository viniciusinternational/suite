'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Code } from 'lucide-react';

interface PermissionsEditorProps {
  value?: Record<string, boolean>;
  onChange: (permissions: Record<string, boolean>) => void;
}

const MODULE_PERMISSIONS = [
  { module: 'Dashboard', permissions: [{ key: 'view_dashboard', label: 'View Dashboard' }] },
  {
    module: 'Events',
    permissions: [
      { key: 'view_events', label: 'View Events' },
      { key: 'add_events', label: 'Add Events' },
      { key: 'edit_events', label: 'Edit Events' },
      { key: 'delete_events', label: 'Delete Events' },
    ],
  },
  {
    module: 'Projects',
    permissions: [
      { key: 'view_projects', label: 'View Projects' },
      { key: 'add_projects', label: 'Add Projects' },
      { key: 'edit_projects', label: 'Edit Projects' },
      { key: 'delete_projects', label: 'Delete Projects' },
      { key: 'approve_projects', label: 'Approve Projects' },
    ],
  },
  {
    module: 'Users',
    permissions: [
      { key: 'view_users', label: 'View Users' },
      { key: 'add_users', label: 'Add Users' },
      { key: 'edit_users', label: 'Edit Users' },
      { key: 'delete_users', label: 'Delete Users' },
    ],
  },
  {
    module: 'Departments',
    permissions: [
      { key: 'view_departments', label: 'View Departments' },
      { key: 'add_departments', label: 'Add Departments' },
      { key: 'edit_departments', label: 'Edit Departments' },
      { key: 'delete_departments', label: 'Delete Departments' },
    ],
  },
  {
    module: 'Requests',
    permissions: [
      { key: 'view_requests', label: 'View Requests' },
      { key: 'add_requests', label: 'Add Requests' },
      { key: 'edit_requests', label: 'Edit Requests' },
      { key: 'delete_requests', label: 'Delete Requests' },
      { key: 'approve_requests', label: 'Approve Requests' },
    ],
  },
  {
    module: 'Payments',
    permissions: [
      { key: 'view_payments', label: 'View Payments' },
      { key: 'add_payments', label: 'Add Payments' },
      { key: 'edit_payments', label: 'Edit Payments' },
      { key: 'delete_payments', label: 'Delete Payments' },
      { key: 'approve_payments', label: 'Approve Payments' },
    ],
  },
  {
    module: 'Accounts',
    permissions: [
      { key: 'view_accounts', label: 'View Accounts' },
      { key: 'create_accounts', label: 'Create Accounts' },
      { key: 'edit_accounts', label: 'Edit Accounts' },
      { key: 'manage_accounts', label: 'Manage Accounts' },
    ],
  },
  {
    module: 'Payroll',
    permissions: [
      { key: 'view_payroll', label: 'View Payroll' },
      { key: 'add_payroll', label: 'Add Payroll' },
      { key: 'edit_payroll', label: 'Edit Payroll' },
      { key: 'delete_payroll', label: 'Delete Payroll' },
    ],
  },
  {
    module: 'Leave',
    permissions: [
      { key: 'view_leave', label: 'View Leave' },
      { key: 'add_leave', label: 'Add Leave' },
      { key: 'edit_leave', label: 'Edit Leave' },
      { key: 'delete_leave', label: 'Delete Leave' },
      { key: 'approve_leave', label: 'Approve Leave' },
    ],
  },
  { module: 'Reports', permissions: [{ key: 'view_reports', label: 'View Reports' }] },
  { module: 'Audit Logs', permissions: [{ key: 'view_audit_logs', label: 'View Audit Logs' }] },
  {
    module: 'Approvals',
    permissions: [
      { key: 'view_approvals', label: 'View Approvals' },
      { key: 'approve_approvals', label: 'Approve Approvals' },
      { key: 'add_approvers', label: 'Add Approvers' },
      { key: 'manage_approvers', label: 'Manage Approvers' },
    ],
  },
  {
    module: 'Settings',
    permissions: [
      { key: 'view_settings', label: 'View Settings' },
      { key: 'edit_settings', label: 'Edit Settings' },
    ],
  },
  {
    module: 'Team',
    permissions: [
      { key: 'view_team', label: 'View Team' },
      { key: 'edit_team', label: 'Edit Team' },
    ],
  },
  {
    module: 'Timesheets',
    permissions: [
      { key: 'view_timesheets', label: 'View Timesheets' },
      { key: 'add_timesheets', label: 'Add Timesheets' },
      { key: 'edit_timesheets', label: 'Edit Timesheets' },
      { key: 'delete_timesheets', label: 'Delete Timesheets' },
    ],
  },
  {
    module: 'Performance',
    permissions: [
      { key: 'view_performance', label: 'View Performance' },
      { key: 'add_performance', label: 'Add Performance' },
      { key: 'edit_performance', label: 'Edit Performance' },
      { key: 'delete_performance', label: 'Delete Performance' },
    ],
  },
  {
    module: 'Memos',
    permissions: [
      { key: 'view_memos', label: 'View Memos' },
      { key: 'add_memos', label: 'Add Memos' },
      { key: 'edit_memos', label: 'Edit Memos' },
      { key: 'delete_memos', label: 'Delete Memos' },
    ],
  },
  {
    module: 'Documents',
    permissions: [
      { key: 'view_documents', label: 'View Documents' },
      { key: 'add_documents', label: 'Add Documents' },
      { key: 'edit_documents', label: 'Edit Documents' },
      { key: 'delete_documents', label: 'Delete Documents' },
    ],
  },
  {
    module: 'Role & Permissions',
    permissions: [
      { key: 'view_roles', label: 'View Roles' },
      { key: 'add_roles', label: 'Add Roles' },
      { key: 'edit_roles', label: 'Edit Roles' },
      { key: 'delete_roles', label: 'Delete Roles' },
    ],
  },
  { module: 'AI Assistant', permissions: [{ key: 'view_ai_assistant', label: 'Access AI Assistant' }] },
];

export function PermissionsEditor({ value = {}, onChange }: PermissionsEditorProps) {
  const [simpleMode, setSimpleMode] = useState(true);
  const [jsonMode, setJsonMode] = useState(() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return '{}';
    }
  });

  const handlePermissionToggle = (key: string, enabled: boolean) => {
    onChange({ ...value, [key]: enabled });
  };

  const handleSegmentSelectAll = (permissions: { key: string }[], checked: boolean) => {
    const next = { ...value };
    permissions.forEach(({ key }) => {
      next[key] = checked;
    });
    onChange(next);
  };

  const handleJsonChange = (newJson: string) => {
    setJsonMode(newJson);
    try {
      const parsed = JSON.parse(newJson);
      if (typeof parsed === 'object' && parsed !== null) {
        onChange(parsed);
      }
    } catch {
      // Invalid JSON, ignore
    }
  };

  const syncToJson = () => {
    try {
      setJsonMode(JSON.stringify(value, null, 2));
    } catch {
      setJsonMode('{}');
    }
  };

  return (
    <Tabs value={simpleMode ? 'simple' : 'advanced'} onValueChange={(v) => setSimpleMode(v === 'simple')}>
      <TabsList className="grid w-full grid-cols-2 h-8">
        <TabsTrigger value="simple" className="text-xs">
          <Settings className="h-3.5 w-3.5 mr-1.5" />
          Simple
        </TabsTrigger>
        <TabsTrigger value="advanced" className="text-xs">
          <Code className="h-3.5 w-3.5 mr-1.5" />
          JSON
        </TabsTrigger>
      </TabsList>

      <TabsContent value="simple" className="mt-2">
        <div className="grid grid-cols-1 border border-border sm:grid-cols-2 lg:grid-cols-3">
          {MODULE_PERMISSIONS.map(({ module: category, permissions }) => {
            const keys = permissions.map((p) => p.key);
            const checkedCount = keys.filter((k) => value[k]).length;
            const allChecked = checkedCount === keys.length;
            const someChecked = checkedCount > 0;
            return (
              <div
                key={category}
                className="min-w-0 border-b border-r border-border pl-2 pr-3 pt-1.5 pb-3 [&:nth-child(2n)]:sm:border-r-0 [&:nth-child(3n)]:lg:border-r-0"
              >
                <label className="mb-1 flex cursor-pointer items-center gap-2 border-b border-border pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Checkbox
                    checked={allChecked ? true : someChecked ? 'indeterminate' : false}
                    onCheckedChange={(checked) =>
                      handleSegmentSelectAll(permissions, checked === true)
                    }
                    aria-label={`Select all ${category}`}
                  />
                  <span>{category}</span>
                </label>
                <div className="grid grid-cols-1 gap-0.5 pt-0.5">
                  {permissions.map(({ key, label }) => (
                    <label
                      key={key}
                      className="flex cursor-pointer items-center gap-2 py-0.5 text-sm hover:text-foreground"
                    >
                      <Checkbox
                        checked={value[key] ?? false}
                        onCheckedChange={(checked) => handlePermissionToggle(key, !!checked)}
                        aria-label={label}
                      />
                      <span className="truncate">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </TabsContent>

      <TabsContent value="advanced" className="mt-2">
        <Textarea
          id="json-editor"
          value={jsonMode}
          onChange={(e) => handleJsonChange(e.target.value)}
          className="min-h-[200px] font-mono text-xs"
          placeholder='{"view_projects": true}'
          rows={10}
        />
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">JSON object with boolean values</span>
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={syncToJson}>
            Sync from Simple
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
