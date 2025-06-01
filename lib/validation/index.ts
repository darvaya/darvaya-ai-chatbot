import { z } from 'zod';

// Common validation patterns
const PATTERNS = {
  // Only allow letters, numbers, and common special characters
  SAFE_STRING: /^[a-zA-Z0-9\s\-_.,@()]+$/,
  // Email pattern following RFC 5322
  EMAIL:
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
  // URL pattern
  URL: /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)$/,
  // Phone number (international format)
  PHONE: /^\+?[1-9]\d{1,14}$/,
  // Date in ISO format
  ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,
  // Time in 24-hour format
  TIME_24H: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  // Hexadecimal color
  HEX_COLOR: /^#[0-9A-Fa-f]{6}$/,
};

// Common validation messages
export const MESSAGES = {
  REQUIRED: 'This field is required',
  INVALID_EMAIL: 'Please enter a valid email address',
  INVALID_URL: 'Please enter a valid URL',
  INVALID_PHONE: 'Please enter a valid phone number',
  INVALID_DATE: 'Please enter a valid date in YYYY-MM-DD format',
  INVALID_TIME: 'Please enter a valid time in 24-hour format (HH:MM)',
  INVALID_COLOR: 'Please enter a valid hex color code (#RRGGBB)',
  STRING_MIN: (min: number) => `Must be at least ${min} characters`,
  STRING_MAX: (max: number) => `Must be at most ${max} characters`,
  NUMBER_MIN: (min: number) => `Must be at least ${min}`,
  NUMBER_MAX: (max: number) => `Must be at most ${max}`,
  ARRAY_MIN: (min: number) => `Must select at least ${min} items`,
  ARRAY_MAX: (max: number) => `Must select at most ${max} items`,
};

// Base schemas for common types
export const baseSchemas = {
  safeString: z
    .string()
    .trim()
    .regex(PATTERNS.SAFE_STRING, 'Invalid characters detected'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .regex(PATTERNS.EMAIL, MESSAGES.INVALID_EMAIL),

  url: z.string().trim().regex(PATTERNS.URL, MESSAGES.INVALID_URL),

  phone: z.string().trim().regex(PATTERNS.PHONE, MESSAGES.INVALID_PHONE),

  date: z
    .string()
    .regex(PATTERNS.ISO_DATE, MESSAGES.INVALID_DATE)
    .transform((str) => new Date(str)),

  time: z.string().regex(PATTERNS.TIME_24H, MESSAGES.INVALID_TIME),

  color: z.string().regex(PATTERNS.HEX_COLOR, MESSAGES.INVALID_COLOR),
};

// Validation helper functions
export const validation = {
  // Create a required field with custom error message
  required: (schema: z.ZodType, message = MESSAGES.REQUIRED) =>
    schema.refine((val) => val !== undefined && val !== null && val !== '', {
      message,
    }),

  // Create a field with min/max length
  length: (schema: z.ZodString, min?: number, max?: number) => {
    let result = schema;
    if (min !== undefined) {
      result = result.min(min, MESSAGES.STRING_MIN(min));
    }
    if (max !== undefined) {
      result = result.max(max, MESSAGES.STRING_MAX(max));
    }
    return result;
  },

  // Create a number field with min/max values
  number: (min?: number, max?: number) => {
    let schema = z.number();
    if (min !== undefined) {
      schema = schema.min(min, MESSAGES.NUMBER_MIN(min));
    }
    if (max !== undefined) {
      schema = schema.max(max, MESSAGES.NUMBER_MAX(max));
    }
    return schema;
  },

  // Create an array field with min/max items
  array: <T extends z.ZodType>(type: T, min?: number, max?: number) => {
    let schema = z.array(type);
    if (min !== undefined) {
      schema = schema.min(min, MESSAGES.ARRAY_MIN(min));
    }
    if (max !== undefined) {
      schema = schema.max(max, MESSAGES.ARRAY_MAX(max));
    }
    return schema;
  },

  // Transform empty string to null
  nullableString: () =>
    z.string().transform((val) => (val === '' ? null : val)),

  // Custom error map for better error messages
  errorMap: () => (error: z.ZodError) => ({
    message: error.errors[0]?.message || 'Invalid input',
    errors: error.errors.map((err) => ({
      path: err.path,
      message: err.message,
    })),
  }),
};

// Common validation schemas
export const commonSchemas = {
  // User profile schema
  userProfile: z.object({
    name: validation.required(
      validation.length(baseSchemas.safeString, 2, 50),
      'Name is required',
    ),
    email: validation.required(baseSchemas.email, 'Email is required'),
    phone: baseSchemas.phone.optional(),
    bio: validation.length(z.string(), 0, 500),
    website: baseSchemas.url.optional(),
  }),

  // Address schema
  address: z.object({
    street: validation.required(
      validation.length(baseSchemas.safeString, 5, 100),
      'Street address is required',
    ),
    city: validation.required(
      validation.length(baseSchemas.safeString, 2, 50),
      'City is required',
    ),
    state: validation.required(
      validation.length(baseSchemas.safeString, 2, 50),
      'State is required',
    ),
    postalCode: validation.required(
      z.string().regex(/^\d{5}(-\d{4})?$/, 'Invalid postal code'),
      'Postal code is required',
    ),
    country: validation.required(
      validation.length(baseSchemas.safeString, 2, 50),
      'Country is required',
    ),
  }),

  // Date range schema
  dateRange: z
    .object({
      startDate: validation.required(
        baseSchemas.date,
        'Start date is required',
      ),
      endDate: validation.required(baseSchemas.date, 'End date is required'),
    })
    .refine(
      (data) => data.startDate <= data.endDate,
      'End date must be after start date',
    ),

  // Pagination schema
  pagination: z.object({
    page: validation.number(1).default(1),
    limit: validation.number(1, 100).default(10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),

  // Search query schema
  search: z.object({
    query: validation.length(z.string(), 0, 100),
    filters: z.record(z.string()).optional(),
    fields: z.array(z.string()).optional(),
  }),
};
