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

export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const accountTypeEnum = pgEnum("account_type", ["payable", "receivable"]);
export const accountStatusEnum = pgEnum("account_status", ["pending", "paid", "received"]);
export const recurrenceEnum = pgEnum("recurrence", ["none", "monthly", "yearly"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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
    userIdx: index("accounts_user_idx").on(table.userId),
    dueDateIdx: index("accounts_due_date_idx").on(table.dueDate),
    visibleDueDateIdx: index("accounts_visible_due_date_idx").on(
      table.userId,
      table.deleted,
      table.dueDate,
    ),
    typeStatusIdx: index("accounts_type_status_idx").on(table.userId, table.type, table.status),
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

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type AccountType = (typeof accountTypeEnum.enumValues)[number];
export type AccountStatus = (typeof accountStatusEnum.enumValues)[number];
export type Recurrence = (typeof recurrenceEnum.enumValues)[number];
