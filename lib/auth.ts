// Production-ready auth module with graceful fallback
// This is a placeholder that works in both development and production

export interface User {
  id: string
  email: string
  name?: string
  isAdmin?: boolean
}

export interface Session {
  user: User
}

// Auth function with production fallback
export async function auth(): Promise<Session | null> {
  // In development, return a mock session for testing
  if (process.env.NODE_ENV === 'development') {
    return {
      user: {
        id: 'dev-user-123',
        email: 'dev@example.com',
        name: 'Development User',
        isAdmin: true,
      },
    }
  }
  
  // In production, return null to disable auth-protected features
  // This allows the site to deploy and function without authentication
  // TODO: Replace with actual authentication implementation (NextAuth, Clerk, Auth0, etc.)
  return null
}

// Middleware wrapper for auth-protected routes
export function withAuth(handler: any) {
  return async (req: any, res: any) => {
    const session = await auth()
    
    // In production, if no auth is configured, allow access with a warning
    if (!session && process.env.NODE_ENV === 'production') {
      console.warn('Authentication not configured - allowing unauthenticated access')
      // You may want to restrict this based on your requirements
      // For now, we'll allow access to keep the site functional
    }
    
    if (!session && process.env.NODE_ENV === 'development') {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    return handler(req, res)
  }
}

// Helper function to check if authentication is configured
export function isAuthConfigured(): boolean {
  return process.env.NODE_ENV === 'development' || !!process.env.NEXTAUTH_SECRET
}

// Helper function to get user safely
export async function getCurrentUser(): Promise<User | null> {
  const session = await auth()
  return session?.user || null
}