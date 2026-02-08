import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// All permission keys (must match types/auth.ts) – used for full admin permissions and Admin role
const ALL_PERMISSION_KEYS = [
  'view_dashboard',
  'view_projects', 'add_projects', 'edit_projects', 'delete_projects', 'approve_projects',
  'view_users', 'add_users', 'edit_users', 'delete_users',
  'view_departments', 'add_departments', 'edit_departments', 'delete_departments',
  'view_requests', 'add_requests', 'edit_requests', 'delete_requests', 'approve_requests',
  'view_payments', 'add_payments', 'edit_payments', 'delete_payments', 'approve_payments',
  'view_payroll', 'add_payroll', 'edit_payroll', 'delete_payroll',
  'view_leave', 'add_leave', 'edit_leave', 'delete_leave', 'approve_leave',
  'view_reports',
  'view_audit_logs',
  'view_events', 'add_events', 'edit_events', 'delete_events',
  'view_approvals', 'approve_approvals', 'add_approvers', 'manage_approvers',
  'view_settings', 'edit_settings',
  'view_team', 'add_teams', 'edit_teams', 'delete_teams',
  'view_timesheets', 'add_timesheets', 'edit_timesheets', 'delete_timesheets',
  'view_performance', 'add_performance', 'edit_performance', 'delete_performance',
  'view_memos', 'add_memos', 'edit_memos', 'delete_memos',
  'view_documents', 'add_documents', 'edit_documents', 'delete_documents',
  'view_ai_assistant',
  'view_roles', 'add_roles', 'edit_roles', 'delete_roles',
  'view_accounts', 'create_accounts', 'edit_accounts', 'manage_accounts',
] as const;

const fullPermissions = Object.fromEntries(ALL_PERMISSION_KEYS.map((k) => [k, true])) as Record<string, boolean>;

