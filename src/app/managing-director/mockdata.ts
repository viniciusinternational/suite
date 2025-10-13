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
  Payment,
  Item,
  RevenueStats, 
  IncomeExpenseComparison, 
  ApprovalStats
} from '@/types';

// Mock data for Managing Director dashboard
export interface MDDashboardStats {
  totalEmployees: number;
  totalSalaries: number;
  averageSalary: number;
  departmentDistribution: {
    departmentName: string;
    employeeCount: number;
    totalSalary: number;
  }[];
  projectStats: {
    total: number;
    active: number;
    completed: number;
    onHold: number;
    delayed: number;
  };
  financialStats: {
    totalBudget: number;
    totalSpent: number;
    projectedExpenditure: number;
    upcomingPayments: number;
    currentMonthSpent: number;
    previousMonthSpent: number;
  };
  approvalStats: ApprovalStats;
}

// Mock dashboard statistics
export const mockMDDashboardStats: MDDashboardStats = {
  totalEmployees: 127,
  totalSalaries: 952500,
  averageSalary: 75000,
  departmentDistribution: [
    {
      departmentName: "Engineering",
      employeeCount: 45,
      totalSalary: 405000
    },
    {
      departmentName: "Administration",
      employeeCount: 20,
      totalSalary: 140000
    },
    {
      departmentName: "Finance",
      employeeCount: 15,
      totalSalary: 127500
    },
    {
      departmentName: "HR",
      employeeCount: 12,
      totalSalary: 90000
    }
  ],
  projectStats: {
    total: 25,
    active: 15,
    completed: 5,
    onHold: 3,
    delayed: 2
  },
  financialStats: {
    totalBudget: 15000000,
    totalSpent: 8750000,
    projectedExpenditure: 1200000,
    upcomingPayments: 450000,
    currentMonthSpent: 950000,
    previousMonthSpent: 875000
  },
  approvalStats: {
    pendingPayments: 12,
    pendingRequests: 8,
    pendingProcurements: 5,
    pendingLeaves: 3,
    pendingProjects: 2
  }
};

// Mock project monitoring data
export interface ProjectMonitoring {
  id: string;
  name: string;
  progress: number;
  budget: number;
  spent: number;
  projectedSpend: number;
  startDate: string;
  endDate: string;
  status: string;
  milestones: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    delayed: number;
  };
  tasks: {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue: number;
  };
  recentUpdates: {
    date: string;
    type: 'milestone' | 'task' | 'payment' | 'issue';
    description: string;
  }[];
}

export const mockProjectMonitoring: ProjectMonitoring[] = [
  {
    id: "PRJ001",
    name: "City Center Complex",
    progress: 65,
    budget: 5000000,
    spent: 3250000,
    projectedSpend: 450000,
    startDate: "2024-01-15",
    endDate: "2025-12-31",
    status: "active",
    milestones: {
      total: 12,
      completed: 7,
      inProgress: 3,
      pending: 2,
      delayed: 0
    },
    tasks: {
      total: 85,
      completed: 52,
      inProgress: 20,
      pending: 10,
      overdue: 3
    },
    recentUpdates: [
      {
        date: "2024-01-25",
        type: "milestone",
        description: "Foundation work completed"
      },
      {
        date: "2024-01-24",
        type: "payment",
        description: "Vendor payment processed - $125,000"
      }
    ]
  },
  {
    id: "PRJ002",
    name: "Infrastructure Upgrade",
    progress: 25,
    budget: 8500000,
    spent: 2125000,
    projectedSpend: 650000,
    startDate: "2024-03-01",
    endDate: "2026-02-28",
    status: "active",
    milestones: {
      total: 20,
      completed: 4,
      inProgress: 5,
      pending: 11,
      delayed: 1
    },
    tasks: {
      total: 150,
      completed: 30,
      inProgress: 40,
      pending: 80,
      overdue: 5
    },
    recentUpdates: [
      {
        date: "2024-01-22",
        type: "issue",
        description: "Permit delay from city council"
      }
    ]
  },
  {
    id: "PRJ003",
    name: "Green Energy Campus",
    progress: 100,
    budget: 3200000,
    spent: 3150000,
    projectedSpend: 0,
    startDate: "2023-01-10",
    endDate: "2024-01-10",
    status: "completed",
    milestones: {
      total: 8,
      completed: 8,
      inProgress: 0,
      pending: 0,
      delayed: 0
    },
    tasks: {
      total: 60,
      completed: 60,
      inProgress: 0,
      pending: 0,
      overdue: 0
    },
    recentUpdates: [
      {
        date: "2024-01-10",
        type: "milestone",
        description: "Project officially completed and handed over"
      }
    ]
  },
  {
    id: "PRJ004",
    name: "Coastal Road Expansion",
    progress: 40,
    budget: 12000000,
    spent: 4800000,
    projectedSpend: 950000,
    startDate: "2024-02-15",
    endDate: "2025-08-30",
    status: "delayed",
    milestones: {
      total: 15,
      completed: 5,
      inProgress: 2,
      pending: 8,
      delayed: 2
    },
    tasks: {
      total: 110,
      completed: 40,
      inProgress: 30,
      pending: 40,
      overdue: 8
    },
    recentUpdates: [
      {
        date: "2024-01-20",
        type: "issue",
        description: "Unexpected environmental survey required"
      }
    ]
  }
];

