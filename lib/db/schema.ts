import type { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import type { AdapterAccount } from "@auth/core/adapters";

// Define role enum
export const userRoleEnum = pgEnum("user_role", ["admin", "manager", "user"]);

// Define organization table
export const organization = pgTable("Organization", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  settings: json("settings").$type<{
    theme?: string;
    features?: string[];
    notifications?: boolean;
  }>(),
  maxUsers: integer("max_users").default(5),
  isActive: boolean("is_active").default(true),
  // Analytics fields
  metrics: json("metrics").$type<{
    activeUsers?: number;
    totalTeams?: number;
    resourceUsage?: number;
    lastUpdated?: string;
  }>(),
});

export type Organization = InferSelectModel<typeof organization>;

// Define team table for sub-groups within organizations
export const team = pgTable("Team", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text("name").notNull(),
  organizationId: text("organization_id")
    .references(() => organization.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Analytics fields
  metrics: json("metrics").$type<{
    memberCount?: number;
    activeProjects?: number;
    performance?: number;
    lastUpdated?: string;
  }>(),
});

export type Team = InferSelectModel<typeof team>;

// Extend user table with role and organization relationship
export const user = pgTable("User", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  password: varchar("password", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  organizationId: text("organization_id").references(() => organization.id),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // Analytics fields
  activityLog: json("activity_log").$type<
    Array<{
      action: string;
      timestamp: string;
      details?: Record<string, unknown>;
    }>
  >(),
  loginCount: integer("login_count").default(0),
});

export type User = InferSelectModel<typeof user>;

// Define user-team relationship table
export const userTeam = pgTable(
  "UserTeam",
  {
    userId: text("user_id")
      .references(() => user.id)
      .notNull(),
    teamId: text("team_id")
      .references(() => team.id)
      .notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    joinedAt: timestamp("joined_at").defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.teamId] }),
  }),
);

export type UserTeam = InferSelectModel<typeof userTeam>;

// Define organization invitation table
export const organizationInvitation = pgTable("OrganizationInvitation", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull(),
  organizationId: text("organization_id")
    .references(() => organization.id)
    .notNull(),
  role: userRoleEnum("role").default("user").notNull(),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type OrganizationInvitation = InferSelectModel<
  typeof organizationInvitation
>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  title: text("title").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
  visibility: varchar("visibility", { enum: ["public", "private"] })
    .notNull()
    .default("private"),
});

export type Chat = InferSelectModel<typeof chat>;

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const messageDeprecated = pgTable("Message", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export type MessageDeprecated = InferSelectModel<typeof messageDeprecated>;

// Define message table type
type MessageTable = typeof message;

// Message table definition
export const message = pgTable("Message_v2", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  role: varchar("role").notNull(),
  parts: json("parts").notNull(),
  attachments: json("attachments").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  parentId: uuid("parentId").references((): any => message.id),
  threadId: uuid("threadId"),
  replyCount: integer("replyCount").default(0),
  codeBlocks: json("codeBlocks")
    .$type<
      Array<{
        language: string;
        code: string;
        highlightedLines?: number[];
        executionResult?: string;
      }>
    >()
    .default([]),
});

// DEPRECATED: The following schema is deprecated and will be removed in the future.
// Read the migration guide at https://chat-sdk.dev/docs/migration-guides/message-parts
export const voteDeprecated = pgTable(
  "Vote",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => messageDeprecated.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type VoteDeprecated = InferSelectModel<typeof voteDeprecated>;

export const vote = pgTable(
  "Vote_v2",
  {
    chatId: uuid("chatId")
      .notNull()
      .references(() => chat.id),
    messageId: uuid("messageId")
      .notNull()
      .references(() => message.id),
    isUpvoted: boolean("isUpvoted").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  },
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  "Document",
  {
    id: uuid("id").notNull().defaultRandom(),
    createdAt: timestamp("createdAt").notNull(),
    title: text("title").notNull(),
    content: text("content"),
    kind: varchar("text", { enum: ["text", "code", "image", "sheet"] })
      .notNull()
      .default("text"),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  },
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  "Suggestion",
  {
    id: uuid("id").notNull().defaultRandom(),
    documentId: uuid("documentId").notNull(),
    documentCreatedAt: timestamp("documentCreatedAt").notNull(),
    originalText: text("originalText").notNull(),
    suggestedText: text("suggestedText").notNull(),
    description: text("description"),
    isResolved: boolean("isResolved").notNull().default(false),
    userId: uuid("userId")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }),
  }),
);

