import { PrismaClient, Prisma } from '@prisma/client';

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
    {
      name: 'Engineering Department',
      code: 'ENG',
      sector: 'engineering',
      description: 'Technical design and project execution',
      isActive: true,
    },
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
    {
      name: 'Operations',
      code: 'OPS',
      sector: 'operations',
      description: 'Day-to-day operational activities and coordination',
      isActive: true,
    },
    {
      name: 'Information Technology',
      code: 'IT',
      sector: 'it',
      description: 'IT infrastructure and software support',
      isActive: true,
    },
    {
      name: 'Marketing & Communications',
      code: 'MKT',
      sector: 'marketing',
      description: 'Branding, marketing, and public relations',
      isActive: true,
    },
    {
      name: 'Legal Affairs',
      code: 'LEGAL',
      sector: 'legal',
      description: 'Legal compliance and corporate governance',
      isActive: true,
    },
    {
      name: 'Procurement',
      code: 'PROC',
      sector: 'procurement',
      description: 'Purchasing and vendor management',
      isActive: true,
    },
  ];

  const createdDepartments = await Promise.all(
    departments.map((dept) =>
      prisma.department.create({
        data: dept,
      })
    )
  );

  const execDept = createdDepartments.find((d) => d.code === 'EXEC')!;
  const engDept = createdDepartments.find((d) => d.code === 'ENG')!;
  const hrDept = createdDepartments.find((d) => d.code === 'HR')!;
  const finDept = createdDepartments.find((d) => d.code === 'FIN')!;
  const adminDept = createdDepartments.find((d) => d.code === 'ADMIN')!;
  const opsDept = createdDepartments.find((d) => d.code === 'OPS')!;
  const itDept = createdDepartments.find((d) => d.code === 'IT')!;
  const mktDept = createdDepartments.find((d) => d.code === 'MKT')!;
  const legalDept = createdDepartments.find((d) => d.code === 'LEGAL')!;
  const procDept = createdDepartments.find((d) => d.code === 'PROC')!;

  // ========== SECOND PASS: Create Users ==========
  console.log('Creating users...');
  const users = [
    // Super Admin
    {
      firstName: 'John',
      lastName: 'Smith',
      fullName: 'John Smith',
      phone: '+1-555-0001',
      dob: '1980-05-15',
      gender: 'male',
      email: 'umar.jere@viniciusint.com',
      role: 'super_admin',
      departmentId: execDept.id,
      employeeId: 'EMP001',
      position: 'Super Administrator',
      hireDate: '2019-01-10',
      salary: 150000,
      avatar: '/avatars/john.jpg',
      isActive: true,
      permissions: {
        allModules: true,
        userManagement: true,
        systemSettings: true,
      } as any,
    },
    // Managing Director
    {
      firstName: 'Sarah',
      lastName: 'Johnson',
      fullName: 'Sarah Johnson',
      phone: '+1-555-0002',
      dob: '1975-08-20',
      gender: 'female',
      email: 'sarah.johnson@vinisuite.com',
      role: 'managing_director',
      departmentId: execDept.id,
      employeeId: 'EMP002',
      position: 'Managing Director',
      hireDate: '2020-02-15',
      salary: 180000,
      avatar: '/avatars/sarah.jpg',
      isActive: true,
      permissions: {
        financials: true,
        approvals: true,
        reports: true,
      } as any,
    },
    // Department Heads
    {
      firstName: 'Mike',
      lastName: 'Wilson',
      fullName: 'Mike Wilson',
      phone: '+1-555-0003',
      dob: '1985-03-10',
      gender: 'male',
      email: 'mike.wilson@vinisuite.com',
      role: 'department_head',
      departmentId: engDept.id,
      employeeId: 'EMP003',
      position: 'Head of Engineering',
      hireDate: '2021-03-15',
      salary: 130000,
      avatar: '/avatars/mike.jpg',
      isActive: true,
      permissions: {
        projects: true,
        budget: true,
        reports: true,
      } as any,
    },
    {
      firstName: 'David',
      lastName: 'Brown',
      fullName: 'David Brown',
      phone: '+1-555-0004',
      dob: '1982-11-05',
      gender: 'male',
      email: 'david.brown@vinisuite.com',
      role: 'department_head',
      departmentId: hrDept.id,
      employeeId: 'EMP004',
      position: 'Head of Human Resources',
      hireDate: '2020-06-20',
      salary: 120000,
      avatar: '/avatars/david.jpg',
      isActive: true,
      permissions: {
        hrManagement: true,
        payroll: true,
        employeeDirectory: true,
      } as any,
    },
    {
      firstName: 'Lisa',
      lastName: 'Garcia',
      fullName: 'Lisa Garcia',
      phone: '+1-555-0005',
      dob: '1987-07-22',
      gender: 'female',
      email: 'lisa.garcia@vinisuite.com',
      role: 'department_head',
      departmentId: finDept.id,
      employeeId: 'EMP005',
      position: 'Head of Finance',
      hireDate: '2020-11-10',
      salary: 125000,
      avatar: '/avatars/lisa.jpg',
      isActive: true,
      permissions: {
        financials: true,
        reports: true,
      },
    },
    {
      firstName: 'Robert',
      lastName: 'Taylor',
      fullName: 'Robert Taylor',
      phone: '+1-555-0006',
      dob: '1984-12-08',
      gender: 'male',
      email: 'robert.taylor@vinisuite.com',
      role: 'department_head',
      departmentId: adminDept.id,
      employeeId: 'EMP006',
      position: 'Head of Administration',
      hireDate: '2019-08-15',
      salary: 110000,
      avatar: '/avatars/robert.jpg',
      isActive: true,
      permissions: {
        admin: true,
        approvals: true,
      } as any,
    },
    {
      firstName: 'Jennifer',
      lastName: 'White',
      fullName: 'Jennifer White',
      phone: '+1-555-0007',
      dob: '1986-04-18',
      gender: 'female',
      email: 'jennifer.white@vinisuite.com',
      role: 'department_head',
      departmentId: opsDept.id,
      employeeId: 'EMP007',
      position: 'Head of Operations',
      hireDate: '2021-05-10',
      salary: 115000,
      avatar: '/avatars/jennifer.jpg',
      isActive: true,
      permissions: {
        operations: true,
        reports: true,
      } as any,
    },
    {
      firstName: 'Michael',
      lastName: 'Chen',
      fullName: 'Michael Chen',
      phone: '+1-555-0008',
      dob: '1983-09-30',
      gender: 'male',
      email: 'michael.chen@vinisuite.com',
      role: 'department_head',
      departmentId: itDept.id,
      employeeId: 'EMP008',
      position: 'Head of Information Technology',
      hireDate: '2020-04-20',
      salary: 135000,
      avatar: '/avatars/michael.jpg',
      isActive: true,
      permissions: {
        it: true,
        systemSettings: true,
      } as any,
    },
    {
      firstName: 'Amanda',
      lastName: 'Rodriguez',
      fullName: 'Amanda Rodriguez',
      phone: '+1-555-0009',
      dob: '1988-02-14',
      gender: 'female',
      email: 'amanda.rodriguez@vinisuite.com',
      role: 'department_head',
      departmentId: mktDept.id,
      employeeId: 'EMP009',
      position: 'Head of Marketing',
      hireDate: '2022-01-15',
      salary: 118000,
      avatar: '/avatars/amanda.jpg',
      isActive: true,
      permissions: {
        marketing: true,
        branding: true,
      } as any,
    },
    {
      firstName: 'Thomas',
      lastName: 'Anderson',
      fullName: 'Thomas Anderson',
      phone: '+1-555-0010',
      dob: '1979-06-25',
      gender: 'male',
      email: 'thomas.anderson@vinisuite.com',
      role: 'department_head',
      departmentId: legalDept.id,
      employeeId: 'EMP010',
      position: 'Head of Legal Affairs',
      hireDate: '2019-11-05',
      salary: 140000,
      avatar: '/avatars/thomas.jpg',
      isActive: true,
      permissions: {
        legal: true,
        compliance: true,
      } as any,
    },
    // HR Manager
    {
      firstName: 'Karen',
      lastName: 'Martinez',
      fullName: 'Karen Martinez',
      phone: '+1-555-0011',
      dob: '1989-03-12',
      gender: 'female',
      email: 'karen.martinez@vinisuite.com',
      role: 'hr_manager',
      departmentId: hrDept.id,
      employeeId: 'EMP011',
      position: 'HR Manager',
      hireDate: '2021-07-20',
      salary: 95000,
      avatar: '/avatars/karen.jpg',
      isActive: true,
      permissions: {
        hrManagement: true,
        payroll: true,
      } as any,
    },
    // Accountant
    {
      firstName: 'James',
      lastName: 'Lee',
      fullName: 'James Lee',
      phone: '+1-555-0012',
      dob: '1990-10-08',
      gender: 'male',
      email: 'james.lee@vinisuite.com',
      role: 'accountant',
      departmentId: finDept.id,
      employeeId: 'EMP012',
      position: 'Senior Accountant',
      hireDate: '2022-03-01',
      salary: 78000,
      avatar: '/avatars/james.jpg',
      isActive: true,
      permissions: {
        accounting: true,
        payments: true,
      } as any,
    },
    // Administrator
    {
      firstName: 'Patricia',
      lastName: 'Clark',
      fullName: 'Patricia Clark',
      phone: '+1-555-0013',
      dob: '1991-05-27',
      gender: 'female',
      email: 'patricia.clark@vinisuite.com',
      role: 'administrator',
      departmentId: adminDept.id,
      employeeId: 'EMP013',
      position: 'System Administrator',
      hireDate: '2021-11-10',
      salary: 70000,
      avatar: '/avatars/patricia.jpg',
      isActive: true,
      permissions: {
        admin: true,
        approvals: true,
      } as any,
    },
    // Project Manager
    {
      firstName: 'Emily',
      lastName: 'Chen',
      fullName: 'Emily Chen',
      phone: '+1-555-0014',
      dob: '1987-08-15',
      gender: 'female',
      email: 'emily.chen@vinisuite.com',
      role: 'project_manager',
      departmentId: engDept.id,
      employeeId: 'EMP014',
      position: 'Senior Project Manager',
      hireDate: '2021-09-25',
      salary: 98000,
      avatar: '/avatars/emily.jpg',
      isActive: true,
      permissions: {
        projects: true,
        reports: true,
      } as any,
    },
    // Employees
    {
      firstName: 'Maria',
      lastName: 'Rodriguez',
      fullName: 'Maria Rodriguez',
      phone: '+1-555-0015',
      dob: '1992-12-20',
      gender: 'female',
      email: 'maria.rodriguez@vinisuite.com',
      role: 'employee',
      departmentId: engDept.id,
      employeeId: 'EMP015',
      position: 'Civil Engineer',
      hireDate: '2023-01-10',
      salary: 65000,
      avatar: '/avatars/maria.jpg',
      isActive: true,
      permissions: {} as any,
    },
    {
      firstName: 'Daniel',
      lastName: 'Kim',
      fullName: 'Daniel Kim',
      phone: '+1-555-0016',
      dob: '1993-06-05',
      gender: 'male',
      email: 'daniel.kim@vinisuite.com',
      role: 'employee',
      departmentId: engDept.id,
      employeeId: 'EMP016',
      position: 'Structural Engineer',
      hireDate: '2022-11-15',
      salary: 70000,
      avatar: '/avatars/daniel.jpg',
      isActive: true,
      permissions: {} as any,
    },
    {
      firstName: 'Rachel',
      lastName: 'Green',
      fullName: 'Rachel Green',
      phone: '+1-555-0017',
      dob: '1994-01-28',
      gender: 'female',
      email: 'rachel.green@vinisuite.com',
      role: 'employee',
      departmentId: hrDept.id,
      employeeId: 'EMP017',
      position: 'HR Specialist',
      hireDate: '2023-05-20',
      salary: 58000,
      avatar: '/avatars/rachel.jpg',
      isActive: true,
      permissions: {} as any,
    },
    {
      firstName: 'Brian',
      lastName: 'Thompson',
      fullName: 'Brian Thompson',
      phone: '+1-555-0018',
      dob: '1991-09-14',
      gender: 'male',
      email: 'brian.thompson@vinisuite.com',
      role: 'employee',
      departmentId: finDept.id,
      employeeId: 'EMP018',
      position: 'Accountant',
      hireDate: '2022-08-01',
      salary: 60000,
      avatar: '/avatars/brian.jpg',
      isActive: true,
      permissions: {} as any,
    },
    {
      firstName: 'Nicole',
      lastName: 'Williams',
      fullName: 'Nicole Williams',
      phone: '+1-555-0019',
      dob: '1995-04-02',
      gender: 'female',
      email: 'nicole.williams@vinisuite.com',
      role: 'employee',
      departmentId: opsDept.id,
      employeeId: 'EMP019',
      position: 'Operations Coordinator',
      hireDate: '2023-03-15',
      salary: 55000,
      avatar: '/avatars/nicole.jpg',
      isActive: true,
      permissions: {} as any,
    },
    {
      firstName: 'Christopher',
      lastName: 'Harris',
      fullName: 'Christopher Harris',
      phone: '+1-555-0020',
      dob: '1990-11-18',
      gender: 'male',
      email: 'christopher.harris@vinisuite.com',
      role: 'employee',
      departmentId: itDept.id,
      employeeId: 'EMP020',
      position: 'Software Developer',
      hireDate: '2022-06-10',
      salary: 85000,
      avatar: '/avatars/christopher.jpg',
      isActive: true,
      permissions: {} as any,
    },
    {
      firstName: 'Jessica',
      lastName: 'Moore',
      fullName: 'Jessica Moore',
      phone: '+1-555-0021',
      dob: '1993-07-30',
      gender: 'female',
      email: 'jessica.moore@vinisuite.com',
      role: 'employee',
      departmentId: mktDept.id,
      employeeId: 'EMP021',
      position: 'Marketing Specialist',
      hireDate: '2023-02-01',
      salary: 57000,
      avatar: '/avatars/jessica.jpg',
      isActive: true,
      permissions: {} as any,
    },
    {
      firstName: 'Kevin',
      lastName: 'Jackson',
      fullName: 'Kevin Jackson',
      phone: '+1-555-0022',
      dob: '1992-04-11',
      gender: 'male',
      email: 'kevin.jackson@vinisuite.com',
      role: 'employee',
      departmentId: legalDept.id,
      employeeId: 'EMP022',
      position: 'Legal Assistant',
      hireDate: '2023-04-10',
      salary: 52000,
      avatar: '/avatars/kevin.jpg',
      isActive: true,
      permissions: {} as any,
    },
    {
      firstName: 'Susan',
      lastName: 'Davis',
      fullName: 'Susan Davis',
      phone: '+1-555-0023',
      dob: '1988-08-25',
      gender: 'female',
      email: 'susan.davis@vinisuite.com',
      role: 'employee',
      departmentId: procDept.id,
      employeeId: 'EMP023',
      position: 'Procurement Officer',
      hireDate: '2022-09-15',
      salary: 62000,
      avatar: '/avatars/susan.jpg',
      isActive: true,
      permissions: {} as any,
    },
    {
      firstName: 'Mark',
      lastName: 'Lewis',
      fullName: 'Mark Lewis',
      phone: '+1-555-0024',
      dob: '1989-12-07',
      gender: 'male',
      email: 'mark.lewis@vinisuite.com',
      role: 'employee',
      departmentId: adminDept.id,
      employeeId: 'EMP024',
      position: 'Administrative Assistant',
      hireDate: '2022-10-05',
      salary: 48000,
      avatar: '/avatars/mark.jpg',
      isActive: true,
      permissions: {} as any,
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
    { email: 'sarah.johnson@vinisuite.com', deptCode: 'EXEC' },
    { email: 'mike.wilson@vinisuite.com', deptCode: 'ENG' },
    { email: 'david.brown@vinisuite.com', deptCode: 'HR' },
    { email: 'lisa.garcia@vinisuite.com', deptCode: 'FIN' },
    { email: 'robert.taylor@vinisuite.com', deptCode: 'ADMIN' },
    { email: 'jennifer.white@vinisuite.com', deptCode: 'OPS' },
    { email: 'michael.chen@vinisuite.com', deptCode: 'IT' },
    { email: 'amanda.rodriguez@vinisuite.com', deptCode: 'MKT' },
    { email: 'thomas.anderson@vinisuite.com', deptCode: 'LEGAL' },
  ];

  for (const { email, deptCode } of departmentHeads) {
    const userId = userEmailToId.get(email);
    const dept = createdDepartments.find((d) => d.code === deptCode);
    if (userId && dept) {
      await prisma.department.update({
        where: { id: dept.id },
        data: { headId: userId },
      });
    }
  }

  // Find manager IDs by email
  const findUserId = (email: string) => userEmailToId.get(email) || null;

  // ========== FOURTH PASS: Create Department Units ==========
  console.log('Creating department units...');
  const departmentUnits = [
    // Executive Management Units
    {
      name: 'Board of Directors',
      departmentId: execDept.id,
      managerId: findUserId('sarah.johnson@vinisuite.com'),
      isActive: true,
    },
    {
      name: 'Strategic Planning',
      departmentId: execDept.id,
      managerId: findUserId('sarah.johnson@vinisuite.com'),
      isActive: true,
    },
    // Engineering Units
    {
      name: 'Structural Engineering',
      departmentId: engDept.id,
      managerId: findUserId('emily.chen@vinisuite.com'),
      isActive: true,
    },
    {
      name: 'Civil Engineering',
      departmentId: engDept.id,
      managerId: findUserId('mike.wilson@vinisuite.com'),
      isActive: true,
    },
    {
      name: 'MEP Engineering',
      departmentId: engDept.id,
      managerId: findUserId('daniel.kim@vinisuite.com'),
      isActive: true,
    },
    // HR Units
    {
      name: 'Recruitment',
      departmentId: hrDept.id,
      managerId: findUserId('karen.martinez@vinisuite.com'),
      isActive: true,
    },
    {
      name: 'Employee Relations',
      departmentId: hrDept.id,
      managerId: findUserId('david.brown@vinisuite.com'),
      isActive: true,
    },
    {
      name: 'Training & Development',
      departmentId: hrDept.id,
      managerId: findUserId('rachel.green@vinisuite.com'),
      isActive: true,
    },
    // Finance Units
    {
      name: 'Accounts Payable',
      departmentId: finDept.id,
      managerId: findUserId('james.lee@vinisuite.com'),
      isActive: true,
    },
    {
      name: 'Accounts Receivable',
      departmentId: finDept.id,
      managerId: findUserId('lisa.garcia@vinisuite.com'),
      isActive: true,
    },
    // Operations Units
    {
      name: 'Project Coordination',
      departmentId: opsDept.id,
      managerId: findUserId('jennifer.white@vinisuite.com'),
      isActive: true,
    },
    // IT Units
    {
      name: 'Software Development',
      departmentId: itDept.id,
      managerId: findUserId('christopher.harris@vinisuite.com'),
      isActive: true,
    },
    {
      name: 'IT Support',
      departmentId: itDept.id,
      managerId: findUserId('michael.chen@vinisuite.com'),
      isActive: true,
    },
    // Marketing Units
    {
      name: 'Digital Marketing',
      departmentId: mktDept.id,
      managerId: findUserId('jessica.moore@vinisuite.com'),
      isActive: true,
    },
    // Legal Units
    {
      name: 'Corporate Compliance',
      departmentId: legalDept.id,
      managerId: findUserId('thomas.anderson@vinisuite.com'),
      isActive: true,
    },
    // Procurement Units
    {
      name: 'Vendor Management',
      departmentId: procDept.id,
      managerId: findUserId('susan.davis@vinisuite.com'),
      isActive: true,
    },
  ];

  await Promise.all(
    departmentUnits.map((unit) =>
      prisma.departmentUnit.create({
        data: unit,
      })
    )
  );

  console.log('Seed completed successfully!');
  console.log(`Created: ${createdDepartments.length} departments`);
  console.log(`Created: ${createdUsers.length} users`);
  console.log(`Created: ${departmentUnits.length} department units`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