// Mock payment monitoring data
interface PaymentMonitoringData {
  count: number;
  totalAmount: number;
  payments: Payment[];
}

interface PaymentMonitoring {
  pending: PaymentMonitoringData;
  approved: PaymentMonitoringData;
  paid: PaymentMonitoringData;
  failed: PaymentMonitoringData;
}

export const mockRequestForms: RequestForm[] = [
  {
    id: 'REQ001',
    name: 'Construction Materials Purchase',
    description: 'Steel and concrete supplies for City Center Complex',
    requestedBy: '106', // Maria Rodriguez
    departmentId: '2', // Engineering Department
    type: 'equipment',
    currentStatus: 'approved',
    approvedByDeptHeadId: '3', // Mike Wilson
    approvedByAdminId: '7', // Robert Taylor
    requestDate: '2024-01-30',
    items: [
      {
        id: 'ITEM001',
        name: 'Construction Materials',
        description: 'Steel and concrete supplies',
        quantity: 1,
        unitPrice: 50000,
        totalPrice: 50000,
        vendorId: 'V001'
      }
    ],
    totalAmount: 50000,
    priority: 'high',
    category: 'construction',
    comments: [
      'Initial request submitted for project phase 1',
      'Quantities verified by site engineer',
      'Approved by department head - within budget allocation',
      'Admin approval granted - vendor terms acceptable'
    ],
    attachments: [
      '/documents/REQ001/material-specs.pdf',
      '/documents/REQ001/vendor-quotation.pdf',
      '/documents/REQ001/site-requirements.xlsx'
    ]
  },
  {
    id: 'REQ002',
    name: 'Heavy Equipment Rental',
    description: 'Monthly rental for excavator',
    requestedBy: '102', // Emily Chen
    departmentId: '2', // Engineering Department
    type: 'equipment',
    currentStatus: 'approved',
    approvedByDeptHeadId: '3', // Mike Wilson
    approvedByAdminId: '7', // Robert Taylor
    requestDate: '2024-02-01',
    items: [
      {
        id: 'ITEM002',
        name: 'Heavy Equipment Rental',
        description: 'Monthly rental for excavator',
        quantity: 1,
        unitPrice: 75000,
        totalPrice: 75000,
        vendorId: 'V002'
      }
    ],
    totalAmount: 75000,
    priority: 'high',
    category: 'equipment',
    comments: [
      'Equipment needed for foundation work',
      'Rental period confirmed with vendor',
      'Insurance documentation verified',
      'Safety inspection certificates received'
    ],
    attachments: [
      '/documents/REQ002/equipment-specs.pdf',
      '/documents/REQ002/rental-agreement.pdf',
      '/documents/REQ002/insurance-cert.pdf'
    ]
  }
];