export type Suggestion = InferSelectModel<typeof suggestion>;

export const stream = pgTable(
  "Stream",
  {
    id: uuid("id").notNull().defaultRandom(),
    chatId: uuid("chatId").notNull(),
    createdAt: timestamp("createdAt").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    chatRef: foreignKey({
      columns: [table.chatId],
      foreignColumns: [chat.id],
    }),
  }),
);

export type Stream = InferSelectModel<typeof stream>;

// Define integration types enum
export const integrationTypeEnum = pgEnum("integration_type", [
  "slack",
  "github",
  "jira",
  "google_workspace",
  "microsoft_365",
  "zoom",
  "custom",
]);

// Define integration status enum
export const integrationStatusEnum = pgEnum("integration_status", [
  "active",
  "inactive",
  "pending",
  "failed",
]);

// Define integration table
export const integration = pgTable("Integration", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  organizationId: text("organization_id")
    .references(() => organization.id)
    .notNull(),
  type: integrationTypeEnum("type").notNull(),
  name: text("name").notNull(),
  config: json("config").$type<{
    apiKey?: string;
    webhookUrl?: string;
    clientId?: string;
    clientSecret?: string;
    scopes?: string[];
    settings?: Record<string, unknown>;
  }>(),
  status: integrationStatusEnum("status").default("inactive").notNull(),
  lastSyncedAt: timestamp("last_synced_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: json("metadata").$type<{
    version?: string;
    features?: string[];
    usage?: {
      requests?: number;
      lastRequest?: string;
    };
  }>(),
});

