import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthConfig } from "next-auth"
import { prisma } from "@/lib/prisma"

const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user && user.email) {
        try {
          // Get user from database to check admin status with proper error handling
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, isAdmin: true }
          })
          
          token.isAdmin = dbUser?.isAdmin ?? false
          token.id = dbUser?.id ?? String(user.id || '')
        } catch (error) {
          console.error('JWT callback error:', error)
          // Fail safely - don't grant admin privileges on error
          token.isAdmin = false
          token.id = String(user.id || '')
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        // Type-safe assignment using proper interface extensions
        (session.user as any).isAdmin = Boolean(token.isAdmin)
        session.user.id = token.id as string
      }
      return session
    },
    async signIn({ user, account, profile }) {
      try {
        if (!user?.email) {
          console.error('Sign in attempted without email')
          return false
        }
        
        // Check if user exists, create if not
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { id: true, email: true, isAdmin: true }
        })

        if (!existingUser) {
          // Secure admin check - only grant admin if email matches exactly
          const isAdmin = user.email === process.env.ADMIN_EMAIL && 
                         process.env.ADMIN_EMAIL !== undefined && 
                         process.env.ADMIN_EMAIL !== ''
          
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || '',
              isAdmin,
            },
            select: { id: true, email: true, isAdmin: true }
          })
        }
        
        return true
      } catch (error) {
        console.error('Error during sign in:', error)
        // Fail securely - don't allow sign in on database errors
        return false
      }
    },
  },
  session: {
    strategy: "database",
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(config)