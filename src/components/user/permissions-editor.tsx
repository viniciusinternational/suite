'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Code } from 'lucide-react';

interface PermissionsEditorProps {
  value?: Record<string, boolean>;
  onChange: (permissions: Record<string, boolean>) => void;
}

const COMMON_PERMISSIONS = [
  { key: 'create_project', label: 'Create Projects', description: 'Create new projects' },
  { key: 'edit_project', label: 'Edit Projects', description: 'Modify existing projects' },
  { key: 'delete_project', label: 'Delete Projects', description: 'Remove projects' },
  { key: 'approve_payment', label: 'Approve Payments', description: 'Approve payment requests' },
  { key: 'process_payment', label: 'Process Payments', description: 'Execute payment processing' },
  { key: 'manage_users', label: 'Manage Users', description: 'Create and manage users' },
  { key: 'view_reports', label: 'View Reports', description: 'Access system reports' },
  { key: 'create_request', label: 'Create Requests', description: 'Submit request forms' },
  { key: 'approve_request', label: 'Approve Requests', description: 'Approve request forms' },
  { key: 'view_financials', label: 'View Financials', description: 'Access financial data' },
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMMON_PERMISSIONS.map((permission) => (
            <div
              key={permission.key}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex-1">
                <Label className="text-sm font-medium">{permission.label}</Label>
                <p className="text-xs text-gray-500">{permission.description}</p>
              </div>
              <Switch
                checked={value[permission.key] || false}
                onCheckedChange={(checked) => handlePermissionToggle(permission.key, checked)}
              />
            </div>
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
            className="font-mono text-sm min-h-[300px]"
            placeholder='{"create_project": true, "approve_payment": false}'
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
          <div className="p-3 bg-gray-50 border rounded-lg">
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