// Define integration events table for tracking integration activity
export const integrationEvent = pgTable("IntegrationEvent", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  integrationId: text("integration_id")
    .references(() => integration.id)
    .notNull(),
  type: text("type").notNull(), // e.g., 'sync', 'webhook', 'error'
  status: text("status").notNull(), // 'success', 'failure', 'pending'
  data: json("data").$type<{
    details?: Record<string, unknown>;
    error?: {
      code: string;
      message: string;
      stack?: string;
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define webhook table for integration callbacks
export const webhook = pgTable("Webhook", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  integrationId: text("integration_id")
    .references(() => integration.id)
    .notNull(),
  url: text("url").notNull(),
  secret: text("secret").notNull(),
  events: json("events").$type<string[]>().notNull(),
  isActive: boolean("is_active").default(true),
  lastTriggeredAt: timestamp("last_triggered_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export types
export type Integration = InferSelectModel<typeof integration>;
export type IntegrationEvent = InferSelectModel<typeof integrationEvent>;
export type Webhook = InferSelectModel<typeof webhook>;

// Define security event types enum
export const securityEventTypeEnum = pgEnum("security_event_type", [
  "login",
  "logout",
  "password_change",
  "mfa_enabled",
  "mfa_disabled",
  "api_key_created",
  "api_key_revoked",
  "role_changed",
  "permission_changed",
  "integration_access",
  "data_export",
  "settings_changed",
  "security_alert",
]);

// Define security severity enum
export const securitySeverityEnum = pgEnum("security_severity", [
  "low",
  "medium",
  "high",
  "critical",
]);

// Define security audit log table
export const securityAuditLog = pgTable("SecurityAuditLog", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  organizationId: text("organization_id")
    .references(() => organization.id)
    .notNull(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  eventType: securityEventTypeEnum("event_type").notNull(),
  severity: securitySeverityEnum("severity").default("low").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  details: json("details").$type<{
    action?: string;
    target?: string;
    changes?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define API keys table for secure external access
export const apiKey = pgTable("ApiKey", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  organizationId: text("organization_id")
    .references(() => organization.id)
    .notNull(),
  name: text("name").notNull(),
  key: text("key").notNull(),
  hashedKey: text("hashed_key").notNull(),
  scopes: json("scopes").$type<string[]>().notNull(),
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdBy: text("created_by")
    .references(() => user.id)
    .notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Define security settings table
export const securitySettings = pgTable("SecuritySettings", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  organizationId: text("organization_id")
    .references(() => organization.id)
    .notNull(),
  mfaRequired: boolean("mfa_required").default(false),
  passwordPolicy: json("password_policy")
    .$type<{
      minLength: number;
      maxLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSymbols: boolean;
      preventReuseCount: number;
      expiryDays: number;
    }>()
    .default({
      minLength: 8,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSymbols: true,
      preventReuseCount: 3,
      expiryDays: 90,
    }),
  ipAllowlist: json("ip_allowlist").$type<string[]>().default([]),
  sessionTimeout: integer("session_timeout").default(24), // in hours
  maxLoginAttempts: integer("max_login_attempts").default(5),
  lockoutDuration: integer("lockout_duration").default(15), // in minutes
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export types
export type SecurityAuditLog = InferSelectModel<typeof securityAuditLog>;
export type ApiKey = InferSelectModel<typeof apiKey>;
export type SecuritySettings = InferSelectModel<typeof securitySettings>;

// Define subscription plan types
export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "free",
  "starter",
  "professional",
  "enterprise",
]);

// Define billing cycle enum
export const billingCycleEnum = pgEnum("billing_cycle", ["monthly", "annual"]);

// Define payment status enum
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
  "cancelled",
]);

// Define subscription table
export const subscription = pgTable("Subscription", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  organizationId: text("organization_id")
    .references(() => organization.id)
    .notNull(),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: text("status").notNull().default("active"),
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  trialEndsAt: timestamp("trial_ends_at"),
  cancelledAt: timestamp("cancelled_at"),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  metadata: json("metadata").$type<{
    features?: string[];
    customLimits?: Record<string, number>;
    notes?: string;
  }>(),
});

// Define billing table
export const billing = pgTable("Billing", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  organizationId: text("organization_id")
    .references(() => organization.id)
    .notNull(),
  subscriptionId: text("subscription_id")
    .references(() => subscription.id)
    .notNull(),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").notNull().default("USD"),
  status: paymentStatusEnum("status").notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidAt: timestamp("paid_at"),
  invoiceUrl: text("invoice_url"),
  paymentMethod: json("payment_method").$type<{
    type: string;
    last4?: string;
    expiryMonth?: number;
    expiryYear?: number;
    brand?: string;
  }>(),
  billingAddress: json("billing_address").$type<{
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define usage tracking table
export const usageTracking = pgTable("UsageTracking", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  organizationId: text("organization_id")
    .references(() => organization.id)
    .notNull(),
  feature: text("feature").notNull(),
  quantity: integer("quantity").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  metadata: json("metadata").$type<{
    userId?: string;
    context?: Record<string, unknown>;
    details?: Record<string, unknown>;
  }>(),
});

// Define business metrics table
export const businessMetrics = pgTable("BusinessMetrics", {
  id: text("id")
    .$defaultFn(() => createId())
    .primaryKey(),
  organizationId: text("organization_id")
    .references(() => organization.id)
    .notNull(),
  date: timestamp("date").notNull(),
  metrics: json("metrics").$type<{
    activeUsers?: number;
    totalRevenue?: number;
    mrr?: number;
    churnRate?: number;
    userGrowth?: number;
    featureUsage?: Record<string, number>;
    customMetrics?: Record<string, number>;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export types
export type Subscription = InferSelectModel<typeof subscription>;
export type Billing = InferSelectModel<typeof billing>;
export type UsageTracking = InferSelectModel<typeof usageTracking>;
export type BusinessMetrics = InferSelectModel<typeof businessMetrics>;

// Message reactions
export const messageReaction = pgTable("MessageReaction", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("messageId")
    .notNull()
    .references(() => message.id),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  emoji: text("emoji").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Real-time collaboration
export const chatParticipant = pgTable("ChatParticipant", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: uuid("chatId")
    .notNull()
    .references(() => chat.id),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  isTyping: boolean("isTyping").default(false),
  lastSeenMessageId: uuid("lastSeenMessageId").references(() => message.id),
  joinedAt: timestamp("joinedAt").defaultNow(),
  leftAt: timestamp("leftAt"),
});

// Export types
export type DBMessage = InferSelectModel<typeof message>;
export type MessageReaction = InferSelectModel<typeof messageReaction>;
export type ChatParticipant = InferSelectModel<typeof chatParticipant>;

export const users = pgTable("users", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  }),
);

export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
