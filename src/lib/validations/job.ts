import { z } from 'zod'

// Job Type Enum matching our domain model
export const JobTypeEnum = z.enum(['Full-Time', 'Part-Time', 'Contract'])

// Create Job Schema - for creating new job posts
export const CreateJobSchema = z.object({
  title: z.string()
    .min(1, 'Job title is required')
    .max(100, 'Job title must be 100 characters or less')
    .trim(),
  company: z.string()
    .min(1, 'Company name is required')
    .max(100, 'Company name must be 100 characters or less')
    .trim(),
  description: z.string()
    .min(10, 'Job description must be at least 10 characters')
    .max(5000, 'Job description must be 5000 characters or less')
    .trim(),
  location: z.string()
    .min(1, 'Location is required')
    .max(100, 'Location must be 100 characters or less')
    .trim(),
  jobType: JobTypeEnum
})

// Update Job Schema - for editing existing job posts (all fields optional)
export const UpdateJobSchema = CreateJobSchema.partial()

// Job Filters Schema - for filtering job listings
export const JobFiltersSchema = z.object({
  location: z.string().trim().optional(),
  jobType: JobTypeEnum.optional(),
  page: z.number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1),
  limit: z.number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .default(20)
})

// Authentication Schemas
export const LoginSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
})

export const RegisterSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Type exports for TypeScript usage
export type CreateJobInput = z.infer<typeof CreateJobSchema>
export type UpdateJobInput = z.infer<typeof UpdateJobSchema>
export type JobFilters = z.infer<typeof JobFiltersSchema>
export type LoginInput = z.infer<typeof LoginSchema>
export type RegisterInput = z.infer<typeof RegisterSchema>
export type JobType = z.infer<typeof JobTypeEnum>

// Validation helper functions
export const validateCreateJob = (data: unknown) => {
  return CreateJobSchema.safeParse(data)
}

export const validateUpdateJob = (data: unknown) => {
  return UpdateJobSchema.safeParse(data)
}

export const validateJobFilters = (data: unknown) => {
  return JobFiltersSchema.safeParse(data)
}

export const validateLogin = (data: unknown) => {
  return LoginSchema.safeParse(data)
}

export const validateRegister = (data: unknown) => {
  return RegisterSchema.safeParse(data)
}

// Helper to format Zod errors for display
export const formatZodErrors = (errors: z.ZodError) => {
  const formatted: Record<string, string> = {}

  if (errors && errors.issues) {
    errors.issues.forEach((error) => {
      const path = error.path.join('.')
      formatted[path] = error.message
    })
  }

  return formatted
}

// Helper to get first error message
export const getFirstErrorMessage = (errors: z.ZodError): string => {
  if (errors && errors.issues && errors.issues.length > 0) {
    return errors.issues[0].message
  }
  return 'Validation error'
}

// Helper for safe parsing with formatted errors
export const safeParseWithFormat = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } => {
  const result = schema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  return { success: false, errors: formatZodErrors(result.error) }
}