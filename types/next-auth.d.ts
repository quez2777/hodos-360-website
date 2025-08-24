import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT, DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
      company?: string;
      emailVerified?: Date | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    company?: string;
    emailVerified?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    provider?: string;
    providerAccountId?: string;
  }
}
