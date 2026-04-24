import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "admin", "super-user", "standard", "free"]);
export const tenantPlanEnum = pgEnum("tenant_plan", ["free", "standard", "business"]);
export const accountTypeEnum = pgEnum("account_type", ["payable", "receivable"]);
export const accountStatusEnum = pgEnum("account_status", ["pending", "paid", "received"]);
export const recurrenceEnum = pgEnum("recurrence", ["none", "monthly", "yearly"]);

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  plan: tenantPlanEnum("plan").notNull().default("free"),
  payableLimit: numeric("payable_limit", { precision: 8, scale: 0 }).notNull().default("10"),
  receivableLimit: numeric("receivable_limit", { precision: 8, scale: 0 }).notNull().default("10"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    amountBrl: numeric("amount_brl", { precision: 12, scale: 2 }).notNull(),
    amountUsd: numeric("amount_usd", { precision: 12, scale: 2 }).notNull(),
    type: accountTypeEnum("type").notNull(),
    status: accountStatusEnum("status").notNull().default("pending"),
    category: text("category").notNull().default("Geral"),
    tags: text("tags").notNull().default(""),
    recurrence: recurrenceEnum("recurrence").notNull().default("none"),
    recurrenceParentId: uuid("recurrence_parent_id"),
    collaboratorEmails: text("collaborator_emails").notNull().default(""),
    deleted: boolean("deleted").notNull().default(false),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    tenantIdx: index("accounts_tenant_idx").on(table.tenantId),
    userIdx: index("accounts_user_idx").on(table.userId),
    dueDateIdx: index("accounts_due_date_idx").on(table.dueDate),
    visibleDueDateIdx: index("accounts_visible_due_date_idx").on(
      table.tenantId,
      table.deleted,
      table.dueDate,
    ),
    typeStatusIdx: index("accounts_type_status_idx").on(table.tenantId, table.type, table.status),
  }),
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userIdx: index("password_reset_user_idx").on(table.userId),
  }),
);

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  accounts: many(accounts),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [accounts.tenantId],
    references: [tenants.id],
  }),
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type TenantPlan = (typeof tenantPlanEnum.enumValues)[number];
export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type AccountStatus = (typeof accountStatusEnum.enumValues)[number];
export type Recurrence = (typeof recurrenceEnum.enumValues)[number];