export const mockPaymentMonitoring: PaymentMonitoring = {
  pending: {
    count: 5,
    totalAmount: 125000,
    payments: [
      {
        id: 'PAY001',
        requestForms: [mockRequestForms[0]], // REQ001
        items: [
          {
            id: 'ITEM001',
            name: 'Construction Materials',
            description: 'Steel and concrete supplies',
            quantity: 1,
            unitPrice: 50000,
            totalPrice: 50000,
            vendorId: 'V001'
          }
        ],
        total: 50000,
        date: '2024-02-01',
        status: 'pending',
        paymentMethod: 'bank_transfer',
        vendorId: 'V001',
        referenceNumber: 'REF001',
        notes: 'Awaiting director approval',
        comments: [
          'Payment request generated from approved request form',
          'Bank details verified with vendor',
          'Pending final approval from managing director'
        ]
      },
      {
        id: 'PAY002',
        requestForms: [mockRequestForms[1]], // REQ002
        items: [
          {
            id: 'ITEM002',
            name: 'Heavy Equipment Rental',
            description: 'Monthly rental for excavator',
            quantity: 1,
            unitPrice: 75000,
            totalPrice: 75000,
            vendorId: 'V002'
          }
        ],
        total: 75000,
        date: '2024-02-02',
        status: 'pending',
        paymentMethod: 'bank_transfer',
        vendorId: 'V002',
        referenceNumber: 'REF002',
        notes: 'High priority equipment rental',
        comments: [
          'Advance payment required as per rental agreement',
          'Insurance coverage confirmed',
          'Awaiting director review'
        ]
      }
    ]
  },
  approved: {
    count: 3,
    totalAmount: 180000,
    payments: [
      {
        id: 'PAY003',
        requestForms: [mockRequestForms[0]], // Using REQ001 as an example
        items: [
          {
            id: 'ITEM003',
            name: 'Electrical Supplies',
            description: 'Wiring and electrical components',
            quantity: 1,
            unitPrice: 30000,
            totalPrice: 30000,
            vendorId: 'V003'
          }
        ],
        total: 30000,
        date: '2024-01-28',
        status: 'approved',
        paymentMethod: 'bank_transfer',
        vendorId: 'V003',
        approvedBy: '2', // Sarah Johnson (Managing Director)
        approvedAt: '2024-01-29T10:00:00Z',
        referenceNumber: 'REF003',
        comments: [
          'Payment request reviewed and approved',
          'Vendor bank details confirmed',
          'Ready for processing by accounting'
        ]
      }
    ]
  },
  paid: {
    count: 8,
    totalAmount: 450000,
    payments: [
      {
        id: 'PAY004',
        requestForms: [mockRequestForms[1]], // Using REQ002 as an example
        items: [
          {
            id: 'ITEM004',
            name: 'Plumbing Materials',
            description: 'Pipes and fixtures',
            quantity: 1,
            unitPrice: 25000,
            totalPrice: 25000,
            vendorId: 'V004'
          }
        ],
        total: 25000,
        date: '2024-01-20',
        status: 'paid',
        paymentMethod: 'bank_transfer',
        vendorId: 'V004',
        approvedBy: '2', // Sarah Johnson
        approvedAt: '2024-01-21T09:00:00Z',
        paidBy: '6', // Lisa Garcia (Accountant)
        paidAt: '2024-01-22T14:30:00Z',
        referenceNumber: 'REF004',
        comments: [
          'Payment approved by managing director',
          'Bank transfer processed successfully',
          'Payment receipt sent to vendor'
        ]
      }
    ]
  },
  failed: {
    count: 1,
    totalAmount: 15000,
    payments: [
      {
        id: 'PAY005',
        requestFormId: 'REQ005',
        items: [
          {
            id: 'ITEM005',
            name: 'Office Supplies',
            description: 'Monthly office supplies',
            quantity: 1,
            unitPrice: 15000,
            totalPrice: 15000,
            vendorId: 'V005'
          }
        ],
        total: 15000,
        date: '2024-01-15',
        status: 'failed',
        paymentMethod: 'credit_card',
        vendorId: 'V005',
        approvedBy: '2',
        approvedAt: '2024-01-16T11:00:00Z',
        referenceNumber: 'REF005',
        notes: 'Payment failed due to expired card'
      }
    ]
  }
};

// Mock employee salary distribution data
export interface SalaryDistribution {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  totalSalary: number;
  averageSalary: number;
  salaryRanges: {
    range: string;
    count: number;
    total: number;
  }[];
}

export const mockSalaryDistribution: SalaryDistribution[] = [
  {
    departmentId: "DEP001",
    departmentName: "Engineering",
    employeeCount: 45,
    totalSalary: 405000,
    averageSalary: 90000,
    salaryRanges: [
      {
        range: "50k-75k",
        count: 15,
        total: 937500
      },
      {
        range: "75k-100k",
        count: 20,
        total: 1700000
      },
      {
        range: "100k+",
        count: 10,
        total: 1200000
      }
    ]
  },
  {
    departmentId: "DEP002",
    departmentName: "Administration",
    employeeCount: 20,
    totalSalary: 140000,
    averageSalary: 70000,
    salaryRanges: [
      {
        range: "50k-75k",
        count: 15,
        total: 937500
      },
      {
        range: "75k-100k",
        count: 5,
        total: 425000
      }
    ]
  },
  {
    departmentId: "DEP003",
    departmentName: "Finance",
    employeeCount: 15,
    totalSalary: 127500,
    averageSalary: 85000,
    salaryRanges: [
      {
        range: "60k-80k",
        count: 8,
        total: 560000
      },
      {
        range: "80k-100k",
        count: 7,
        total: 630000
      }
    ]
  }
  // Add more departments...
];

