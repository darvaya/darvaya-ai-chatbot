'use server';

import { z } from 'zod';
import { createUser, getUser } from '@/lib/db/queries';
import { signIn } from './auth';
import {
  createPasswordSchema,
  checkLoginAttempts,
  recordFailedLoginAttempt,
  resetLoginAttempts,
} from '@/lib/security/auth';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { securitySettings } from '@/lib/db/schema';

// Get organization's password policy or use defaults
async function getPasswordPolicy(organizationId: string | null) {
  if (!organizationId) return {};

  const [settings] = await db
    .select()
    .from(securitySettings)
    .where(eq(securitySettings.organizationId, organizationId));

  return settings?.passwordPolicy || {};
}

export interface LoginActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'invalid_data'
    | 'locked';
  error?: string;
}

export const login = async (
  _: LoginActionState,
  formData: FormData,
): Promise<LoginActionState> => {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Check for rate limiting
    try {
      checkLoginAttempts(email, 5, 15); // 5 attempts, 15 minutes lockout
    } catch (error) {
      return {
        status: 'locked',
        error:
          error instanceof Error ? error.message : 'Account temporarily locked',
      };
    }

    // Validate input
    const authFormSchema = z.object({
      email: z.string().email('Invalid email address'),
      password: z.string().min(1, 'Password is required'),
    });

    const validatedData = authFormSchema.parse({ email, password });

    // Attempt sign in
    const result = await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    if (!result?.ok) {
      recordFailedLoginAttempt(email);
      return { status: 'failed' };
    }

    // Reset login attempts on successful login
    resetLoginAttempts(email);
    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: 'invalid_data',
        error: error.errors[0].message,
      };
    }

    return { status: 'failed' };
  }
};

export interface RegisterActionState {
  status:
    | 'idle'
    | 'in_progress'
    | 'success'
    | 'failed'
    | 'invalid_data'
    | 'user_exists';
  error?: string;
}

export const register = async (
  _: RegisterActionState,
  formData: FormData,
): Promise<RegisterActionState> => {
  try {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    // Get organization ID from invite if available
    const organizationId = (formData.get('organizationId') as string) || null;

    // Get password policy based on organization
    const passwordPolicy = await getPasswordPolicy(organizationId);

    // Create validation schema with organization's password policy
    const authFormSchema = z.object({
      email: z.string().email('Invalid email address'),
      password: createPasswordSchema(passwordPolicy),
    });

    const validatedData = authFormSchema.parse({ email, password });

    // Check if user exists
    const [user] = await getUser(validatedData.email);
    if (user) {
      return { status: 'user_exists' };
    }

    // Create user
    await createUser(validatedData.email, validatedData.password);

    // Sign in the new user
    await signIn('credentials', {
      email: validatedData.email,
      password: validatedData.password,
      redirect: false,
    });

    return { status: 'success' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        status: 'invalid_data',
        error: error.errors[0].message,
      };
    }

    return { status: 'failed' };
  }
};
