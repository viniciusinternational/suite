import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.departmentUnit.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

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
      permissions: {
        // Dashboard
        view_dashboard: true,
        // Projects Module
        view_projects: true,
        add_projects: true,
        edit_projects: true,
        delete_projects: true,
        approve_projects: true,
        // Users Module
        view_users: true,
        add_users: true,
        edit_users: true,
        delete_users: true,
        // Departments Module
        view_departments: true,
        add_departments: true,
        edit_departments: true,
        delete_departments: true,
        // Requests Module
        view_requests: true,
        add_requests: true,
        edit_requests: true,
        delete_requests: true,
        approve_requests: true,
        // Payments Module
        view_payments: true,
        add_payments: true,
        edit_payments: true,
        delete_payments: true,
        approve_payments: true,
        // Payroll Module
        view_payroll: true,
        add_payroll: true,
        edit_payroll: true,
        delete_payroll: true,
        // Leave Module
        view_leave: true,
        add_leave: true,
        edit_leave: true,
        delete_leave: true,
        approve_leave: true,
        // Reports Module
        view_reports: true,
        // Audit Logs Module
        view_audit_logs: true,
        // Events Module
        view_events: true,
        add_events: true,
        edit_events: true,
        delete_events: true,
        // Approvals Module
        view_approvals: true,
        approve_approvals: true,
        // Settings Module
        view_settings: true,
        edit_settings: true,
        // Team Module
        view_team: true,
        edit_team: true,
        // Timesheets Module
        view_timesheets: true,
        add_timesheets: true,
        edit_timesheets: true,
        delete_timesheets: true,
        // Performance Module
        view_performance: true,
        add_performance: true,
        edit_performance: true,
        delete_performance: true,
        // Memos Module
        view_memos: true,
        add_memos: true,
        edit_memos: true,
        delete_memos: true,
        // AI Assistant Module
        view_ai_assistant: true,
      } as any,
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

