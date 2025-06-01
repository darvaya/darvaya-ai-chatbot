import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { ChatSDKError } from '@/lib/errors';

// Regular expressions for input validation
const SAFE_STRING = /^[a-zA-Z0-9\s\-_.,@()]+$/;
const SAFE_NUMBER = /^\d+$/;
const SAFE_DATE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z)?$/;

// Schema for validating database identifiers
export const dbIdentifierSchema = z
  .string()
  .regex(SAFE_STRING, 'Invalid identifier format')
  .max(63); // PostgreSQL's identifier length limit

// Schema for validating table names
export const tableNameSchema = z
  .string()
  .regex(SAFE_STRING, 'Invalid table name format')
  .max(63);

// Schema for validating column names
export const columnNameSchema = z
  .string()
  .regex(SAFE_STRING, 'Invalid column name format')
  .max(63);

// Schema for validating sort directions
export const sortDirectionSchema = z.enum(['asc', 'desc']);

// Schema for validating pagination parameters
export const paginationSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().min(1).max(100),
});

// Schema for validating date range parameters
export const dateRangeSchema = z.object({
  startDate: z.string().regex(SAFE_DATE),
  endDate: z.string().regex(SAFE_DATE),
});

// Function to sanitize SQL identifiers
export function sanitizeIdentifier(identifier: string): string {
  const result = dbIdentifierSchema.safeParse(identifier);
  if (!result.success) {
    throw new ChatSDKError('bad_request:database', 'Invalid identifier format');
  }
  return result.data;
}

// Function to validate and sanitize sort parameters
export function validateSortParams(
  sortBy: string,
  sortDirection: string,
  allowedColumns: string[],
) {
  const column = columnNameSchema.safeParse(sortBy);
  const direction = sortDirectionSchema.safeParse(sortDirection);

  if (!column.success || !direction.success) {
    throw new ChatSDKError('bad_request:database', 'Invalid sort parameters');
  }

  if (!allowedColumns.includes(column.data)) {
    throw new ChatSDKError('bad_request:database', 'Invalid sort column');
  }

  return {
    column: column.data,
    direction: direction.data,
  };
}

// Function to create a safe LIKE pattern
export function createSafeLikePattern(search: string): string {
  // Escape special characters used in LIKE patterns
  const escaped = search.replace(/[%_\\]/g, '\\$&');
  return `%${escaped}%`;
}

// Function to validate and sanitize pagination parameters
export function validatePagination(page: number, limit: number) {
  const result = paginationSchema.safeParse({ page, limit });
  if (!result.success) {
    throw new ChatSDKError(
      'bad_request:database',
      'Invalid pagination parameters',
    );
  }
  return result.data;
}

// Function to validate and sanitize date range parameters
export function validateDateRange(startDate: string, endDate: string) {
  const result = dateRangeSchema.safeParse({ startDate, endDate });
  if (!result.success) {
    throw new ChatSDKError(
      'bad_request:database',
      'Invalid date range parameters',
    );
  }
  return result.data;
}

// Function to create a safe SQL fragment for dynamic column selection
export function createSafeColumnList(
  columns: string[],
  allowedColumns: string[],
) {
  const validColumns = columns.every((col) => {
    const result = columnNameSchema.safeParse(col);
    return result.success && allowedColumns.includes(result.data);
  });

  if (!validColumns) {
    throw new ChatSDKError('bad_request:database', 'Invalid column selection');
  }

  return sql.join(
    columns.map((col) => sql.identifier(col)),
    sql`, `,
  );
}

// Function to validate and sanitize search parameters
export function validateSearchParams(
  search: string,
  searchableColumns: string[],
) {
  if (!search.match(SAFE_STRING)) {
    throw new ChatSDKError('bad_request:database', 'Invalid search format');
  }

  const validColumns = searchableColumns.every(
    (col) => columnNameSchema.safeParse(col).success,
  );

  if (!validColumns) {
    throw new ChatSDKError(
      'bad_request:database',
      'Invalid searchable columns',
    );
  }

  return {
    searchTerm: createSafeLikePattern(search),
    columns: searchableColumns,
  };
}
