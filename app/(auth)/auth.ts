import { compare } from "bcrypt-ts";
import NextAuth, {
  type DefaultSession,
  type User as NextAuthUser,
} from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createGuestUser, getUser } from "@/lib/db/queries";
import { authConfig } from "./auth.config";
import { DUMMY_PASSWORD } from "@/lib/constants";
import type { DefaultJWT } from "next-auth/jwt";
import type { User as DBUser } from "@/lib/db/schema";

export type UserType = "guest" | "regular";
export type UserRole = "admin" | "manager" | "user";

// Extend the DBUser type with our custom fields
interface AuthUser extends Omit<DBUser, "password"> {
  type: UserType;
  // These fields are already in DBUser but we're being explicit about their types
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
  organizationId: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  activityLog: Array<{
    action: string;
    timestamp: string;
    details?: Record<string, unknown>;
  }>;
  loginCount: number;
  // NextAuth specific fields
  image?: string | null;
}

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      role: UserRole;
      organizationId: string | null;
      isActive: boolean;
    } & DefaultSession["user"];
  }

  interface User extends AuthUser {}
}

declare module "next-auth/jwt" {
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
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          const email = credentials.email as string;
          const password = credentials.password as string;

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

          // Ensure all required fields are properly typed and have defaults
          const authUser: AuthUser = {
            ...userWithoutPassword,
            // Ensure required fields are present
            id: user.id,
            email: user.email,
            name: user.name ?? null,
            // Set our custom type
            type: "regular",
            // Ensure role is valid
            role: (user.role || "user") as UserRole,
            // Ensure boolean fields are properly typed
            isActive: user.isActive === null ? true : Boolean(user.isActive),
            // Set default values for activity log and login count
            activityLog: Array.isArray(user.activityLog)
              ? user.activityLog
              : [],
            loginCount:
              typeof user.loginCount === "number" ? user.loginCount : 0,
            // Ensure organization ID is properly typed
            organizationId: user.organizationId ?? null,
            // Ensure dates are properly typed
            createdAt: user.createdAt || new Date(),
            updatedAt: user.updatedAt || new Date(),
            lastLoginAt: user.lastLoginAt ?? null,
            // NextAuth specific field
            image: null,
          };

          return authUser;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
    Credentials({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();

        const guestAuthUser: AuthUser = {
          id: guestUser.id,
          email: guestUser.email,
          name: "Guest User",
          type: "guest",
          role: "user",
          isActive: true,
          organizationId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
          activityLog: [],
          loginCount: 0,
          // Ensure all required fields are present
          image: null,
        };

        return guestAuthUser;
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
