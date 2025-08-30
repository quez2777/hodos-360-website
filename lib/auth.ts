// Real authentication using NextAuth with database integration
import { auth as nextAuth } from "@/auth"

export interface User {
  id: string
  email: string
  name?: string
  isAdmin?: boolean
}

export interface Session {
  user: User
}

// Auth function using NextAuth
export async function auth(): Promise<Session | null> {
  try {
    const session = await nextAuth()
    
    if (!session?.user?.email) {
      return null
    }

    return {
      user: {
        id: (session.user as any).id || session.user.email,
        email: session.user.email,
        name: session.user.name || undefined,
        isAdmin: (session.user as any).isAdmin || false,
      },
    }
  } catch (error) {
    console.error('Error getting auth session:', error)
    return null
  }
}

// Middleware wrapper for auth-protected routes
export function withAuth(handler: any) {
  return async (req: any, res: any) => {
    const session = await auth()
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized - Please sign in to continue' })
    }
    
    return handler(req, res)
  }
}

// Helper function to check if authentication is configured
export function isAuthConfigured(): boolean {
  return !!(
    process.env.NEXTAUTH_SECRET &&
    (
      (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) ||
      (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET)
    )
  )
}

// Helper function to get user safely
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth()
  return session?.user || null
}

// Helper function to check if user is admin
export async function isAdmin(): Promise<boolean> {
  const session = await auth()
  return session?.user?.isAdmin || false
}

// Helper function to require admin access
export async function requireAdmin(): Promise<User> {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized - Please sign in to continue')
  }
  if (!session.user.isAdmin) {
    throw new Error('Forbidden - Admin access required')
  }
  return session.user
}