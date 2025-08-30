import { z } from 'zod'

// Common validation patterns
const emailSchema = z.string().email('Invalid email format').toLowerCase()
const phoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional().nullable()
const uuidSchema = z.string().uuid('Invalid ID format')

// User validation schemas
export const userCreateSchema = z.object({
  email: emailSchema,
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional().nullable(),
  isAdmin: z.boolean().default(false),
})

export const userUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  isAdmin: z.boolean().optional(),
})

// Client validation schemas
export const clientCreateSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),
  email: emailSchema,
  phone: phoneSchema,
  company: z.string()
    .max(200, 'Company name must be less than 200 characters')
    .trim()
    .optional()
    .nullable(),
  address: z.string()
    .max(500, 'Address must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),
  status: z.enum(['active', 'inactive', 'archived']).default('active'),
})

export const clientUpdateSchema = clientCreateSchema.partial()

export const clientQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['active', 'inactive', 'archived']).optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'company']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Case validation schemas
const caseBaseSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .nullable(),
  caseType: z.string()
    .min(1, 'Case type is required')
    .max(100, 'Case type must be less than 100 characters')
    .trim(),
  status: z.enum(['open', 'pending', 'closed', 'archived']).default('open'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional().nullable(),
  clientId: uuidSchema,
})

export const caseCreateSchema = caseBaseSchema.refine(
  (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
  {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  }
)

export const caseUpdateSchema = caseBaseSchema.partial().omit({ clientId: true })

export const caseQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  status: z.enum(['open', 'pending', 'closed', 'archived']).optional(),
  caseType: z.string().max(100).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  clientId: uuidSchema.optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'title', 'status', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Document validation schemas
export const documentCreateSchema = z.object({
  caseId: uuidSchema.optional().nullable(),
  category: z.enum(['general', 'contract', 'evidence', 'correspondence', 'legal', 'financial']).default('general'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),
  isConfidential: z.coerce.boolean().default(false),
})

export const documentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  category: z.enum(['general', 'contract', 'evidence', 'correspondence', 'legal', 'financial']).optional(),
  caseId: uuidSchema.optional(),
  isConfidential: z.coerce.boolean().optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['uploadedAt', 'filename', 'fileSize', 'category']).default('uploadedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// File upload validation
export const fileUploadSchema = z.object({
  file: z.any().refine((file) => file instanceof File, 'File is required'),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z.array(z.string()).default([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]),
}).refine(
  (data) => data.file.size <= data.maxSize,
  (data) => ({ message: `File size exceeds maximum limit of ${data.maxSize / (1024 * 1024)}MB` })
).refine(
  (data) => data.allowedTypes.includes(data.file.type),
  (data) => ({
    message: `File type not allowed. Supported types: ${data.allowedTypes
      .map(type => {
        const extensions: Record<string, string> = {
          'application/pdf': '.pdf',
          'application/msword': '.doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
          'text/plain': '.txt',
          'image/jpeg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'application/vnd.ms-excel': '.xls',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
        }
        return extensions[type] || type
      })
      .join(', ')}`
  })
)

// Marketing Campaign validation schemas
const marketingCampaignBaseSchema = z.object({
  name: z.string()
    .min(1, 'Campaign name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .trim()
    .optional()
    .nullable(),
  type: z.enum(['email', 'seo', 'ppc', 'social', 'content']),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).default('draft'),
  budget: z.number().min(0, 'Budget must be positive').optional().nullable(),
  spent: z.number().min(0, 'Spent amount must be positive').default(0),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  targetAudience: z.string()
    .max(500, 'Target audience must be less than 500 characters')
    .trim()
    .optional()
    .nullable(),
  goals: z.record(z.any()).optional().nullable(),
  metrics: z.record(z.any()).optional().nullable(),
})

export const marketingCampaignCreateSchema = marketingCampaignBaseSchema.refine(
  (data) => !data.endDate || !data.startDate || data.endDate >= data.startDate,
  {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  }
).refine(
  (data) => !data.budget || data.spent <= data.budget,
  {
    message: 'Spent amount cannot exceed budget',
    path: ['spent'],
  }
)

export const marketingCampaignUpdateSchema = marketingCampaignBaseSchema.partial()

export const marketingCampaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  type: z.enum(['email', 'seo', 'ppc', 'social', 'content']).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'cancelled']).optional(),
  search: z.string().max(255).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'startDate', 'budget']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// Demo booking validation schema
export const demoBookingSchema = z.object({
  email: emailSchema,
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters')
    .trim()
    .optional()
    .nullable(),
  company: z.string()
    .max(200, 'Company name must be less than 200 characters')
    .trim()
    .optional()
    .nullable(),
  phone: phoneSchema,
  specialRequests: z.string()
    .max(1000, 'Special requests must be less than 1000 characters')
    .trim()
    .optional()
    .nullable(),
  preferredDate: z.coerce.date().optional().nullable(),
  preferredTime: z.string()
    .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)')
    .optional()
    .nullable(),
})

// Contact form validation schema
export const contactFormSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),
  email: emailSchema,
  company: z.string()
    .max(200, 'Company name must be less than 200 characters')
    .trim()
    .optional()
    .nullable(),
  phone: phoneSchema,
  subject: z.string()
    .min(1, 'Subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .trim(),
  message: z.string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be less than 2000 characters')
    .trim(),
})

// Audit log validation schema
export const auditLogCreateSchema = z.object({
  action: z.string()
    .min(1, 'Action is required')
    .max(100, 'Action must be less than 100 characters')
    .trim(),
  userId: uuidSchema,
  documentId: uuidSchema.optional().nullable(),
  filename: z.string()
    .max(255, 'Filename must be less than 255 characters')
    .optional()
    .nullable(),
  fileHash: z.string()
    .max(64, 'File hash must be less than 64 characters')
    .optional()
    .nullable(),
  virusScanResult: z.record(z.any()).optional().nullable(),
})

// Pagination helper
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
})

// API response schemas
export const successResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  data: z.any().optional(),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }).optional(),
})

export const errorResponseSchema = z.object({
  success: z.literal(false).optional(),
  error: z.string(),
  details: z.any().optional(),
})

// Type exports for TypeScript
export type UserCreateInput = z.infer<typeof userCreateSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
export type ClientCreateInput = z.infer<typeof clientCreateSchema>
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>
export type ClientQueryInput = z.infer<typeof clientQuerySchema>
export type CaseCreateInput = z.infer<typeof caseCreateSchema>
export type CaseUpdateInput = z.infer<typeof caseUpdateSchema>
export type CaseQueryInput = z.infer<typeof caseQuerySchema>
export type DocumentCreateInput = z.infer<typeof documentCreateSchema>
export type DocumentQueryInput = z.infer<typeof documentQuerySchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type MarketingCampaignCreateInput = z.infer<typeof marketingCampaignCreateSchema>
export type MarketingCampaignUpdateInput = z.infer<typeof marketingCampaignUpdateSchema>
export type MarketingCampaignQueryInput = z.infer<typeof marketingCampaignQuerySchema>
export type DemoBookingInput = z.infer<typeof demoBookingSchema>
export type ContactFormInput = z.infer<typeof contactFormSchema>
export type AuditLogCreateInput = z.infer<typeof auditLogCreateSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type SuccessResponse = z.infer<typeof successResponseSchema>
export type ErrorResponse = z.infer<typeof errorResponseSchema>