// Mock projected expenditure data
export interface ProjectedExpenditure {
  month: string;
  projects: {
    projectId: string;
    projectName: string;
    amount: number;
    category: string;
  }[];
  salaries: number;
  procurement: number;
  operational: number;
  total: number;
}

export const mockProjectedExpenditure: ProjectedExpenditure = {
  month: "February 2024",
  projects: [
    {
      projectId: "PRJ001",
      projectName: "City Center Complex",
      amount: 450000,
      category: "Construction"
    },
    {
      projectId: "PRJ002",
      projectName: "Infrastructure Upgrade",
      amount: 650000,
      category: "Civil Works"
    },
    {
      projectId: "PRJ004",
      projectName: "Coastal Road Expansion",
      amount: 950000,
      category: "Construction"
    }
    // Add more projects...
  ],
  salaries: 952500,
  procurement: 325000,
  operational: 75000,
  total: 3377500
};

// Mock Revenue Stats
export const mockRevenueStats: RevenueStats = {
  totalRevenue: 18500000,
  yearToDateGrowth: 12.5,
  revenueByProject: [
    { name: "Project Alpha", value: 5200000 },
    { name: "Project Beta", value: 4800000 },
    { name: "Project Gamma", value: 3500000 },
    { name: "Project Delta", value: 3000000 },
    { name: "Other Projects", value: 2000000 }
  ],
  revenueByClient: [
    { name: "Client A Corp", value: 6000000 },
    { name: "Client B Ltd", value: 4500000 },
    { name: "Client C Inc", value: 4000000 },
    { name: "Client D Group", value: 2500000 },
    { name: "Others", value: 1500000 }
  ],
  revenueTrends: [
    { month: "Jan", revenue: 1200000, expenses: 800000, profit: 400000 },
    { month: "Feb", revenue: 1500000, expenses: 900000, profit: 600000 },
    { month: "Mar", revenue: 1800000, expenses: 1100000, profit: 700000 },
    { month: "Apr", revenue: 1600000, expenses: 950000, profit: 650000 },
    { month: "May", revenue: 1900000, expenses: 1200000, profit: 700000 },
    { month: "Jun", revenue: 2100000, expenses: 1300000, profit: 800000 }
  ]
};

// Mock Income vs Expense Comparison
export const mockIncomeExpenseComparison: IncomeExpenseComparison[] = [
  { month: "Jan", income: 1200000, expenses: 800000 },
  { month: "Feb", income: 1500000, expenses: 900000 },
  { month: "Mar", income: 1800000, expenses: 1100000 },
  { month: "Apr", income: 1600000, expenses: 950000 },
  { month: "May", income: 1900000, expenses: 1200000 },
  { month: "Jun", income: 2100000, expenses: 1300000 }
];

// Mock Pending Projects
export const mockPendingProjects: Project[] = [
  {
    id: "PRJ001",
    name: "New Office Complex",
    code: "NOC-2024",
    departmentId: "DEPT-001",
    departmentName: "Construction",
    managerId: "EMP-001",
    budget: 5000000,
    spent: 0,
    startDate: "2024-07-01",
    endDate: "2025-06-30",
    status: "planning",
    priority: "high",
    progress: 0,
    description: "Construction of new corporate office complex",
    approvalStatus: "pending",
    milestones: [],
    tasks: []
  },
  {
    id: "PRJ002",
    name: "Highway Extension",
    code: "HWE-2024",
    departmentId: "DEPT-002",
    departmentName: "Infrastructure",
    managerId: "EMP-002",
    budget: 12000000,
    spent: 0,
    startDate: "2024-08-01",
    endDate: "2025-12-31",
    status: "planning",
    priority: "critical",
    progress: 0,
    description: "Extension of highway with new lanes",
    approvalStatus: "pending",
    milestones: [],
    tasks: []
  }
];
