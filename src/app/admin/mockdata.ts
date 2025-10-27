import type { 
  User, 
  Department, 
  Employee, 
  Project, 
  DashboardStats, 
  Notification,
  LeaveRequest,
  Payslip,
  RequestForm,
  Payment
} from '@/types';

// Mock Users Data
export const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    fullName: 'John Smith',
    phone: '+1-555-0001',
    dob: '1985-06-15',
    gender: 'Male',
    email: 'john.smith@vinisuite.com',
    mailAddresses: ['john.smith@vinisuite.com'],
    role: 'super_admin',
    avatar: '/avatars/john.jpg',
    isActive: true,
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    firstName: 'Sarah',
    lastName: 'Johnson',
    fullName: 'Sarah Johnson',
    phone: '+1-555-0002',
    dob: '1980-03-22',
    gender: 'Female',
    email: 'sarah.johnson@vinisuite.com',
    mailAddresses: ['sarah.johnson@vinisuite.com'],
    role: 'managing_director',
    departmentId: '1',
    avatar: '/avatars/sarah.jpg',
    isActive: true,
    createdAt: '2024-01-16T09:15:00Z',
    updatedAt: '2024-01-16T09:15:00Z'
  },
  {
    id: '3',
    firstName: 'Mike',
    lastName: 'Wilson',
    fullName: 'Mike Wilson',
    phone: '+1-555-0003',
    dob: '1978-11-08',
    gender: 'Male',
    email: 'mike.wilson@vinisuite.com',
    mailAddresses: ['mike.wilson@vinisuite.com'],
    role: 'department_head',
    departmentId: '2',
    employeeId: '101',
    avatar: '/avatars/mike.jpg',
    isActive: true,
    createdAt: '2024-01-17T14:20:00Z',
    updatedAt: '2024-01-17T14:20:00Z'
  },
  {
    id: '4',
    firstName: 'Emily',
    lastName: 'Chen',
    fullName: 'Emily Chen',
    phone: '+1-555-0004',
    dob: '1987-09-14',
    gender: 'Female',
    email: 'emily.chen@vinisuite.com',
    mailAddresses: ['emily.chen@vinisuite.com'],
    role: 'employee',
    departmentId: '2',
    employeeId: '102',
    avatar: '/avatars/emily.jpg',
    isActive: true,
    createdAt: '2024-01-18T11:45:00Z',
    updatedAt: '2024-01-18T11:45:00Z'
  },
  {
    id: '5',
    firstName: 'David',
    lastName: 'Brown',
    fullName: 'David Brown',
    phone: '+1-555-0005',
    dob: '1982-05-30',
    gender: 'Male',
    email: 'david.brown@vinisuite.com',
    mailAddresses: ['david.brown@vinisuite.com'],
    role: 'hr_manager',
    departmentId: '3',
    employeeId: '103',
    avatar: '/avatars/david.jpg',
    isActive: true,
    createdAt: '2024-01-19T08:30:00Z',
    updatedAt: '2024-01-19T08:30:00Z'
  },
  {
    id: '6',
    firstName: 'Lisa',
    lastName: 'Garcia',
    fullName: 'Lisa Garcia',
    phone: '+1-555-0006',
    dob: '1984-12-03',
    gender: 'Female',
    email: 'lisa.garcia@vinisuite.com',
    mailAddresses: ['lisa.garcia@vinisuite.com'],
    role: 'accountant',
    departmentId: '4',
    employeeId: '104',
    avatar: '/avatars/lisa.jpg',
    isActive: true,
    createdAt: '2024-01-20T13:10:00Z',
    updatedAt: '2024-01-20T13:10:00Z'
  },
  {
    id: '7',
    firstName: 'Robert',
    lastName: 'Taylor',
    fullName: 'Robert Taylor',
    phone: '+1-555-0007',
    dob: '1975-08-18',
    gender: 'Male',
    email: 'robert.taylor@vinisuite.com',
    mailAddresses: ['robert.taylor@vinisuite.com'],
    role: 'administrator',
    departmentId: '5',
    employeeId: '105',
    avatar: '/avatars/robert.jpg',
    isActive: true,
    createdAt: '2024-01-21T16:25:00Z',
    updatedAt: '2024-01-21T16:25:00Z'
  },
  {
    id: '8',
    firstName: 'Maria',
    lastName: 'Rodriguez',
    fullName: 'Maria Rodriguez',
    phone: '+1-555-0008',
    dob: '1990-01-25',
    gender: 'Female',
    email: 'maria.rodriguez@vinisuite.com',
    mailAddresses: ['maria.rodriguez@vinisuite.com'],
    role: 'employee',
    departmentId: '2',
    employeeId: '106',
    avatar: '/avatars/maria.jpg',
    isActive: true,
    createdAt: '2024-01-22T10:00:00Z',
    updatedAt: '2024-01-22T10:00:00Z'
  }
];

