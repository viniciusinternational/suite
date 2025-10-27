import type { Project, Payment, Department } from '@/types';

// Interface for monthly expenditure tracking
export interface MonthlyExpenditure {
  fiscalYear: number;
  month: number; // 1-12
  totalBudget: number;
  totalSpent: number;
  projects: {
    id: string;
    name: string;
    code: string;
    budget: number;
    spent: number;
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
    departmentId: string;
    departmentName: string;
  }[];
  departmentExpenses: {
    departmentId: string;
    departmentName: string;
    budgetAllocated: number;
    totalSpent: number;
    categories: {
      salaries: number;
      procurement: number;
      operational: number;
      equipment: number;
      other: number;
    };
  }[];
  payments: {
    id: string;
    amount: number;
    category: 'project' | 'salary' | 'procurement' | 'operational' | 'equipment';
    status: 'pending' | 'approved' | 'paid' | 'failed';
    description: string;
  }[];
}

// Interface for fiscal year summary
export interface FiscalYearSummary {
  fiscalYear: number;
  totalBudget: number;
  totalSpent: number;
  totalProjects: number;
  completedProjects: number;
  departmentBreakdown: {
    departmentId: string;
    departmentName: string;
    budget: number;
    spent: number;
    projectCount: number;
  }[];
  monthlyTrends: {
    month: number;
    budget: number;
    spent: number;
    variance: number;
  }[];
  topExpenseCategories: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

// Interface for historical financial data (main interface)
export interface HistoricalFinancialData {
  fiscalYear: number;
  month: number;
  totalBudget: number;
  totalSpent: number;
  projects: {
    id: string;
    name: string;
    code: string;
    budget: number;
    spent: number;
    status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
    departmentId: string;
    departmentName: string;
    startDate: string;
    endDate: string;
    progress: number;
  }[];
  departmentExpenses: {
    departmentId: string;
    departmentName: string;
    budgetAllocated: number;
    totalSpent: number;
    categories: {
      salaries: number;
      procurement: number;
      operational: number;
      equipment: number;
      other: number;
    };
  }[];
  payments: {
    id: string;
    amount: number;
    category: 'project' | 'salary' | 'procurement' | 'operational' | 'equipment';
    status: 'pending' | 'approved' | 'paid' | 'failed';
    description: string;
    date: string;
  }[];
}

// Mock historical financial data spanning multiple fiscal years
export const mockHistoricalFinancialData: HistoricalFinancialData[] = [
  // 2024 Data
  {
    fiscalYear: 2024,
    month: 1,
    totalBudget: 15000000,
    totalSpent: 1250000,
    projects: [
      {
        id: "PRJ001",
        name: "City Center Complex",
        code: "CCC-2024-001",
        budget: 5000000,
        spent: 450000,
        status: "active",
        departmentId: "ENG",
        departmentName: "Engineering",
        startDate: "2024-01-15",
        endDate: "2025-12-31",
        progress: 15
      },
      {
        id: "PRJ002",
        name: "Infrastructure Upgrade",
        code: "IU-2024-002",
        budget: 8500000,
        spent: 650000,
        status: "active",
        departmentId: "ENG",
        departmentName: "Engineering",
        startDate: "2024-01-01",
        endDate: "2026-02-28",
        progress: 8
      },
      {
        id: "PRJ003",
        name: "Green Energy Campus",
        code: "GEC-2023-003",
        budget: 1500000,
        spent: 150000,
        status: "completed",
        departmentId: "ENG",
        departmentName: "Engineering",
        startDate: "2023-01-10",
        endDate: "2024-01-10",
        progress: 100
      }
    ],
    departmentExpenses: [
      {
        departmentId: "ENG",
        departmentName: "Engineering",
        budgetAllocated: 12000000,
        totalSpent: 950000,
        categories: {
          salaries: 405000,
          procurement: 400000,
          operational: 75000,
          equipment: 50000,
          other: 20000
        }
      },
      {
        departmentId: "ADM",
        departmentName: "Administration",
        budgetAllocated: 1500000,
        totalSpent: 140000,
        categories: {
          salaries: 90000,
          procurement: 25000,
          operational: 15000,
          equipment: 8000,
          other: 2000
        }
      },
      {
        departmentId: "FIN",
        departmentName: "Finance",
        budgetAllocated: 1000000,
        totalSpent: 127500,
        categories: {
          salaries: 85000,
          procurement: 20000,
          operational: 12500,
          equipment: 7000,
          other: 3000
        }
      },
      {
        departmentId: "HR",
        departmentName: "Human Resources",
        budgetAllocated: 500000,
        totalSpent: 32500,
        categories: {
          salaries: 22500,
          procurement: 5000,
          operational: 3000,
          equipment: 1500,
          other: 500
        }
      }
    ],
    payments: [
      {
        id: "PAY001",
        amount: 125000,
        category: "project",
        status: "paid",
        description: "Foundation work payment - City Center Complex",
        date: "2024-01-25"
      },
      {
        id: "PAY002",
        amount: 952500,
        category: "salary",
        status: "paid",
        description: "January 2024 salaries",
        date: "2024-01-31"
      },
      {
        id: "PAY003",
        amount: 75000,
        category: "equipment",
        status: "paid",
        description: "Construction equipment rental",
        date: "2024-01-15"
      }
    ]
  },
  {
    fiscalYear: 2024,
    month: 2,
    totalBudget: 15000000,
    totalSpent: 1450000,
    projects: [
      {
        id: "PRJ001",
        name: "City Center Complex",
        code: "CCC-2024-001",
        budget: 5000000,
        spent: 750000,
        status: "active",
        departmentId: "ENG",
        departmentName: "Engineering",
        startDate: "2024-01-15",
        endDate: "2025-12-31",
        progress: 25
      },
      {
        id: "PRJ002",
        name: "Infrastructure Upgrade",
        code: "IU-2024-002",
        budget: 8500000,
        spent: 950000,
        status: "active",
        departmentId: "ENG",
        departmentName: "Engineering",
        startDate: "2024-01-01",
        endDate: "2026-02-28",
        progress: 12
      },
      {
        id: "PRJ004",
        name: "Coastal Road Expansion",
        code: "CRE-2024-004",
        budget: 12000000,
        spent: 480000,
        status: "active",
        departmentId: "ENG",
        departmentName: "Engineering",
        startDate: "2024-02-15",
        endDate: "2025-08-30",
        progress: 5
      }
    ],
    departmentExpenses: [
      {
        departmentId: "ENG",
        departmentName: "Engineering",
        budgetAllocated: 12000000,
        totalSpent: 1150000,
        categories: {
          salaries: 405000,
          procurement: 550000,
          operational: 85000,
          equipment: 80000,
          other: 30000
        }
      },
      {
        departmentId: "ADM",
        departmentName: "Administration",
        budgetAllocated: 1500000,
        totalSpent: 145000,
        categories: {
          salaries: 90000,
          procurement: 30000,
          operational: 15000,
          equipment: 8000,
          other: 2000
        }
      },
      {
        departmentId: "FIN",
        departmentName: "Finance",
        budgetAllocated: 1000000,
        totalSpent: 120000,
        categories: {
          salaries: 85000,
          procurement: 18000,
          operational: 10000,
          equipment: 5000,
          other: 2000
        }
      },
      {
        departmentId: "HR",
        departmentName: "Human Resources",
        budgetAllocated: 500000,
        totalSpent: 35000,
        categories: {
          salaries: 22500,
          procurement: 7000,
          operational: 3500,
          equipment: 1500,
          other: 500
        }
      }
    ],
    payments: [
      {
        id: "PAY004",
        amount: 185000,
        category: "project",
        status: "paid",
        description: "Structural work payment - City Center Complex",
        date: "2024-02-15"
      },
      {
        id: "PAY005",
        amount: 952500,
        category: "salary",
        status: "paid",
        description: "February 2024 salaries",
        date: "2024-02-29"
      },
      {
        id: "PAY006",
        amount: 95000,
        category: "procurement",
        status: "paid",
        description: "Raw materials procurement",
        date: "2024-02-20"
      }
    ]
  },
  // 2023 Data (Previous Year)
  {
    fiscalYear: 2023,
    month: 12,
    totalBudget: 12000000,
    totalSpent: 1100000,
    projects: [
      {
        id: "PRJ003",
        name: "Green Energy Campus",
        code: "GEC-2023-003",
        budget: 3200000,
        spent: 3150000,
        status: "completed",
        departmentId: "ENG",
        departmentName: "Engineering",
        startDate: "2023-01-10",
        endDate: "2024-01-10",
        progress: 100
      },
      {
        id: "PRJ005",
        name: "Office Building Renovation",
        code: "OBR-2023-005",
        budget: 2500000,
        spent: 2480000,
        status: "completed",
        departmentId: "ADM",
        departmentName: "Administration",
        startDate: "2023-03-01",
        endDate: "2023-12-15",
        progress: 100
      },
      {
        id: "PRJ006",
        name: "Technology Infrastructure",
        code: "TI-2023-006",
        budget: 1800000,
        spent: 1650000,
        status: "completed",
        departmentId: "ADM",
        departmentName: "Administration",
        startDate: "2023-06-01",
        endDate: "2023-11-30",
        progress: 100
      }
    ],
    departmentExpenses: [
      {
        departmentId: "ENG",
        departmentName: "Engineering",
        budgetAllocated: 8000000,
        totalSpent: 7800000,
        categories: {
          salaries: 3650000,
          procurement: 3200000,
          operational: 650000,
          equipment: 250000,
          other: 50000
        }
      },
      {
        departmentId: "ADM",
        departmentName: "Administration",
        budgetAllocated: 2500000,
        totalSpent: 2400000,
        categories: {
          salaries: 1080000,
          procurement: 950000,
          operational: 200000,
          equipment: 150000,
          other: 20000
        }
      },
      {
        departmentId: "FIN",
        departmentName: "Finance",
        budgetAllocated: 1000000,
        totalSpent: 980000,
        categories: {
          salaries: 750000,
          procurement: 150000,
          operational: 50000,
          equipment: 25000,
          other: 5000
        }
      },
      {
        departmentId: "HR",
        departmentName: "Human Resources",
        budgetAllocated: 500000,
        totalSpent: 470000,
        categories: {
          salaries: 270000,
          procurement: 120000,
          operational: 50000,
          equipment: 25000,
          other: 5000
        }
      }
    ],
    payments: [
      {
        id: "PAY007",
        amount: 275000,
        category: "project",
        status: "paid",
        description: "Final payment - Green Energy Campus",
        date: "2023-12-20"
      },
      {
        id: "PAY008",
        amount: 850000,
        category: "salary",
        status: "paid",
        description: "December 2023 salaries",
        date: "2023-12-31"
      },
      {
        id: "PAY009",
        amount: 125000,
        category: "equipment",
        status: "paid",
        description: "Year-end equipment purchase",
        date: "2023-12-15"
      }
    ]
  },
  {
    fiscalYear: 2023,
    month: 6,
    totalBudget: 12000000,
    totalSpent: 980000,
    projects: [
      {
        id: "PRJ003",
        name: "Green Energy Campus",
        code: "GEC-2023-003",
        budget: 3200000,
        spent: 1850000,
        status: "active",
        departmentId: "ENG",
        departmentName: "Engineering",
        startDate: "2023-01-10",
        endDate: "2024-01-10",
        progress: 60
      },
      {
        id: "PRJ005",
        name: "Office Building Renovation",
        code: "OBR-2023-005",
        budget: 2500000,
        spent: 1250000,
        status: "active",
        departmentId: "ADM",
        departmentName: "Administration",
        startDate: "2023-03-01",
        endDate: "2023-12-15",
        progress: 50
      },
      {
        id: "PRJ006",
        name: "Technology Infrastructure",
        code: "TI-2023-006",
        budget: 1800000,
        spent: 450000,
        status: "active",
        departmentId: "ADM",
        departmentName: "Administration",
        startDate: "2023-06-01",
        endDate: "2023-11-30",
        progress: 25
      }
    ],
    departmentExpenses: [
      {
        departmentId: "ENG",
        departmentName: "Engineering",
        budgetAllocated: 8000000,
        totalSpent: 3200000,
        categories: {
          salaries: 1825000,
          procurement: 1000000,
          operational: 275000,
          equipment: 85000,
          other: 15000
        }
      },
      {
        departmentId: "ADM",
        departmentName: "Administration",
        budgetAllocated: 2500000,
        totalSpent: 1250000,
        categories: {
          salaries: 540000,
          procurement: 500000,
          operational: 130000,
          equipment: 70000,
          other: 10000
        }
      },
      {
        departmentId: "FIN",
        departmentName: "Finance",
        budgetAllocated: 1000000,
        totalSpent: 490000,
        categories: {
          salaries: 375000,
          procurement: 75000,
          operational: 25000,
          equipment: 12000,
          other: 3000
        }
      },
      {
        departmentId: "HR",
        departmentName: "Human Resources",
        budgetAllocated: 500000,
        totalSpent: 235000,
        categories: {
          salaries: 135000,
          procurement: 60000,
          operational: 25000,
          equipment: 12000,
          other: 3000
        }
      }
    ],
    payments: [
      {
        id: "PAY010",
        amount: 185000,
        category: "project",
        status: "paid",
        description: "Mid-year project payments",
        date: "2023-06-15"
      },
      {
        id: "PAY011",
        amount: 850000,
        category: "salary",
        status: "paid",
        description: "June 2023 salaries",
        date: "2023-06-30"
      },
      {
        id: "PAY012",
        amount: 65000,
        category: "procurement",
        status: "paid",
        description: "Equipment and supplies",
        date: "2023-06-20"
      }
    ]
  },
  // 2022 Data (Two Years Ago)
  {
    fiscalYear: 2022,
    month: 12,
    totalBudget: 10000000,
    totalSpent: 9650000,
    projects: [
      {
        id: "PRJ007",
        name: "Highway Bridge Construction",
        code: "HBC-2022-007",
        budget: 4500000,
        spent: 4450000,
        status: "completed",
        departmentId: "ENG",
        departmentName: "Engineering",
        startDate: "2022-01-15",
        endDate: "2022-12-20",
        progress: 100
      },
      {
        id: "PRJ008",
        name: "Water Treatment Plant",
        code: "WTP-2022-008",
        budget: 3500000,
        spent: 3480000,
        status: "completed",
        departmentId: "ENG",
        departmentName: "Engineering",
        startDate: "2022-03-01",
        endDate: "2022-11-30",
        progress: 100
      },
      {
        id: "PRJ009",
        name: "Smart City Initiative",
        code: "SCI-2022-009",
        budget: 2000000,
        spent: 1950000,
        status: "completed",
        departmentId: "ADM",
        departmentName: "Administration",
        startDate: "2022-05-01",
        endDate: "2022-12-31",
        progress: 100
      }
    ],
    departmentExpenses: [
      {
        departmentId: "ENG",
        departmentName: "Engineering",
        budgetAllocated: 7000000,
        totalSpent: 6850000,
        categories: {
          salaries: 3200000,
          procurement: 2900000,
          operational: 550000,
          equipment: 175000,
          other: 25000
        }
      },
      {
        departmentId: "ADM",
        departmentName: "Administration",
        budgetAllocated: 2000000,
        totalSpent: 1950000,
        categories: {
          salaries: 950000,
          procurement: 700000,
          operational: 200000,
          equipment: 85000,
          other: 15000
        }
      },
      {
        departmentId: "FIN",
        departmentName: "Finance",
        budgetAllocated: 700000,
        totalSpent: 680000,
        categories: {
          salaries: 520000,
          procurement: 100000,
          operational: 40000,
          equipment: 18000,
          other: 2000
        }
      },
      {
        departmentId: "HR",
        departmentName: "Human Resources",
        budgetAllocated: 300000,
        totalSpent: 290000,
        categories: {
          salaries: 180000,
          procurement: 70000,
          operational: 25000,
          equipment: 12000,
          other: 3000
        }
      }
    ],
    payments: [
      {
        id: "PAY013",
        amount: 450000,
        category: "project",
        status: "paid",
        description: "Final project completion payments",
        date: "2022-12-30"
      },
      {
        id: "PAY014",
        amount: 750000,
        category: "salary",
        status: "paid",
        description: "December 2022 salaries and bonuses",
        date: "2022-12-31"
      },
      {
        id: "PAY015",
        amount: 95000,
        category: "equipment",
        status: "paid",
        description: "Year-end equipment upgrades",
        date: "2022-12-25"
      }
    ]
  }
];

// Mock fiscal year summaries
export const mockFiscalYearSummary: FiscalYearSummary[] = [
  {
    fiscalYear: 2024,
    totalBudget: 15000000,
    totalSpent: 8750000,
    totalProjects: 4,
    completedProjects: 1,
    departmentBreakdown: [
      {
        departmentId: "ENG",
        departmentName: "Engineering",
        budget: 12000000,
        spent: 7200000,
        projectCount: 3
      },
      {
        departmentId: "ADM",
        departmentName: "Administration",
        budget: 1500000,
        spent: 850000,
        projectCount: 0
      },
      {
        departmentId: "FIN",
        departmentName: "Finance",
        budget: 1000000,
        spent: 580000,
        projectCount: 0
      },
      {
        departmentId: "HR",
        departmentName: "Human Resources",
        budget: 500000,
        spent: 120000,
        projectCount: 0
      }
    ],
    monthlyTrends: [
      { month: 1, budget: 1250000, spent: 1250000, variance: 0 },
      { month: 2, budget: 1250000, spent: 1450000, variance: -200000 },
      { month: 3, budget: 1250000, spent: 1350000, variance: -100000 },
      { month: 4, budget: 1250000, spent: 1200000, variance: 50000 },
      { month: 5, budget: 1250000, spent: 1100000, variance: 150000 },
      { month: 6, budget: 1250000, spent: 1300000, variance: -50000 }
    ],
    topExpenseCategories: [
      { category: "Salaries", amount: 4500000, percentage: 51.4 },
      { category: "Project Costs", amount: 2800000, percentage: 32.0 },
      { category: "Procurement", amount: 950000, percentage: 10.9 },
      { category: "Equipment", amount: 350000, percentage: 4.0 },
      { category: "Other", amount: 150000, percentage: 1.7 }
    ]
  },
  {
    fiscalYear: 2023,
    totalBudget: 12000000,
    totalSpent: 11650000,
    totalProjects: 3,
    completedProjects: 3,
    departmentBreakdown: [
      {
        departmentId: "ENG",
        departmentName: "Engineering",
        budget: 8000000,
        spent: 7800000,
        projectCount: 1
      },
      {
        departmentId: "ADM",
        departmentName: "Administration",
        budget: 2500000,
        spent: 2400000,
        projectCount: 2
      },
      {
        departmentId: "FIN",
        departmentName: "Finance",
        budget: 1000000,
        spent: 980000,
        projectCount: 0
      },
      {
        departmentId: "HR",
        departmentName: "Human Resources",
        budget: 500000,
        spent: 470000,
        projectCount: 0
      }
    ],
    monthlyTrends: [
      { month: 1, budget: 1000000, spent: 950000, variance: 50000 },
      { month: 2, budget: 1000000, spent: 1050000, variance: -50000 },
      { month: 3, budget: 1000000, spent: 980000, variance: 20000 },
      { month: 4, budget: 1000000, spent: 1020000, variance: -20000 },
      { month: 5, budget: 1000000, spent: 970000, variance: 30000 },
      { month: 6, budget: 1000000, spent: 980000, variance: 20000 },
      { month: 7, budget: 1000000, spent: 1100000, variance: -100000 },
      { month: 8, budget: 1000000, spent: 1050000, variance: -50000 },
      { month: 9, budget: 1000000, spent: 980000, variance: 20000 },
      { month: 10, budget: 1000000, spent: 1020000, variance: -20000 },
      { month: 11, budget: 1000000, spent: 1200000, variance: -200000 },
      { month: 12, budget: 1000000, spent: 1100000, variance: -100000 }
    ],
    topExpenseCategories: [
      { category: "Salaries", amount: 5850000, percentage: 50.2 },
      { category: "Project Costs", amount: 4200000, percentage: 36.1 },
      { category: "Procurement", amount: 1220000, percentage: 10.5 },
      { category: "Equipment", amount: 300000, percentage: 2.6 },
      { category: "Other", amount: 80000, percentage: 0.7 }
    ]
  },
  {
    fiscalYear: 2022,
    totalBudget: 10000000,
    totalSpent: 9650000,
    totalProjects: 3,
    completedProjects: 3,
    departmentBreakdown: [
      {
        departmentId: "ENG",
        departmentName: "Engineering",
        budget: 7000000,
        spent: 6850000,
        projectCount: 2
      },
      {
        departmentId: "ADM",
        departmentName: "Administration",
        budget: 2000000,
        spent: 1950000,
        projectCount: 1
      },
      {
        departmentId: "FIN",
        departmentName: "Finance",
        budget: 700000,
        spent: 680000,
        projectCount: 0
      },
      {
        departmentId: "HR",
        departmentName: "Human Resources",
        budget: 300000,
        spent: 290000,
        projectCount: 0
      }
    ],
    monthlyTrends: [
      { month: 1, budget: 833333, spent: 800000, variance: 33333 },
      { month: 2, budget: 833333, spent: 820000, variance: 13333 },
      { month: 3, budget: 833333, spent: 850000, variance: -16667 },
      { month: 4, budget: 833333, spent: 790000, variance: 43333 },
      { month: 5, budget: 833333, spent: 810000, variance: 23333 },
      { month: 6, budget: 833333, spent: 800000, variance: 33333 },
      { month: 7, budget: 833333, spent: 820000, variance: 13333 },
      { month: 8, budget: 833333, spent: 850000, variance: -16667 },
      { month: 9, budget: 833333, spent: 780000, variance: 53333 },
      { month: 10, budget: 833333, spent: 800000, variance: 33333 },
      { month: 11, budget: 833333, spent: 880000, variance: -46667 },
      { month: 12, budget: 833333, spent: 1050000, variance: -216667 }
    ],
    topExpenseCategories: [
      { category: "Salaries", amount: 4850000, percentage: 50.3 },
      { category: "Project Costs", amount: 3380000, percentage: 35.0 },
      { category: "Procurement", amount: 970000, percentage: 10.1 },
      { category: "Equipment", amount: 290000, percentage: 3.0 },
      { category: "Other", amount: 160000, percentage: 1.7 }
    ]
  }
]; 