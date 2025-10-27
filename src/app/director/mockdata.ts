import type { Project, RequestForm } from '@/types';

// Mock Projects Data for Northern Nigeria
export const mockProjects: Project[] = [
  {
    id: 'PRJ001',
    name: 'Kano City Market Complex',
    code: 'KCM-2024',
    description: 'Modern market complex development in Kano metropolitan area',
    status: 'active',
    priority: 'high',
    startDate: '2024-01-15',
    endDate: '2025-06-30',
    budget: 2500000000, // In Naira
    spent: 625000000,
    departmentId: '2',
    managerId: '102',
    progress: 25,
    milestones: [
      {
        id: 'M001',
        projectId: 'PRJ001',
        name: 'Foundation Completion',
        description: 'Complete foundation and underground facilities',
        dueDate: '2024-05-30',
        status: 'in_progress',
        progress: 75,
        budget: 625000000,
        spent: 468750000
      },
      {
        id: 'M002',
        projectId: 'PRJ001',
        name: 'Main Structure',
        description: 'Main building structure and roofing',
        dueDate: '2024-09-15',
        status: 'pending',
        progress: 0,
        budget: 1250000000,
        spent: 0
      }
    ],
    tasks: [
      {
        id: 'T001',
        projectId: 'PRJ001',
        milestoneId: 'M001',
        name: 'Foundation Excavation',
        description: 'Excavation and soil preparation',
        assigneeId: '106',
        status: 'completed',
        priority: 'high',
        startDate: '2024-01-20',
        dueDate: '2024-02-28',
        estimatedHours: 240,
        actualHours: 230
      }
    ]
  },
  {
    id: 'PRJ002',
    name: 'Kaduna Solar Farm',
    code: 'KSF-2024',
    description: 'Large-scale solar power installation in Kaduna State',
    status: 'planning',
    priority: 'high',
    startDate: '2024-03-01',
    endDate: '2025-02-28',
    budget: 3800000000,
    spent: 190000000,
    departmentId: '2',
    managerId: '102',
    progress: 5,
    milestones: [],
    tasks: []
  },
  {
    id: 'PRJ003',
    name: 'Maiduguri Housing Estate',
    code: 'MHE-2024',
    description: 'Affordable housing development in Maiduguri',
    status: 'active',
    priority: 'medium',
    startDate: '2024-02-01',
    endDate: '2025-01-31',
    budget: 1500000000,
    spent: 375000000,
    departmentId: '2',
    managerId: '103',
    progress: 25,
    milestones: [],
    tasks: []
  },
  {
    id: 'PRJ004',
    name: 'Sokoto Water Infrastructure',
    code: 'SWI-2024',
    description: 'Water supply infrastructure upgrade in Sokoto metropolitan area',
    status: 'planning',
    priority: 'critical',
    startDate: '2024-04-01',
    endDate: '2025-03-31',
    budget: 2900000000,
    spent: 0,
    departmentId: '2',
    managerId: '104',
    progress: 0,
    milestones: [],
    tasks: []
  },
  {
    id: 'PRJ005',
    name: 'Zaria Educational Complex',
    code: 'ZEC-2024',
    description: 'Modern educational facility development in Zaria',
    status: 'on_hold',
    priority: 'medium',
    startDate: '2024-02-15',
    endDate: '2025-08-30',
    budget: 1800000000,
    spent: 270000000,
    departmentId: '2',
    managerId: '105',
    progress: 15,
    milestones: [],
    tasks: []
  },
  {
    id: 'PRJ006',
    name: 'Jos Mining Safety Infrastructure',
    code: 'JMS-2024',
    description: 'Mining safety infrastructure and monitoring systems in Jos',
    status: 'active',
    priority: 'high',
    startDate: '2024-01-10',
    endDate: '2024-12-31',
    budget: 950000000,
    spent: 285000000,
    departmentId: '2',
    managerId: '106',
    progress: 30,
    milestones: [],
    tasks: []
  },
  {
    id: 'PRJ007',
    name: 'Bauchi Solar Street Lighting',
    code: 'BSL-2024',
    description: 'Solar-powered street lighting project in Bauchi metropolis',
    status: 'active',
    priority: 'medium',
    startDate: '2024-02-01',
    endDate: '2024-08-31',
    budget: 750000000,
    spent: 187500000,
    departmentId: '2',
    managerId: '107',
    progress: 25,
    milestones: [],
    tasks: []
  }
];

// Mock Request Forms
export const mockRequestForms: RequestForm[] = [
  {
    id: 'REQ001',
    name: 'Construction Materials for Kano Market',
    description: 'Bulk order for construction materials for Kano City Market Complex',
    requestedBy: '106',
    departmentId: '2',
    type: 'equipment',
    currentStatus: 'pending_dept_head',
    requestDate: '2024-02-15',
    items: [
      {
        id: 'ITEM001',
        name: 'Cement',
        description: 'Premium grade cement',
        quantity: 1000,
        unitPrice: 5000,
        totalPrice: 5000000,
        vendorId: 'V001'
      },
      {
        id: 'ITEM002',
        name: 'Steel Reinforcement',
        description: '16mm steel rods',
        quantity: 500,
        unitPrice: 12000,
        totalPrice: 6000000,
        vendorId: 'V002'
      }
    ],
    totalAmount: 11000000,
    priority: 'high',
    category: 'construction',
    comments: [
      'Initial request for phase 2 construction',
      'Quantities verified by site engineer'
    ],
    attachments: [
      '/documents/REQ001/material-specs.pdf',
      '/documents/REQ001/quotations.pdf'
    ]
  },
  {
    id: 'REQ002',
    name: 'Solar Panels for Kaduna Farm',
    description: 'Solar panels and mounting equipment for Kaduna Solar Farm',
    requestedBy: '107',
    departmentId: '2',
    type: 'equipment',
    currentStatus: 'pending_dept_head',
    requestDate: '2024-02-16',
    items: [
      {
        id: 'ITEM003',
        name: 'Solar Panels',
        description: '500W Monocrystalline Solar Panels',
        quantity: 2000,
        unitPrice: 150000,
        totalPrice: 300000000,
        vendorId: 'V003'
      }
    ],
    totalAmount: 300000000,
    priority: 'high',
    category: 'equipment',
    comments: [
      'Initial equipment order for phase 1',
      'Technical specifications reviewed'
    ],
    attachments: [
      '/documents/REQ002/technical-specs.pdf'
    ]
  }
]; 