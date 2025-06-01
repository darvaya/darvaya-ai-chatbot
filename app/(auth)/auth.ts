import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession, type User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createGuestUser, getUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';
import type { User as DBUser } from '@/lib/db/schema';

export type UserType = 'guest' | 'regular';
export type UserRole = 'admin' | 'manager' | 'user';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      role: UserRole;
      organizationId: string | null;
      isActive: boolean;
    } & DefaultSession['user'];
  }

  interface User extends Omit<DBUser, 'password'> {
    type: UserType;
    role: UserRole;
    isActive: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    role: UserRole;
    organizationId: string | null;
    isActive: boolean;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);

        if (!passwordsMatch) return null;

        if (!user.isActive) return null;

        const { password: _, ...userWithoutPassword } = user;

        return {
          ...userWithoutPassword,
          type: 'regular' as const,
          role: user.role || 'user',
          isActive: user.isActive,
        };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();

        return {
          id: guestUser.id,
          email: guestUser.email,
          type: 'guest' as const,
          role: 'user' as const,
          isActive: true,
          organizationId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
        } satisfies User;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = user.type;
        token.role = user.role;
        token.organizationId = user.organizationId ?? null;
        token.isActive = user.isActive;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.role = token.role;
        session.user.organizationId = token.organizationId;
        session.user.isActive = token.isActive;
      }

      return session;
    },
  },
});
