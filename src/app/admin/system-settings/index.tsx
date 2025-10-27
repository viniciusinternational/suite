'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Building2, 
  Globe, 
  Clock, 
  Shield, 
  Database, 
  Save,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  HardDrive,
  Wifi,
  Lock,
  Key,
  Users,
  Monitor
} from 'lucide-react';
import { mockSystemSettings } from '../mockdata';

const SystemSettings = () => {
  const [settings, setSettings] = useState(mockSystemSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCompanyInfoChange = (field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      companyInfo: {
        ...prev.companyInfo,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSystemPreferenceChange = (field: string, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      systemPreferences: {
        ...prev.systemPreferences,
        dateFormat: prev.systemPreferences.dateFormat,
        timeZone: prev.systemPreferences.timeZone,
        language: prev.systemPreferences.language,
        fiscalYearStart: prev.systemPreferences.fiscalYearStart,
        backupFrequency: prev.systemPreferences.backupFrequency,
        sessionTimeout: prev.systemPreferences.sessionTimeout
      }
    }));
    setHasChanges(true);
  };

  const handleModuleToggle = (module: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: {
          ...prev.modules[module as keyof typeof prev.modules],
          enabled
        }
      }
    }));
    setHasChanges(true);
  };

  const handleModuleFeatureToggle = (module: string, feature: string, enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: {
          ...prev.modules[module as keyof typeof prev.modules],
          features: enabled 
            ? [...prev.modules[module as keyof typeof prev.modules].features, feature]
            : prev.modules[module as keyof typeof prev.modules].features.filter(f => f !== feature)
        }
      }
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      console.log('Saving settings:', settings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSettings = () => {
    setSettings(mockSystemSettings);
    setHasChanges(false);
  };

  const systemStatus = {
    database: 'online',
    storage: '85%',
    memory: '62%',
    uptime: '99.8%',
    lastBackup: '2024-01-25T02:00:00Z',
    activeUsers: 127,
    apiHealth: 'healthy'
  };

  const SecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Lock className="h-5 w-5 mr-2" />
              Password Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Minimum Password Length</Label>
              <div className="flex items-center space-x-2">
                <Input type="number" value="8" className="w-20" />
                <span className="text-sm text-gray-600">characters</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Require Special Characters</Label>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Require Numbers</Label>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Password Expiry</Label>
              <div className="flex items-center space-x-2">
                <Input type="number" value="90" className="w-20" />
                <span className="text-sm text-gray-600">days</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Key className="h-5 w-5 mr-2" />
              Session Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Session Timeout</Label>
              <div className="flex items-center space-x-2">
                <Input 
                  type="number" 
                  value={settings.systemPreferences.sessionTimeout} 
                  onChange={(e) => handleSystemPreferenceChange('sessionTimeout', parseInt(e.target.value))}
                  className="w-20" 
                />
                <span className="text-sm text-gray-600">minutes</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Remember Me Duration</Label>
              <div className="flex items-center space-x-2">
                <Input type="number" value="30" className="w-20" />
                <span className="text-sm text-gray-600">days</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Multi-Factor Authentication</Label>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <Label>Force Password Reset</Label>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Shield className="h-5 w-5 mr-2" />
            Security Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-700">0</div>
              <div className="text-sm text-gray-600">Failed Login Attempts</div>
              <div className="text-xs text-gray-500">Last 24 hours</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-700">3</div>
              <div className="text-sm text-gray-600">Active Security Scans</div>
              <div className="text-xs text-gray-500">Running now</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-700">5</div>
              <div className="text-sm text-gray-600">Security Alerts</div>
              <div className="text-xs text-gray-500">Requires attention</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure system-wide settings and preferences</p>
        </div>
        
        <div className="flex space-x-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleResetSettings}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
          <Button 
            onClick={handleSaveSettings} 
            disabled={!hasChanges || isLoading}
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Database</p>
                <div className="flex items-center mt-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-sm font-bold text-green-700">Online</span>
                </div>
              </div>
              <Database className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Storage</p>
                <p className="text-lg font-bold text-gray-900">{systemStatus.storage}</p>
              </div>
              <HardDrive className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-lg font-bold text-gray-900">{systemStatus.uptime}</p>
              </div>
              <Monitor className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-lg font-bold text-gray-900">{systemStatus.activeUsers}</p>
              </div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="company">Company Info</TabsTrigger>
          <TabsTrigger value="system">System Preferences</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="backup">Backup & Maintenance</TabsTrigger>
        </TabsList>

        {/* Company Information */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2" />
                Company Information
              </CardTitle>
              <CardDescription>
                Configure your organization's basic information and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={settings.companyInfo.name}
                    onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={settings.companyInfo.website}
                    onChange={(e) => handleCompanyInfoChange('website', e.target.value)}
                    placeholder="www.company.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={settings.companyInfo.phone}
                    onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email</Label>
                  <Input
                    id="email"
                    value={settings.companyInfo.email}
                    onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={settings.companyInfo.address}
                  onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
                  placeholder="Enter company address"
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Logo
                    </Button>
                    <p className="text-xs text-gray-600">Recommended: 200x200px, PNG or JPG</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Preferences Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Preferences</CardTitle>
              <CardDescription>Configure system-wide settings and defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Date Format</Label>
                    <Select 
                      value={settings.systemPreferences.dateFormat}
                      onValueChange={(value: string) => handleSystemPreferenceChange('dateFormat', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Time Zone</Label>
                    <Select 
                      value={settings.systemPreferences.timeZone}
                      onValueChange={(value: string) => handleSystemPreferenceChange('timeZone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Language</Label>
                    <Select 
                      value={settings.systemPreferences.language}
                      onValueChange={(value: string) => handleSystemPreferenceChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Fiscal Year Start</Label>
                    <Select 
                      value={settings.systemPreferences.fiscalYearStart}
                      onValueChange={(value: string) => handleSystemPreferenceChange('fiscalYearStart', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select fiscal year start" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="January">January</SelectItem>
                        <SelectItem value="April">April</SelectItem>
                        <SelectItem value="July">July</SelectItem>
                        <SelectItem value="October">October</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Backup Frequency</Label>
                    <Select 
                      value={settings.systemPreferences.backupFrequency}
                      onValueChange={(value: string) => handleSystemPreferenceChange('backupFrequency', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select backup frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Session Timeout (minutes)</Label>
                    <Select 
                      value={settings.systemPreferences.sessionTimeout.toString()}
                      onValueChange={(value: string) => handleSystemPreferenceChange('sessionTimeout', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select session timeout" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Module Management */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Module Configuration
              </CardTitle>
              <CardDescription>
                Enable or disable system modules and their features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(settings.modules).map(([moduleName, moduleConfig]) => (
                <div key={moduleName} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium capitalize">
                        {moduleName.replace(/([A-Z])/g, ' $1').trim()} Module
                      </h3>
                      <p className="text-sm text-gray-600">
                        {moduleName === 'projects' && 'Project management and tracking'}
                        {moduleName === 'hr' && 'Human resources and employee management'}
                        {moduleName === 'finance' && 'Financial management and accounting'}
                        {moduleName === 'procurement' && 'Procurement and vendor management'}
                      </p>
                    </div>
                    <Switch
                      checked={moduleConfig.enabled}
                      onCheckedChange={(enabled: boolean) => handleModuleToggle(moduleName, enabled)}
                    />
                  </div>
                  
                  {moduleConfig.enabled && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-4 border-l-2 border-gray-200">
                      {['gantt', 'kanban', 'reports', 'payroll', 'leaves', 'performance', 'accounting', 'billing', 'requests', 'approvals', 'vendors'].map((feature) => (
                        <div key={feature} className="flex items-center space-x-2">
                          <Switch
                            id={`${moduleName}-${feature}`}
                            checked={moduleConfig.features.includes(feature)}
                            onCheckedChange={(enabled: boolean) => handleModuleFeatureToggle(moduleName, feature, enabled)}
                            size="sm"
                          />
                          <Label 
                            htmlFor={`${moduleName}-${feature}`}
                            className="text-sm capitalize"
                          >
                            {feature}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        {/* Backup & Maintenance */}
        <TabsContent value="backup">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Backup Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Last Backup</Label>
                      <p className="text-sm text-gray-600">
                        {new Date(systemStatus.lastBackup).toLocaleString()}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Backup Status</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-green-700">Successful</span>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Next Scheduled</Label>
                      <p className="text-sm text-gray-600">
                        Tomorrow at 2:00 AM
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button className="w-full">
                      <Database className="h-4 w-4 mr-2" />
                      Create Backup Now
                    </Button>
                    
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Backup
                    </Button>
                    
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Restore from Backup
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <RefreshCw className="h-5 w-5 mr-2" />
                  System Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col">
                    <RefreshCw className="h-6 w-6 mb-2" />
                    <span>Clear Cache</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Database className="h-6 w-6 mb-2" />
                    <span>Optimize Database</span>
                  </Button>
                  
                  <Button variant="outline" className="h-20 flex flex-col">
                    <HardDrive className="h-6 w-6 mb-2" />
                    <span>Clean Temp Files</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings; 