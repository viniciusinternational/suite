import { z } from 'zod';

// Helpers to gracefully handle typical UI inputs (empty strings, string numbers, nulls)
export const optionalNonEmptyString = z
  .preprocess((value) => (value === '' ? undefined : value), z.string().min(1))
  .optional();

export const optionalStringAllowEmpty = z
  .preprocess((value) => (value === '' ? undefined : value), z.string())
  .optional();

export const optionalNullableString = z
  .preprocess((value) => (value === '' ? null : value), z.string().optional().nullable())
  .nullable()
  .optional();

export const optionalPositiveNumber = z
  .preprocess((value) => {
    if (value === '' || value === undefined || value === null) return undefined;
    return value;
  }, z.coerce.number().positive())
  .optional();

const booleanLike = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0' || normalized === '') return false;
  }
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return value;
}, z.boolean());

const roleEnum = z.enum([
  'super_admin',
  'managing_director',
  'department_head',
  'hr_manager',
  'administrator',
  'accountant',
  'employee',
]);

export const updateUserSchema = z.object({
  firstName: optionalNonEmptyString,
  lastName: optionalNonEmptyString,
  fullName: optionalNonEmptyString,
  phone: optionalNonEmptyString,
  dob: optionalStringAllowEmpty,
  gender: optionalStringAllowEmpty,
  email: z.string().email().optional(),
  role: roleEnum.optional(),
  departmentId: optionalNullableString,
  employeeId: optionalNullableString,
  position: optionalNonEmptyString,
  hireDate: optionalStringAllowEmpty,
  salary: optionalPositiveNumber,
  avatar: optionalNullableString,
  permissions: z.record(z.boolean()).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updateUserDetailsSchema = z.object({
  firstName: optionalNonEmptyString,
  lastName: optionalNonEmptyString,
  fullName: optionalNonEmptyString,
  phone: optionalNonEmptyString,
  dob: optionalStringAllowEmpty,
  gender: optionalStringAllowEmpty,
  email: z.string().email().optional(),
  avatar: optionalNullableString,
  isActive: z.boolean().optional(),
});

export const updateUserEmploymentSchema = z.object({
  departmentId: optionalNullableString,
  employeeId: optionalNullableString,
  position: optionalNonEmptyString,
  hireDate: optionalStringAllowEmpty,
  salary: optionalPositiveNumber,
  role: roleEnum.optional(),
});

export const updateUserPermissionsSchema = z.object({
  permissions: z.preprocess(
    (value) => {
      if (!value || typeof value !== 'object') return value;
      const result: Record<string, boolean> = {};
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === 'string') {
          const normalized = val.trim().toLowerCase();
          if (normalized === 'true' || normalized === '1') {
            result[key] = true;
          } else if (normalized === 'false' || normalized === '0' || normalized === '') {
            result[key] = false;
          } else {
            result[key] = Boolean(val);
          }
        } else if (typeof val === 'number') {
          result[key] = val === 1;
        } else if (typeof val === 'boolean') {
          result[key] = val;
        } else {
          result[key] = Boolean(val);
        }
      }
      return result;
    },
    z.record(z.string(), z.boolean()).optional().nullable()
  ),
});

export type UpdateUserDetailsInput = z.infer<typeof updateUserDetailsSchema>;
export type UpdateUserEmploymentInput = z.infer<typeof updateUserEmploymentSchema>;
export type UpdateUserPermissionsInput = z.infer<typeof updateUserPermissionsSchema>;

