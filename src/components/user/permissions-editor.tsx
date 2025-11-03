'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Code } from 'lucide-react';
import type { PermissionKey } from '@/types';

interface PermissionsEditorProps {
  value?: Record<string, boolean>;
  onChange: (permissions: Record<string, boolean>) => void;
}

// Module-based permissions organized by module
const MODULE_PERMISSIONS = [
  {
    module: 'Dashboard',
    permissions: [
      { key: 'view_dashboard', label: 'View Dashboard', description: 'Access the main dashboard' },
    ],
  },
  {
    module: 'Events',
    permissions: [
      { key: 'view_events', label: 'View Events', description: 'View events list and details' },
      { key: 'add_events', label: 'Add Events', description: 'Create new events' },
      { key: 'edit_events', label: 'Edit Events', description: 'Modify existing events' },
      { key: 'delete_events', label: 'Delete Events', description: 'Remove events' },
    ],
  },
  {
    module: 'Projects',
    permissions: [
      { key: 'view_projects', label: 'View Projects', description: 'View project list and details' },
      { key: 'add_projects', label: 'Add Projects', description: 'Create new projects' },
      { key: 'edit_projects', label: 'Edit Projects', description: 'Modify existing projects' },
      { key: 'delete_projects', label: 'Delete Projects', description: 'Remove projects' },
      { key: 'approve_projects', label: 'Approve Projects', description: 'Approve project requests' },
    ],
  },
  {
    module: 'Users',
    permissions: [
      { key: 'view_users', label: 'View Users', description: 'View user list and details' },
      { key: 'add_users', label: 'Add Users', description: 'Create new users' },
      { key: 'edit_users', label: 'Edit Users', description: 'Modify user information' },
      { key: 'delete_users', label: 'Delete Users', description: 'Remove users' },
    ],
  },
  {
    module: 'Departments',
    permissions: [
      { key: 'view_departments', label: 'View Departments', description: 'View department list and details' },
      { key: 'add_departments', label: 'Add Departments', description: 'Create new departments' },
      { key: 'edit_departments', label: 'Edit Departments', description: 'Modify department information' },
      { key: 'delete_departments', label: 'Delete Departments', description: 'Remove departments' },
    ],
  },
  {
    module: 'Requests',
    permissions: [
      { key: 'view_requests', label: 'View Requests', description: 'View request forms' },
      { key: 'add_requests', label: 'Add Requests', description: 'Create new request forms' },
      { key: 'edit_requests', label: 'Edit Requests', description: 'Modify request forms' },
      { key: 'delete_requests', label: 'Delete Requests', description: 'Remove request forms' },
      { key: 'approve_requests', label: 'Approve Requests', description: 'Approve request forms' },
    ],
  },
  {
    module: 'Payments',
    permissions: [
      { key: 'view_payments', label: 'View Payments', description: 'View payment records' },
      { key: 'add_payments', label: 'Add Payments', description: 'Create new payments' },
      { key: 'edit_payments', label: 'Edit Payments', description: 'Modify payment records' },
      { key: 'delete_payments', label: 'Delete Payments', description: 'Remove payment records' },
      { key: 'approve_payments', label: 'Approve Payments', description: 'Approve payment requests' },
    ],
  },
  {
    module: 'Payroll',
    permissions: [
      { key: 'view_payroll', label: 'View Payroll', description: 'View payroll information' },
      { key: 'add_payroll', label: 'Add Payroll', description: 'Create payroll records' },
      { key: 'edit_payroll', label: 'Edit Payroll', description: 'Modify payroll records' },
      { key: 'delete_payroll', label: 'Delete Payroll', description: 'Remove payroll records' },
    ],
  },
  {
    module: 'Leave',
    permissions: [
      { key: 'view_leave', label: 'View Leave', description: 'View leave requests' },
      { key: 'add_leave', label: 'Add Leave', description: 'Create leave requests' },
      { key: 'edit_leave', label: 'Edit Leave', description: 'Modify leave requests' },
      { key: 'delete_leave', label: 'Delete Leave', description: 'Remove leave requests' },
      { key: 'approve_leave', label: 'Approve Leave', description: 'Approve leave requests' },
    ],
  },
  {
    module: 'Reports',
    permissions: [
      { key: 'view_reports', label: 'View Reports', description: 'Access system reports' },
    ],
  },
  {
    module: 'Audit Logs',
    permissions: [
      { key: 'view_audit_logs', label: 'View Audit Logs', description: 'View system audit logs' },
    ],
  },
  {
    module: 'Approvals',
    permissions: [
      { key: 'view_approvals', label: 'View Approvals', description: 'View approval workflows' },
      { key: 'approve_approvals', label: 'Approve Approvals', description: 'Approve pending approvals' },
    ],
  },
  {
    module: 'Settings',
    permissions: [
      { key: 'view_settings', label: 'View Settings', description: 'View system settings' },
      { key: 'edit_settings', label: 'Edit Settings', description: 'Modify system settings' },
    ],
  },
  {
    module: 'Team',
    permissions: [
      { key: 'view_team', label: 'View Team', description: 'View team/employee directory' },
      { key: 'edit_team', label: 'Edit Team', description: 'Modify team information' },
    ],
  },
  {
    module: 'Timesheets',
    permissions: [
      { key: 'view_timesheets', label: 'View Timesheets', description: 'View timesheet records' },
      { key: 'add_timesheets', label: 'Add Timesheets', description: 'Create timesheet entries' },
      { key: 'edit_timesheets', label: 'Edit Timesheets', description: 'Modify timesheet entries' },
      { key: 'delete_timesheets', label: 'Delete Timesheets', description: 'Remove timesheet entries' },
    ],
  },
  {
    module: 'Performance',
    permissions: [
      { key: 'view_performance', label: 'View Performance', description: 'View performance reviews' },
      { key: 'add_performance', label: 'Add Performance', description: 'Create performance reviews' },
      { key: 'edit_performance', label: 'Edit Performance', description: 'Modify performance reviews' },
      { key: 'delete_performance', label: 'Delete Performance', description: 'Remove performance reviews' },
    ],
  },
  {
    module: 'Memos',
    permissions: [
      { key: 'view_memos', label: 'View Memos', description: 'View memos and announcements' },
      { key: 'add_memos', label: 'Add Memos', description: 'Create new memos' },
      { key: 'edit_memos', label: 'Edit Memos', description: 'Modify memos' },
      { key: 'delete_memos', label: 'Delete Memos', description: 'Remove memos' },
    ],
  },
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
    const newPermissions = { ...value, [key]: enabled };
    onChange(newPermissions);
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
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="simple">
          <Settings className="h-4 w-4 mr-2" />
          Simple
        </TabsTrigger>
        <TabsTrigger value="advanced">
          <Code className="h-4 w-4 mr-2" />
          Advanced (JSON)
        </TabsTrigger>
      </TabsList>

      <TabsContent value="simple" className="space-y-4 mt-4">
        <div className="space-y-6">
          {MODULE_PERMISSIONS.map((module) => (
            <Card key={module.module}>
              <CardHeader>
                <CardTitle className="text-lg">{module.module}</CardTitle>
                <CardDescription>Permissions for {module.module} module</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {module.permissions.map((permission) => (
                    <div
                      key={permission.key}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <Label className="text-sm font-medium">{permission.label}</Label>
                        <p className="text-xs text-gray-500 mt-1">{permission.description}</p>
                      </div>
                      <Switch
                        checked={value[permission.key] || false}
                        onCheckedChange={(checked) => handlePermissionToggle(permission.key, checked)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="advanced" className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="json-editor">JSON Permissions</Label>
          <Textarea
            id="json-editor"
            value={jsonMode}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="font-mono text-sm h-[300px]"
            placeholder='{"view_projects": true, "add_projects": false}'
            rows={12}
          />
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Enter permissions as JSON object with boolean values
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={syncToJson}
            >
              Sync from Simple Mode
            </Button>
          </div>
        </div>

        {/* JSON Preview */}
        {Object.keys(value).length > 0 && (
          <div className="p-3 bg-gray-50 border rounded-lg mt-4">
            <p className="text-xs font-medium text-gray-600 mb-2">Current Permissions:</p>
            <pre className="text-xs font-mono overflow-auto">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
