// Production-ready Prisma client with proper generated client import
import { PrismaClient } from './generated/prisma'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Mock database models for TypeScript - replace with your actual Prisma schema
export interface Document {
  id: string
  filename: string
  size: number
  contentType: string
  s3Key: string
  userId: string
  caseId?: string | null
  clientId?: string | null
  tags: string[]
  encrypted: boolean
  virusScanStatus?: string | null
  virusScanDate?: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
  deletedBy?: string | null
  user?: any
  case?: any
  client?: any
}

export interface DocumentAuditLog {
  id: string
  action: string
  userId: string
  documentId: string
  metadata?: string | null
  timestamp: Date
}

export interface CaseAccess {
  id: string
  caseId: string
  userId: string
  role: string
  createdAt: Date
}

export interface ClientAccess {
  id: string
  clientId: string
  userId: string
  role: string
  createdAt: Date
}