async function main() {
  console.log('Starting seed...');

  // Clear existing data (order matters: delete dependents before parents)
  console.log('Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.accountTransaction.deleteMany();
  await prisma.account.deleteMany();
  // Payment and request-form chain (must run before Department)
  await prisma.paymentApproval.deleteMany();
  await prisma.paymentInstallment.deleteMany();
  await prisma.paymentItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.requestApproval.deleteMany();
  await prisma.requestComment.deleteMany();
  await prisma.requestForm.deleteMany();
  // Project chain (Project references Department)
  await prisma.approval.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.project.deleteMany();
  // Event/Memo/Deduction/Allowance reference Department (many-to-many or relations)
  await prisma.event.deleteMany();
  await prisma.memo.deleteMany();
  await prisma.payrollDeductionApplication.deleteMany();
  await prisma.payrollAllowanceApplication.deleteMany();
  await prisma.deduction.deleteMany();
  await prisma.allowance.deleteMany();
  await prisma.departmentUnit.deleteMany();
  await prisma.department.deleteMany();
  // Payroll and user-dependent (before User)
  await prisma.payrollApproval.deleteMany();
  await prisma.payrollEntry.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();

  // ========== FIRST PASS: Create Departments Without Heads ==========
  console.log('Creating departments...');
  const departments = [
    {
      name: 'Executive Management',
      code: 'EXEC',
      sector: 'administration',
      description: 'Executive leadership and strategic oversight',
      isActive: true,
    },
    // {
    //   name: 'Engineering Department',
    //   code: 'ENG',
    //   sector: 'engineering',
    //   description: 'Technical design and project execution',
    //   isActive: true,
    // },
    {
      name: 'Human Resources',
      code: 'HR',
      sector: 'administration',
      description: 'Employee management and organizational development',
      isActive: true,
    },
    {
      name: 'Finance & Accounting',
      code: 'FIN',
      sector: 'finance',
      description: 'Financial management and accounting operations',
      isActive: true,
    },
    {
      name: 'Administration',
      code: 'ADMIN',
      sector: 'administration',
      description: 'General administrative support and operations',
      isActive: true,
    },
    // {
    //   name: 'Operations',
    //   code: 'OPS',
    //   sector: 'operations',
    //   description: 'Day-to-day operational activities and coordination',
    //   isActive: true,
    // },
    {
      name: 'Information Technology',
      code: 'IT',
      sector: 'it',
      description: 'IT infrastructure and software support',
      isActive: true,
    },
    {
      name: 'Security & Logistics',
      code: 'SEC',
      sector: 'security',
      description: 'Security and logistics infrastructure',
      isActive: true,
    },
    {
      name: 'Legal Affairs',
      code: 'LEGAL',
      sector: 'legal',
      description: 'Legal compliance and corporate governance',
      isActive: true,
    },
    // {
    //   name: 'Procurement',
    //   code: 'PROC',
    //   sector: 'procurement',
    //   description: 'Purchasing and vendor management',
    //   isActive: true,
    // },
  ];

  const createdDepartments = await Promise.all(
    departments.map((dept) =>
      prisma.department.create({
        data: dept,
      })
    )
  );

  const departmentMap = new Map(createdDepartments.map((dept) => [dept.code, dept]));

  const ensureDepartment = (code: string) => {
    const department = departmentMap.get(code);

    if (!department) {
      throw new Error(`Required department with code "${code}" not found during seeding.`);
    }

    return department;
  };

  const execDept = ensureDepartment('EXEC');
  ['HR', 'FIN', 'ADMIN', 'SEC', 'IT', 'LEGAL'].forEach(ensureDepartment);

  // ========== Create Accounts ==========
  console.log('Creating accounts...');
  const accounts = [
    { name: 'Main Operating Account', code: 'OP-001', currency: 'NGN', description: 'Primary operations account', allowNegativeBalance: false },
    { name: 'Payroll Account', code: 'PAY-001', currency: 'NGN', description: 'Payroll disbursements', allowNegativeBalance: false },
  ];
  const createdAccounts = await Promise.all(
    accounts.map((acc) => prisma.account.create({ data: acc }))
  );
  console.log(`Created ${createdAccounts.length} accounts`);

  // ========== SECOND PASS: Create Users ==========
  console.log('Creating users...');
  const users = [
    // Super Admin
    {
      firstName: 'Umar',
      lastName: 'Jere',
      fullName: 'Umar Jere',
      phone: '+234-7055793353',
      dob: '1980-05-15',
      gender: 'male',
      email: 'umar.jere@viniciusint.com',
      role: 'admin',
      departmentId: execDept.id,
      employeeId: 'EMP001',
      position: 'Super Admin',
      hireDate: '2019-01-10',
      salary: 15000,
      avatar: '/avatars/person.jpg',
      isActive: true,
      permissions: fullPermissions,
    },
    {
      firstName: 'Safullahi',
      lastName: 'Babangida',
      fullName: 'Safullahi Babangida',
      phone: '+234-7012345678',
      dob: '1982-07-21',
      gender: 'male',
      email: 'ceo@viniciusint.com',
      role: 'admin',
      departmentId: execDept.id,
      employeeId: 'EMP002',
      position: 'Chief Executive Officer',
      hireDate: '2015-03-01',
      salary: 200000,
      avatar: '/avatars/person.jpg',
      isActive: true,
      permissions: {
        view_dashboard: true,
        view_projects: true,
        add_projects: true,
        edit_projects: true,
        delete_projects: true,
        approve_projects: true,
        view_users: true,
        add_users: true,
        edit_users: true,
        delete_users: true,
        view_departments: true,
        add_departments: true,
        edit_departments: true,
        delete_departments: true,
        view_requests: true,
        add_requests: true,
        edit_requests: true,
        delete_requests: true,
        approve_requests: true,
        view_payments: true,
        add_payments: true,
        edit_payments: true,
        delete_payments: true,
        approve_payments: true,
        view_payroll: true,
        add_payroll: true,
        edit_payroll: true,
        delete_payroll: true,
        view_leave: true,
        add_leave: true,
        edit_leave: true,
        delete_leave: true,
        approve_leave: true,
        view_reports: true,
        view_audit_logs: true,
        view_events: true,
        add_events: true,
        edit_events: true,
        delete_events: true,
        view_approvals: true,
        approve_approvals: true,
        view_settings: true,
        edit_settings: true,
        view_team: true,
        edit_team: true,
        view_timesheets: true,
        add_timesheets: true,
        edit_timesheets: true,
        delete_timesheets: true,
        view_performance: true,
        add_performance: true,
        edit_performance: true,
        delete_performance: true,
        view_memos: true,
        add_memos: true,
        edit_memos: true,
        delete_memos: true,
        view_ai_assistant: true,
      } as any,
    },
    {
      firstName: 'Hauwa',
      lastName: 'Allahbura',
      fullName: 'Hauwa Allahbura',
      phone: '+234-7087654321',
      dob: '1988-11-05',
      gender: 'female',
      email: 'hauwaallahbura@viniciusint.com',
      role: 'admin',
      departmentId: execDept.id,
      employeeId: 'EMP003',
      position: 'Executive Director',
      hireDate: '2017-06-15',
      salary: 180000,
      avatar: '/avatars/person.jpg',
      isActive: true,
      permissions: {
        view_dashboard: true,
        view_projects: true,
        add_projects: true,
        edit_projects: true,
        delete_projects: true,
        approve_projects: true,
        view_users: true,
        add_users: true,
        edit_users: true,
        delete_users: true,
        view_departments: true,
        add_departments: true,
        edit_departments: true,
        delete_departments: true,
        view_requests: true,
        add_requests: true,
        edit_requests: true,
        delete_requests: true,
        approve_requests: true,
        view_payments: true,
        add_payments: true,
        edit_payments: true,
        delete_payments: true,
        approve_payments: true,
        view_payroll: true,
        add_payroll: true,
        edit_payroll: true,
        delete_payroll: true,
        view_leave: true,
        add_leave: true,
        edit_leave: true,
        delete_leave: true,
        approve_leave: true,
        view_reports: true,
        view_audit_logs: true,
        view_events: true,
        add_events: true,
        edit_events: true,
        delete_events: true,
        view_approvals: true,
        approve_approvals: true,
        view_settings: true,
        edit_settings: true,
        view_team: true,
        edit_team: true,
        view_timesheets: true,
        add_timesheets: true,
        edit_timesheets: true,
        delete_timesheets: true,
        view_performance: true,
        add_performance: true,
        edit_performance: true,
        delete_performance: true,
        view_memos: true,
        add_memos: true,
        edit_memos: true,
        delete_memos: true,
        view_ai_assistant: true,
      } as any,
    },
    {
      firstName: 'Trial',
      lastName: 'Account',
      fullName: 'Trial Account',
      phone: '+234-7000000000',
      dob: '1990-01-01',
      gender: 'other',
      email: 'trial@viniciusint.com',
      role: 'admin',
      departmentId: execDept.id,
      employeeId: 'EMP004',
      position: 'Administrator',
      hireDate: '2020-01-01',
      salary: 120000,
      avatar: '/avatars/person.jpg',
      isActive: true,
      permissions: {
        view_dashboard: true,
        view_projects: true,
        add_projects: true,
        edit_projects: true,
        delete_projects: true,
        approve_projects: true,
        view_users: true,
        add_users: true,
        edit_users: true,
        delete_users: true,
        view_departments: true,
        add_departments: true,
        edit_departments: true,
        delete_departments: true,
        view_requests: true,
        add_requests: true,
        edit_requests: true,
        delete_requests: true,
        approve_requests: true,
        view_payments: true,
        add_payments: true,
        edit_payments: true,
        delete_payments: true,
        approve_payments: true,
        view_payroll: true,
        add_payroll: true,
        edit_payroll: true,
        delete_payroll: true,
        view_leave: true,
        add_leave: true,
        edit_leave: true,
        delete_leave: true,
        approve_leave: true,
        view_reports: true,
        view_audit_logs: true,
        view_events: true,
        add_events: true,
        edit_events: true,
        delete_events: true,
        view_approvals: true,
        approve_approvals: true,
        view_settings: true,
        edit_settings: true,
        view_team: true,
        edit_team: true,
        view_timesheets: true,
        add_timesheets: true,
        edit_timesheets: true,
        delete_timesheets: true,
        view_performance: true,
        add_performance: true,
        edit_performance: true,
        delete_performance: true,
        view_memos: true,
        add_memos: true,
        edit_memos: true,
        delete_memos: true,
        view_ai_assistant: true,
      } as any,
    },
  ];

  const createdUsers = await Promise.all(
    users.map((user) =>
      prisma.user.create({
        data: user,
      })
    )
  );

  // Map user emails to user IDs
  const userEmailToId = new Map(createdUsers.map((u) => [u.email, u.id]));

  // ========== Create default Role templates ==========
  console.log('Creating default roles...');
  const roleResult = await prisma.role.createMany({
    data: [
      {
        name: 'Admin',
        code: 'ADMIN',
        description: 'Full access to all modules',
        permissions: fullPermissions,
      },
      {
        name: 'Employee',
        code: 'EMPLOYEE',
        description: 'Basic employee access',
        permissions: {
          view_dashboard: true,
          view_team: true,
          view_timesheets: true,
          view_events: true,
          view_memos: true,
          view_documents: true,
        } as Record<string, boolean>,
      },
    ],
  });

  // ========== THIRD PASS: Update Departments with Heads ==========
  console.log('Assigning department heads...');
  const departmentHeads = [
    // { email: 'sarah.johnson@vinisuite.com', deptCode: 'EXEC' },
    // { email: 'mike.wilson@vinisuite.com', deptCode: 'ENG' },
    // { email: 'david.brown@vinisuite.com', deptCode: 'HR' },
    // { email: 'lisa.garcia@vinisuite.com', deptCode: 'FIN' },
    // { email: 'robert.taylor@vinisuite.com', deptCode: 'ADMIN' },
    // { email: 'jennifer.white@vinisuite.com', deptCode: 'OPS' },
    // { email: 'michael.chen@vinisuite.com', deptCode: 'IT' },
    // { email: 'amanda.rodriguez@vinisuite.com', deptCode: 'MKT' },
    // { email: 'thomas.anderson@vinisuite.com', deptCode: 'LEGAL' },
  ];

  // for (const { email, deptCode } of departmentHeads) {
  //   const userId = userEmailToId.get(email);
  //   const dept = createdDepartments.find((d) => d.code === deptCode);
  //   if (userId && dept) {
  //     await prisma.department.update({
  //       where: { id: dept.id },
  //       data: { headId: userId },
  //     });
  //   }
  // }

  // Find manager IDs by email
  const findUserId = (email: string) => userEmailToId.get(email) || null;

  // ========== FOURTH PASS: Create Department Units ==========
  console.log('Creating department units...');
  const makeDepartmentUnit = (unit: {
    name: string;
    deptCode: string;
    managerEmail?: string | null;
  }) => {
    const department = departmentMap.get(unit.deptCode);

    if (!department) {
      console.warn(
        `Skipping unit "${unit.name}" - department with code "${unit.deptCode}" not found.`
      );
      return null;
    }

    return {
      name: unit.name,
      departmentId: department.id,
      managerId: unit.managerEmail ? findUserId(unit.managerEmail) : null,
      isActive: true,
    };
  };

  const departmentUnitsData = [
    // Executive Management Units
    {
      name: 'Board of Directors',
      deptCode: 'EXEC',
      managerEmail: 'sarah.johnson@vinisuite.com',
    },
    {
      name: 'Strategic Planning',
      deptCode: 'EXEC',
      managerEmail: 'sarah.johnson@vinisuite.com',
    },
    // Engineering Units
    {
      name: 'Structural Engineering',
      deptCode: 'ENG',
      managerEmail: 'emily.chen@vinisuite.com',
    },
    {
      name: 'Civil Engineering',
      deptCode: 'ENG',
      managerEmail: 'mike.wilson@vinisuite.com',
    },
    {
      name: 'MEP Engineering',
      deptCode: 'ENG',
      managerEmail: 'daniel.kim@vinisuite.com',
    },
    // HR Units
    {
      name: 'Recruitment',
      deptCode: 'HR',
      managerEmail: 'karen.martinez@vinisuite.com',
    },
    {
      name: 'Employee Relations',
      deptCode: 'HR',
      managerEmail: 'david.brown@vinisuite.com',
    },
    {
      name: 'Training & Development',
      deptCode: 'HR',
      managerEmail: 'rachel.green@vinisuite.com',
    },
    // Finance Units
    {
      name: 'Accounts Payable',
      deptCode: 'FIN',
      managerEmail: 'james.lee@vinisuite.com',
    },
    {
      name: 'Accounts Receivable',
      deptCode: 'FIN',
      managerEmail: 'lisa.garcia@vinisuite.com',
    },
    // Operations Units
    {
      name: 'Project Coordination',
      deptCode: 'OPS',
      managerEmail: 'jennifer.white@vinisuite.com',
    },
    // IT Units
    {
      name: 'Software Development',
      deptCode: 'IT',
      managerEmail: 'christopher.harris@vinisuite.com',
    },
    {
      name: 'IT Support',
      deptCode: 'IT',
      managerEmail: 'michael.chen@vinisuite.com',
    },
    // Marketing Units
    {
      name: 'Digital Marketing',
      deptCode: 'MKT',
      managerEmail: 'jessica.moore@vinisuite.com',
    },
    // Legal Units
    {
      name: 'Corporate Compliance',
      deptCode: 'LEGAL',
      managerEmail: 'thomas.anderson@vinisuite.com',
    },
    // Procurement Units
    {
      name: 'Vendor Management',
      deptCode: 'PROC',
      managerEmail: 'susan.davis@vinisuite.com',
    },
  ];

  const departmentUnits = departmentUnitsData
    .map(makeDepartmentUnit)
    .filter(
      (unit): unit is NonNullable<ReturnType<typeof makeDepartmentUnit>> => unit !== null
    );

  // await Promise.all(
  //   departmentUnits.map((unit) =>
  //     prisma.departmentUnit.create({
  //       data: unit,
  //     })
  //   )
  // );

  console.log('Seed completed successfully!');
  console.log(`Created: ${createdDepartments.length} departments`);
  console.log(`Created: ${createdUsers.length} users`);
  console.log(`Created: ${roleResult.count} roles`);
  console.log(`Prepared: ${departmentUnits.length} department units`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