// Mock Departments Data
export const mockDepartments: Department[] = [
  {
    id: '1',
    name: 'Executive Management',
    code: 'EXEC',
    headId: '2',
    sector: 'administration',
    description: 'Executive leadership and strategic oversight',
    units: [
      { id: '1-1', name: 'Board of Directors', departmentId: '1', managerId: '2', isActive: true },
      { id: '1-2', name: 'Strategic Planning', departmentId: '1', managerId: '2', isActive: true }
    ],
    isActive: true
  },
  {
    id: '2',
    name: 'Engineering Department',
    code: 'ENG',
    headId: '3',
    sector: 'engineering',
    description: 'Technical design and project execution',
    units: [
      { id: '2-1', name: 'Structural Engineering', departmentId: '2', managerId: '4', isActive: true },
      { id: '2-2', name: 'Civil Engineering', departmentId: '2', managerId: '8', isActive: true },
      { id: '2-3', name: 'MEP Engineering', departmentId: '2', isActive: true }
    ],
    isActive: true
  },
  {
    id: '3',
    name: 'Human Resources',
    code: 'HR',
    headId: '5',
    sector: 'administration',
    description: 'Employee management and organizational development',
    units: [
      { id: '3-1', name: 'Recruitment', departmentId: '3', managerId: '5', isActive: true },
      { id: '3-2', name: 'Employee Relations', departmentId: '3', managerId: '5', isActive: true },
      { id: '3-3', name: 'Training & Development', departmentId: '3', isActive: true }
    ],
    isActive: true
  },
  {
    id: '4',
    name: 'Finance & Accounting',
    code: 'FIN',
    headId: '6',
    sector: 'administration',
    description: 'Financial management and accounting operations',
    units: [
      { id: '4-1', name: 'Accounts Payable', departmentId: '4', managerId: '6', isActive: true },
      { id: '4-2', name: 'Accounts Receivable', departmentId: '4', managerId: '6', isActive: true },
      { id: '4-3', name: 'Financial Planning', departmentId: '4', isActive: true }
    ],
    isActive: true
  },
  {
    id: '5',
    name: 'Administration',
    code: 'ADMIN',
    headId: '7',
    sector: 'administration',
    description: 'General administrative support and operations',
    units: [
      { id: '5-1', name: 'Office Management', departmentId: '5', managerId: '7', isActive: true },
      { id: '5-2', name: 'IT Support', departmentId: '5', managerId: '7', isActive: true }
    ],
    isActive: true
  }
];

