'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  FolderKanban, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Eye,
  Calendar,
  Building2,
  Users,
  TrendingUp,
  Target,
  Download,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Project, Department } from '@/types';
import { mockProjects, mockDepartments } from '../mockdata';

const AllProjects = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const projects = mockProjects;
  const departments = mockDepartments;
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.clientName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
    const matchesDepartment = departmentFilter === 'all' || project.departmentId === departmentFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment;
  });

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-800 border-blue-200',
      active: 'bg-green-100 text-green-800 border-green-200',
      on_hold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityBadgeColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800 border-gray-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      critical: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getDepartment = (departmentId: string) => {
    return departments.find(dept => dept.id === departmentId);
  };

  const getProjectManager = (_managerId: string) => undefined;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateProjectHealth = (project: Project) => {
    const progressScore = project.progress;
    const budgetScore = ((project.budget - project.spent) / project.budget) * 100;
    const timeScore = calculateTimeScore(project);
    
    const overallScore = (progressScore + budgetScore + timeScore) / 3;
    
    if (overallScore >= 80) return 'healthy';
    if (overallScore >= 60) return 'warning';
    return 'critical';
  };

  const calculateTimeScore = (project: Project) => {
    const start = new Date(project.startDate);
    const end = new Date(project.endDate);
    const now = new Date();
    
    const totalTime = end.getTime() - start.getTime();
    const elapsedTime = now.getTime() - start.getTime();
    const timeProgress = (elapsedTime / totalTime) * 100;
    
    if (timeProgress > project.progress) {
      return Math.max(0, 100 - (timeProgress - project.progress));
    }
    return 100;
  };

  const openProjectDetail = (project: Project) => {
    setSelectedProject(project);
    setIsDetailOpen(true);
  };

  const ProjectDetail = ({ project }: { project: Project }) => {
    const manager = getProjectManager(project.managerId);
    const department = getDepartment(project.departmentId);
    const health = calculateProjectHealth(project);
    const budgetUtilization = (project.spent / project.budget) * 100;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold">{project.name}</h3>
            <p className="text-gray-600">{project.code}</p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className={getStatusBadgeColor(project.status)}>
                {project.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              <Badge variant="outline" className={getPriorityBadgeColor(project.priority)}>
                {project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}
              </Badge>
            </div>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              health === 'healthy' ? 'bg-green-100 text-green-800' :
              health === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {health === 'healthy' && <CheckCircle2 className="h-3 w-3 mr-1" />}
              {health === 'warning' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {health === 'critical' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {health.charAt(0).toUpperCase() + health.slice(1)}
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Project Manager</Label>
                <p className="text-sm">{manager?.name || 'Not assigned'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Department</Label>
                <p className="text-sm">{department?.name || 'No Department'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Client</Label>
                <p className="text-sm">{project.clientName || 'Internal Project'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Timeline</Label>
                <p className="text-sm">{formatDate(project.startDate)} - {formatDate(project.endDate)}</p>
              </div>
            </div>
            
            {project.description && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Description</Label>
                <p className="text-sm text-gray-700">{project.description}</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="progress" className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium text-gray-600">Overall Progress</Label>
                <span className="text-sm font-medium">{project.progress}%</span>
              </div>
              <Progress value={project.progress} className="h-3" />
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Milestones</h4>
              {project.milestones.length > 0 ? (
                <div className="space-y-2">
                  {project.milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{milestone.name}</p>
                        <p className="text-xs text-gray-600">Due: {formatDate(milestone.dueDate)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Progress value={milestone.progress} className="w-20 h-2" />
                        <Badge variant="outline" className={getStatusBadgeColor(milestone.status)}>
                          {milestone.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No milestones defined</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="financials" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Budget</Label>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(project.budget)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Spent</Label>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(project.spent)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Remaining</Label>
                <p className="text-lg font-bold text-green-700">{formatCurrency(project.budget - project.spent)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Utilization</Label>
                <p className="text-lg font-bold text-gray-900">{budgetUtilization.toFixed(1)}%</p>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium text-gray-600">Budget Utilization</Label>
                <span className="text-sm">{budgetUtilization.toFixed(1)}%</span>
              </div>
              <Progress value={budgetUtilization} className="h-3" />
            </div>
          </TabsContent>
          
          <TabsContent value="team" className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Tasks</h4>
              {project.tasks.length > 0 ? (
                <div className="space-y-2">
                  {project.tasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{task.name}</p>
                        <p className="text-xs text-gray-600">
                          {task.estimatedHours}h estimated, {task.actualHours}h actual
                        </p>
                      </div>
                      <Badge variant="outline" className={getPriorityBadgeColor(task.priority)}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No tasks assigned</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  const Label = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={className}>{children}</div>
  );

  // Calculate project statistics
  const projectStats = {
    total: mockProjects.length,
    active: mockProjects.filter(p => p.status === 'active').length,
    completed: mockProjects.filter(p => p.status === 'completed').length,
    onHold: mockProjects.filter(p => p.status === 'on_hold').length,
    totalBudget: mockProjects.reduce((sum, p) => sum + p.budget, 0),
    totalSpent: mockProjects.reduce((sum, p) => sum + p.spent, 0),
    averageProgress: mockProjects.reduce((sum, p) => sum + p.progress, 0) / mockProjects.length
  };

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Projects</h1>
          <p className="text-gray-600 mt-1">Project portfolio overview and management</p>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{projectStats.total}</p>
              </div>
              <FolderKanban className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-green-700">{projectStats.active}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-blue-700">{projectStats.departments}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-purple-700">{projectStats.teamMembers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Project Directory */}
      <Card>
        <CardHeader>
          <CardTitle>Project Portfolio</CardTitle>
          <CardDescription>Monitor and manage all organizational projects</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects by name, code, or client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {mockDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Projects Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Project</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Timeline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => {
                  const manager = getProjectManager(project.managerId);
                  const department = getDepartment(project.departmentId);
                  const health = calculateProjectHealth(project);
                  
                  return (
                    <TableRow key={project.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{project.name}</p>
                          <p className="text-sm text-gray-600">{project.code}</p>
                          {project.clientName && (
                            <p className="text-xs text-gray-500">{project.clientName}</p>
                          )}
                          <div className="flex items-center space-x-1">
                            <Badge variant="outline" className={getPriorityBadgeColor(project.priority)}>
                              {project.priority}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${
                              health === 'healthy' ? 'bg-green-500' :
                              health === 'warning' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{manager?.name || 'Unassigned'}</p>
                          <p className="text-xs text-gray-600">{department?.name}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{formatCurrency(project.budget)}</p>
                          <p className="text-xs text-gray-600">
                            Spent: {formatCurrency(project.spent)}
                          </p>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div 
                              className="bg-blue-600 h-1 rounded-full" 
                              style={{ width: `${(project.spent / project.budget) * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-xs text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(project.startDate)}
                          </div>
                          <div className="flex items-center text-xs text-gray-600">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatDate(project.endDate)}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeColor(project.status)}>
                          {project.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openProjectDetail(project)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <FileText className="h-4 w-4 mr-2" />
                              Generate Report
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Calendar className="h-4 w-4 mr-2" />
                              View Timeline
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredProjects.length === 0 && (
            <div className="text-center py-8">
              <FolderKanban className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No projects found matching your criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
            <DialogDescription>
              Comprehensive project information and analytics
            </DialogDescription>
          </DialogHeader>
          {selectedProject && <ProjectDetail project={selectedProject} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AllProjects; 