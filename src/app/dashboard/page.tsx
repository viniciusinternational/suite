import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Building2, 
  FolderKanban, 
  AlertCircle, 
  TrendingUp, 
  CheckCircle2, 
  Clock,
  Bell,
  Settings,
  Shield,
  Database
} from 'lucide-react';

export default function DashboardPage() {
  // Mock data - in a real app, this would come from API calls
  const stats = {
    activeProjects: 24,
    totalProjects: 45,
    pendingApprovals: 8,
    completedTasks: 156,
    overdueTasks: 12,
    activeSessions: 42,
    systemHealth: 99.8,
    systemPerformance: 98.5
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    description,
    color = "blue"
  }: {
    title: string;
    value: string | number;
    icon: any;
    trend?: string;
    description?: string;
    color?: "blue" | "green" | "orange" | "red";
  }) => {
    const colorClasses = {
      blue: "text-blue-600 bg-blue-50",
      green: "text-green-600 bg-green-50",
      orange: "text-orange-600 bg-orange-50",
      red: "text-red-600 bg-red-50"
    };

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          {trend && (
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          )}
          {description && (
            <p className="text-sm text-gray-600 mt-2">{description}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button size="sm">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={127}
          icon={Users}
          trend="+12% from last month"
          color="blue"
        />
        <StatCard
          title="Active Projects"
          value={stats.activeProjects || 0}
          icon={FolderKanban}
          trend={`${stats.totalProjects || 0} total projects`}
          color="green"
        />
        <StatCard
          title="Departments"
          value={5}
          icon={Building2}
          trend="All departments operational"
          color="blue"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals || 0}
          icon={AlertCircle}
          trend="Requires attention"
          color="orange"
        />
      </div>

      {/* System Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="System Performance"
          value="98.5%"
          icon={TrendingUp}
          trend="Optimal performance"
          color="green"
        />
        <StatCard
          title="System Health"
          value="99.8%"
          icon={Database}
          trend="Excellent performance"
          color="green"
        />
        <StatCard
          title="Active Sessions"
          value={stats.activeSessions || 0}
          icon={Users}
          trend="Current online users"
          color="blue"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events and notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="p-2 rounded-lg bg-green-50 text-green-600">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">System Backup Completed</h4>
                  <p className="text-sm text-gray-600">Daily system backup completed successfully at 2:00 AM</p>
                  <span className="text-xs text-gray-500">2 hours ago</span>
                </div>
              </div>
              <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">New User Registration</h4>
                  <p className="text-sm text-gray-600">John Doe has registered and is pending approval</p>
                  <span className="text-xs text-gray-500">4 hours ago</span>
                </div>
              </div>
              <div className="flex items-start space-x-4 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="p-2 rounded-lg bg-orange-50 text-orange-600">
                  <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">Payment Overdue</h4>
                  <p className="text-sm text-gray-600">Invoice #INV-2024-001 is 5 days overdue</p>
                  <span className="text-xs text-gray-500">1 day ago</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Overview */}
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>Key system metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Task Completion */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Task Completion</span>
                <span className="text-sm text-gray-600">
                  {stats.completedTasks}/{(stats.completedTasks || 0) + (stats.overdueTasks || 0)}
                </span>
              </div>
              <Progress 
                value={((stats.completedTasks || 0) / ((stats.completedTasks || 0) + (stats.overdueTasks || 0))) * 100} 
                className="h-2"
              />
            </div>

            {/* System Status */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Status</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Online
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Backup Status</span>
                <Badge variant="outline" className="text-green-600 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Current
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Security Scan</span>
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <Clock className="h-3 w-3 mr-1" />
                  Scheduled
                </Badge>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Quick Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Add New User
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Manage Departments
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  System Backup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
