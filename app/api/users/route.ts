import { z } from 'zod';
import { createValidatedRoute } from '@/middleware/validation';
import { commonSchemas, validation } from '@/lib/validation';
import { ChatSDKError } from '@/lib/errors';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { eq, sql, asc, desc } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

// User update schema
const updateUserSchema = z.object({
  profile: commonSchemas.userProfile,
  settings: z
    .object({
      theme: z.enum(['light', 'dark', 'system']),
      notifications: z.boolean(),
      language: z.string().min(2).max(5),
    })
    .optional(),
  address: commonSchemas.address.optional(),
});

// Query parameters schema
const userQuerySchema = z.object({
  include: z
    .string()
    .transform((str) => str.split(','))
    .pipe(validation.array(z.enum(['profile', 'settings', 'address']), 0, 3))
    .optional(),
  page: validation.number(1).default(1),
  limit: validation.number(1, 100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// Get users with pagination and filtering
export const GET = createValidatedRoute(
  { query: userQuerySchema },
  async (request) => {
    try {
      const session = await auth();
      if (!session?.user) {
        return new ChatSDKError('unauthorized:api').toResponse();
      }

      // Parse query parameters
      const url = new URL(request.url);
      const queryParams = userQuerySchema.parse(
        Object.fromEntries(url.searchParams.entries()),
      );

      // Build query
      const query = db
        .select()
        .from(user)
        .limit(queryParams.limit)
        .offset((queryParams.page - 1) * queryParams.limit);

      if (queryParams.sortBy && queryParams.sortBy in user) {
        const column = user[queryParams.sortBy as keyof typeof user];
        if (column && typeof column === 'object' && 'name' in column) {
          const sortColumn = column as PgColumn<any>;
          query.orderBy(
            queryParams.sortOrder === 'asc'
              ? asc(sortColumn)
              : desc(sortColumn),
          );
        }
      }

      const results = await query;

      // Get total count for pagination
      const [{ count }] = await db
        .select({ count: sql`count(*)`.mapWith(Number) })
        .from(user);

      return Response.json({
        data: results,
        pagination: {
          page: queryParams.page,
          limit: queryParams.limit,
          total: count,
          totalPages: Math.ceil(count / queryParams.limit),
        },
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return new ChatSDKError('internal_server_error:api').toResponse();
    }
  },
);

// Update user profile
export const PUT = createValidatedRoute(
  { body: updateUserSchema },
  async (request) => {
    try {
      const session = await auth();
      if (!session?.user) {
        return new ChatSDKError('unauthorized:api').toResponse();
      }

      const body = await request.json();
      const validatedData = updateUserSchema.parse(body);

      // Update user in database
      const [updatedUser] = await db
        .update(user)
        .set({
          name: validatedData.profile.name,
          email: validatedData.profile.email,
          updatedAt: new Date(),
          ...(validatedData.settings && { settings: validatedData.settings }),
          ...(validatedData.address && { address: validatedData.address }),
        })
        .where(eq(user.id, session.user.id))
        .returning();

      if (!updatedUser) {
        return new ChatSDKError('not_found:api', 'User not found').toResponse();
      }

      return Response.json(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      return new ChatSDKError('internal_server_error:api').toResponse();
    }
  },
);