// Mock Employees Data
export const mockEmployees: Employee[] = [
  {
    id: '101',
    userId: '3',
    employeeNumber: 'EMP001',
    firstName: 'Mike',
    lastName: 'Wilson',
    email: 'mike.wilson@vinisuite.com',
    phone: '+1-555-0101',
    departmentId: '2',
    unitId: '2-1',
    position: 'Department Head - Engineering',
    hireDate: '2022-03-15',
    salary: 120000,
    status: 'active',
    avatar: '/avatars/mike.jpg'
  },
  {
    id: '102',
    userId: '4',
    employeeNumber: 'EMP002',
    firstName: 'Emily',
    lastName: 'Chen',
    email: 'emily.chen@vinisuite.com',
    phone: '+1-555-0102',
    departmentId: '2',
    unitId: '2-1',
    position: 'Senior Project Manager',
    hireDate: '2021-08-20',
    salary: 95000,
    status: 'active',
    managerId: '101',
    avatar: '/avatars/emily.jpg'
  },
  {
    id: '103',
    userId: '5',
    employeeNumber: 'EMP003',
    firstName: 'David',
    lastName: 'Brown',
    email: 'david.brown@vinisuite.com',
    phone: '+1-555-0103',
    departmentId: '3',
    unitId: '3-1',
    position: 'HR Manager',
    hireDate: '2020-11-10',
    salary: 85000,
    status: 'active',
    avatar: '/avatars/david.jpg'
  },
  {
    id: '104',
    userId: '6',
    employeeNumber: 'EMP004',
    firstName: 'Lisa',
    lastName: 'Garcia',
    email: 'lisa.garcia@vinisuite.com',
    phone: '+1-555-0104',
    departmentId: '4',
    unitId: '4-1',
    position: 'Senior Accountant',
    hireDate: '2021-02-28',
    salary: 75000,
    status: 'active',
    avatar: '/avatars/lisa.jpg'
  },
  {
    id: '105',
    userId: '7',
    employeeNumber: 'EMP005',
    firstName: 'Robert',
    lastName: 'Taylor',
    email: 'robert.taylor@vinisuite.com',
    phone: '+1-555-0105',
    departmentId: '5',
    unitId: '5-1',
    position: 'System Administrator',
    hireDate: '2019-07-15',
    salary: 70000,
    status: 'active',
    avatar: '/avatars/robert.jpg'
  },
  {
    id: '106',
    userId: '8',
    employeeNumber: 'EMP006',
    firstName: 'Maria',
    lastName: 'Rodriguez',
    email: 'maria.rodriguez@vinisuite.com',
    phone: '+1-555-0106',
    departmentId: '2',
    unitId: '2-2',
    position: 'Civil Engineer',
    hireDate: '2023-01-10',
    salary: 65000,
    status: 'active',
    managerId: '102',
    avatar: '/avatars/maria.jpg'
  }
];

// Mock Projects Data
export const mockProjects: Project[] = [
  {
    id: 'PRJ001',
    name: 'City Center Complex',
    code: 'CCC-2024',
    description: 'Mixed-use commercial and residential development in downtown area',
    status: 'active',
    priority: 'high',
    startDate: '2024-01-15',
    endDate: '2025-12-31',
    budget: 5000000,
    spent: 1250000,
    departmentId: '2',
    managerId: '102',
    clientName: 'Urban Development Corp',
    progress: 25,
    milestones: [
      {
        id: 'M001',
        projectId: 'PRJ001',
        name: 'Foundation Complete',
        description: 'Complete foundation and basement structure',
        dueDate: '2024-06-30',
        status: 'completed',
        progress: 100,
        budget: 500000,
        spent: 500000
      },
      {
        id: 'M002',
        projectId: 'PRJ001',
        name: 'Structure Framework',
        description: 'Complete main structural framework',
        dueDate: '2024-10-15',
        status: 'in_progress',
        progress: 60,
        budget: 750000,
        spent: 450000
      }
    ],
    tasks: [
      {
        id: 'T001',
        projectId: 'PRJ001',
        milestoneId: 'M002',
        name: 'Steel Framework Installation',
        description: 'Install main steel framework for floors 1-5',
        assigneeId: '106',
        status: 'in_progress',
        priority: 'high',
        startDate: '2024-08-01',
        dueDate: '2024-09-30',
        estimatedHours: 320,
        actualHours: 180
      }
    ]
  },
  {
    id: 'PRJ002',
    name: 'Infrastructure Upgrade Project',
    code: 'IUP-2024',
    description: 'City-wide infrastructure modernization including roads and utilities',
    status: 'planning',
    priority: 'medium',
    startDate: '2024-03-01',
    endDate: '2026-02-28',
    budget: 8500000,
    spent: 425000,
    departmentId: '2',
    managerId: '102',
    clientName: 'City Municipality',
    progress: 5,
    milestones: [],
    tasks: []
  },
  {
    id: 'PRJ003',
    name: 'Green Energy Campus',
    code: 'GEC-2024',
    description: 'Sustainable office complex with renewable energy systems',
    status: 'completed',
    priority: 'high',
    startDate: '2023-01-10',
    endDate: '2024-01-10',
    budget: 3200000,
    spent: 3150000,
    departmentId: '2',
    managerId: '102',
    clientName: 'EcoTech Solutions',
    progress: 100,
    milestones: [],
    tasks: []
  }
];

// Mock Dashboard Stats
export const mockDashboardStats = {
  activeProjects: 24,
  totalProjects: 45,
  pendingApprovals: 8,
  completedTasks: 156,
  overdueTasks: 12,
  activeSessions: 42,
  systemHealth: 99.8,
  systemPerformance: 98.5
};

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    title: 'System Backup Completed',
    message: 'Daily system backup completed successfully at 2:00 AM',
    type: 'success',
    isRead: false,
    createdAt: '2024-01-25T02:00:00Z',
    actionUrl: '/super-admin/system-settings'
  },
  {
    id: '2',
    userId: '1',
    title: 'New User Registration',
    message: 'John Doe has registered and is pending approval',
    type: 'info',
    isRead: false,
    createdAt: '2024-01-24T14:30:00Z',
    actionUrl: '/super-admin/user-management'
  },
  {
    id: '3',
    userId: '1',
    title: 'Payment Overdue',
    message: 'Invoice #INV-2024-001 is 5 days overdue',
    type: 'warning',
    isRead: true,
    createdAt: '2024-01-23T09:15:00Z',
    actionUrl: '/super-admin/billing'
  }
];

// Mock Leave Requests
export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: 'LR001',
    employeeId: '102',
    type: 'annual',
    startDate: '2024-02-15',
    endDate: '2024-02-20',
    days: 5,
    reason: 'Family vacation',
    status: 'pending'
  },
  {
    id: 'LR002',
    employeeId: '106',
    type: 'sick',
    startDate: '2024-01-28',
    endDate: '2024-01-30',
    days: 3,
    reason: 'Medical treatment',
    status: 'approved',
    approvedBy: '103',
    approvedAt: '2024-01-27T10:00:00Z'
  }
];

// Mock System Settings
export const mockSystemSettings = {
  companyInfo: {
    name: 'ViniSuite Construction & Engineering',
    address: '123 Business District, City Center, State 12345',
    phone: '+1-555-000-0000',
    email: 'info@vinisuite.com',
    website: 'www.vinisuite.com',
    logo: '/logo.png'
  },
  systemPreferences: {
    dateFormat: 'MM/DD/YYYY',
    timeZone: 'America/New_York',
    language: 'en-US',
    fiscalYearStart: 'January',
    backupFrequency: 'daily',
    sessionTimeout: 30
  },
  modules: {
    projects: { enabled: true, features: ['gantt', 'kanban', 'reports'] },
    hr: { enabled: true, features: ['payroll', 'leaves', 'performance'] },
    operations: { enabled: true, features: ['tasks', 'approvals', 'reports'] },
    procurement: { enabled: true, features: ['requests', 'approvals', 'vendors'] }
  }
};

// Mock Audit Logs
export const mockAuditLogs = [
  {
    id: 'AL001',
    userId: '3',
    userName: 'Mike Wilson',
    action: 'USER_LOGIN',
    resource: 'Authentication',
    details: 'User logged in successfully',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2024-01-25T08:30:00Z',
    status: 'success'
  },
  {
    id: 'AL002',
    userId: '4',
    userName: 'Emily Chen',
    action: 'PROJECT_UPDATE',
    resource: 'Project PRJ001',
    details: 'Updated project milestone status',
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2024-01-25T10:15:00Z',
    status: 'success'
  },
  {
    id: 'AL003',
    userId: '6',
    userName: 'Lisa Garcia',
    action: 'PAYMENT_PROCESSED',
    resource: 'Payment PAY001',
    details: 'Processed vendor payment for $15,000',
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    timestamp: '2024-01-25T14:45:00Z',
    status: 'success'
  }
];

// Mock Billing Data
export const mockBillingData = {
  subscription: {
    plan: 'Enterprise',
    status: 'active',
    userLimit: 500,
    currentUsers: 127,
    monthlyFee: 2500,
    nextBillingDate: '2024-02-01',
    features: ['All Modules', 'Advanced Analytics', 'Priority Support', 'Custom Integrations']
  },
  invoices: [
    {
      id: 'INV-2024-001',
      date: '2024-01-01',
      amount: 2500,
      status: 'paid',
      dueDate: '2024-01-15',
      paidDate: '2024-01-10'
    },
    {
      id: 'INV-2023-012',
      date: '2023-12-01',
      amount: 2500,
      status: 'paid',
      dueDate: '2023-12-15',
      paidDate: '2023-12-12'
    }
  ],
  usage: {
    storage: { used: 45.2, limit: 100, unit: 'GB' },
    bandwidth: { used: 128.5, limit: 500, unit: 'GB' },
    apiCalls: { used: 15420, limit: 50000, unit: 'calls' }
  }
};
