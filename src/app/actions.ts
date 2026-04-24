"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { accounts, passwordResetTokens, tenants, users, type AccountType } from "@/db/schema";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  accountInputSchema,
  adminTenantCreateSchema,
  adminTenantUpdateSchema,
  adminUserCreateSchema,
  adminUserDeleteSchema,
  adminUserUpdateSchema,
  authInputSchema,
  importCsvSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  registerInputSchema,
} from "@/lib/validators";

type ActionState = {
  ok: boolean;
  message?: string;
};

type AccountQuota = {
  payableLimit: number;
  receivableLimit: number;
};

const adminAssignableRoles = ["admin", "standard", "free"] as const;

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function accountPayload(formData: FormData) {
  return {
    title: formString(formData, "title"),
    description: formString(formData, "description"),
    dueDate: formString(formData, "dueDate"),
    amountBrl: formString(formData, "amountBrl"),
    amountUsd: formString(formData, "amountUsd"),
    type: formString(formData, "type"),
    status: formString(formData, "status"),
    category: formString(formData, "category") || "Geral",
    tags: formString(formData, "tags"),
    recurrence: formString(formData, "recurrence") || "none",
    collaboratorEmails: formString(formData, "collaboratorEmails"),
  };
}

function addInterval(date: Date, recurrence: "monthly" | "yearly", count: number) {
  const next = new Date(date);
  if (recurrence === "monthly") {
    next.setMonth(next.getMonth() + count);
  } else {
    next.setFullYear(next.getFullYear() + count);
  }
  return next;
}

function normalizeEmails(value: string) {
  return value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .join(", ");
}

function canAccess(
  account: { tenantId: string | null; userId: string; collaboratorEmails: string },
  session: { userId: string; email: string; tenantId: string | null; role: string },
) {
  if (session.role === "super-user") {
    return true;
  }

  if (account.tenantId !== session.tenantId) {
    return false;
  }

  if (session.role === "admin") {
    return true;
  }

  if (account.userId === session.userId) {
    return true;
  }

  return account.collaboratorEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .includes(session.email.toLowerCase());
}

async function getAccessibleAccount(
  accountId: string,
  session: { userId: string; email: string; tenantId: string | null; role: string },
) {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);

  if (!account || account.deleted || !canAccess(account, session)) {
    return null;
  }

  return account;
}

function recurrenceRows(recurrence: "none" | "monthly" | "yearly") {
  return recurrence === "none" ? 1 : 7;
}

async function tenantQuota(tenantId: string): Promise<AccountQuota> {
  const [tenant] = await db
    .select({
      payableLimit: tenants.payableLimit,
      receivableLimit: tenants.receivableLimit,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1);

  return {
    payableLimit: Number(tenant?.payableLimit ?? 10),
    receivableLimit: Number(tenant?.receivableLimit ?? 10),
  };
}

async function accountTypeCount(tenantId: string, type: AccountType) {
  const [row] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(accounts)
    .where(and(eq(accounts.tenantId, tenantId), eq(accounts.type, type), eq(accounts.deleted, false)));

  return Number(row?.total ?? 0);
}

async function assertAccountLimit(
  tenantId: string,
  type: AccountType,
  incomingRows: number,
): Promise<string | null> {
  const quota = await tenantQuota(tenantId);
  const limit = type === "payable" ? quota.payableLimit : quota.receivableLimit;

  if (limit <= 0) {
    return null;
  }

  const current = await accountTypeCount(tenantId, type);

  if (current + incomingRows > limit) {
    const label = type === "payable" ? "a pagar" : "a receber";
    return `Limite do plano atingido: ${current}/${limit} contas ${label}.`;
  }

  return null;
}

function firstError(error: unknown) {
  if (
    error &&
    typeof error === "object" &&
    "flatten" in error &&
    typeof error.flatten === "function"
  ) {
    const flattened = error.flatten() as { fieldErrors: Record<string, string[]> };
    const [message] = Object.values(flattened.fieldErrors).flat();
    return message;
  }

  return undefined;
}

function databaseErrorMessage(error: unknown) {
  console.error("FlowCash database action failed:", error);

  if (error && typeof error === "object" && "code" in error) {
    const code = String(error.code);

    if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
      return "Nao foi possivel conectar ao Postgres. Suba o banco com docker compose ou confira DATABASE_URL.";
    }

    if (code === "42P01" || code === "42703" || code === "42883") {
      return "Banco sem schema atualizado. Rode bun run db:push e depois bun run db:seed.";
    }
  }

  return "Erro ao acessar o banco de dados. Confira se o Postgres esta rodando e se o schema foi aplicado.";
}

async function requireAdminSession() {
  const session = await getSession();

  if (!session) {
    return { error: "Sessao expirada. Entre novamente." as const };
  }

  if (session.role !== "super-user" && session.role !== "admin") {
    return { error: "Acesso administrativo negado." as const };
  }

  if (!session.tenantId) {
    return { error: "Usuario sem tenant ativo." as const };
  }

  return { session };
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = authInputSchema.safeParse({
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  let user: typeof users.$inferSelect | undefined;

  try {
    [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { ok: false, message: "Email ou senha invalidos." };
  }

  await createSession(user);
  redirect("/");
}

export async function registerAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerInputSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  let existing: Array<{ id: string }>;
  let userCount = 0;

  try {
    existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);
    const [countRow] = await db.select({ total: sql<number>`count(*)::int` }).from(users);
    userCount = Number(countRow?.total ?? 0);
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  if (existing.length > 0) {
    return { ok: false, message: "Este email ja esta cadastrado." };
  }

  let user: typeof users.$inferSelect;

  try {
    const isFirstUser = userCount === 0;
    const [tenant] = await db
      .insert(tenants)
      .values({
        name: isFirstUser ? "FlowCash Global" : parsed.data.name,
        plan: isFirstUser ? "business" : "free",
        payableLimit: isFirstUser ? "0" : "10",
        receivableLimit: isFirstUser ? "0" : "10",
      })
      .returning();

    [user] = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: isFirstUser ? "super-user" : "admin",
      })
      .returning();
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  await createSession(user);
  redirect("/");
}

export async function requestPasswordResetAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = passwordResetRequestSchema.safeParse({
    email: formString(formData, "email"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Email invalido." };
  }

  let user: typeof users.$inferSelect | undefined;

  try {
    [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  if (!user) {
    return { ok: true, message: "Se o email existir, um token sera gerado." };
  }

  const token = crypto.randomUUID().replaceAll("-", "");
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 30);

  try {
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash: await hashPassword(token),
      expiresAt,
    });
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  return {
    ok: true,
    message: `Token local de recuperacao: ${token}`,
  };
}

export async function resetPasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = passwordResetSchema.safeParse({
    token: formString(formData, "token"),
    password: formString(formData, "password"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  let candidates: Array<typeof passwordResetTokens.$inferSelect>;

  try {
    candidates = await db
      .select()
      .from(passwordResetTokens)
      .where(isNull(passwordResetTokens.usedAt));
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  const now = new Date();
  const tokenRecord = (
    await Promise.all(
      candidates.map(async (candidate) =>
        candidate.expiresAt > now && (await verifyPassword(parsed.data.token, candidate.tokenHash))
          ? candidate
          : null,
      ),
    )
  ).find(Boolean);

  if (!tokenRecord) {
    return { ok: false, message: "Token invalido ou expirado." };
  }

  try {
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(parsed.data.password), updatedAt: new Date() })
      .where(eq(users.id, tokenRecord.userId));
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, tokenRecord.id));
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  return { ok: true, message: "Senha atualizada. Voce ja pode fazer login." };
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function createAccountAction(formData: FormData): Promise<ActionState> {
  const session = await getSession();

  if (!session) {
    return { ok: false, message: "Sessao expirada. Entre novamente." };
  }

  if (!session.tenantId) {
    return { ok: false, message: "Usuario sem tenant ativo." };
  }
  const tenantId = session.tenantId;

  const parsed = accountInputSchema.safeParse(accountPayload(formData));

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  try {
    const limitMessage = await assertAccountLimit(
      tenantId,
      parsed.data.type,
      recurrenceRows(parsed.data.recurrence),
    );

    if (limitMessage) {
      return { ok: false, message: limitMessage };
    }

    const [created] = await db
      .insert(accounts)
      .values({
        tenantId,
        userId: session.userId,
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate,
        amountBrl: parsed.data.amountBrl.toFixed(2),
        amountUsd: parsed.data.amountUsd.toFixed(2),
        type: parsed.data.type,
        status: parsed.data.status,
        category: parsed.data.category || "Geral",
        tags: parsed.data.tags,
        recurrence: parsed.data.recurrence,
        collaboratorEmails: normalizeEmails(parsed.data.collaboratorEmails),
      })
      .returning();

    if (parsed.data.recurrence !== "none") {
      const recurrence = parsed.data.recurrence;
      await db.insert(accounts).values(
        Array.from({ length: 6 }, (_, index) => ({
          tenantId,
          userId: session.userId,
          title: `${parsed.data.title} #${index + 2}`,
          description: parsed.data.description,
          dueDate: addInterval(parsed.data.dueDate, recurrence, index + 1),
          amountBrl: parsed.data.amountBrl.toFixed(2),
          amountUsd: parsed.data.amountUsd.toFixed(2),
          type: parsed.data.type,
          status: "pending" as const,
          category: parsed.data.category || "Geral",
          tags: parsed.data.tags,
          recurrence: parsed.data.recurrence,
          recurrenceParentId: created.id,
          collaboratorEmails: normalizeEmails(parsed.data.collaboratorEmails),
        })),
      );
    }
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function updateAccountAction(
  accountId: string,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();

  if (!session) {
    return { ok: false, message: "Sessao expirada. Entre novamente." };
  }

  const parsed = accountInputSchema.safeParse(accountPayload(formData));

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  let current: Awaited<ReturnType<typeof getAccessibleAccount>>;

  try {
    current = await getAccessibleAccount(accountId, session);
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  if (!current) {
    return { ok: false, message: "Conta nao encontrada." };
  }

  if (parsed.data.type !== current.type) {
    if (!session.tenantId) {
      return { ok: false, message: "Usuario sem tenant ativo." };
    }

    try {
      const limitMessage = await assertAccountLimit(session.tenantId, parsed.data.type, 1);

      if (limitMessage) {
        return { ok: false, message: limitMessage };
      }
    } catch (error) {
      return { ok: false, message: databaseErrorMessage(error) };
    }
  }

  try {
    await db
      .update(accounts)
      .set({
        title: parsed.data.title,
        description: parsed.data.description,
        dueDate: parsed.data.dueDate,
        amountBrl: parsed.data.amountBrl.toFixed(2),
        amountUsd: parsed.data.amountUsd.toFixed(2),
        type: parsed.data.type,
        status: parsed.data.status,
        category: parsed.data.category || "Geral",
        tags: parsed.data.tags,
        recurrence: parsed.data.recurrence,
        collaboratorEmails: normalizeEmails(parsed.data.collaboratorEmails),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId));
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function softDeleteAccountAction(accountId: string): Promise<ActionState> {
  const session = await getSession();

  if (!session) {
    return { ok: false, message: "Sessao expirada. Entre novamente." };
  }

  if (!session.tenantId) {
    return { ok: false, message: "Usuario sem tenant ativo." };
  }

  let current: Awaited<ReturnType<typeof getAccessibleAccount>>;

  try {
    current = await getAccessibleAccount(accountId, session);
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  if (!current) {
    return { ok: false, message: "Conta nao encontrada." };
  }

  try {
    await db
      .update(accounts)
      .set({
        deleted: true,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(accounts.id, accountId));
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  revalidatePath("/");
  return { ok: true };
}

export async function importCsvAction(formData: FormData): Promise<ActionState> {
  const session = await getSession();

  if (!session) {
    return { ok: false, message: "Sessao expirada. Entre novamente." };
  }

  if (!session.tenantId) {
    return { ok: false, message: "Usuario sem tenant ativo." };
  }
  const tenantId = session.tenantId;

  const parsed = importCsvSchema.safeParse({ csv: formString(formData, "csv") });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "CSV invalido." };
  }

  const rows = parsed.data.csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().startsWith("title,"));

  const values = rows
    .map((line) => line.split(",").map((item) => item.trim()))
    .map(([title, description, dueDate, amountBrl, amountUsd, type, status, category, tags]) => {
      const result = accountInputSchema.safeParse({
        title,
        description,
        dueDate,
        amountBrl,
        amountUsd,
        type,
        status,
        category: category || "Importado",
        tags: tags || "importacao",
        recurrence: "none",
        collaboratorEmails: "",
      });

      return result.success
        ? {
            tenantId,
            userId: session.userId,
            title: result.data.title,
            description: result.data.description,
            dueDate: result.data.dueDate,
            amountBrl: result.data.amountBrl.toFixed(2),
            amountUsd: result.data.amountUsd.toFixed(2),
            type: result.data.type,
            status: result.data.status,
            category: result.data.category,
            tags: result.data.tags,
          }
        : null;
    })
    .filter((value) => value !== null);

  if (values.length === 0) {
    return { ok: false, message: "Nenhuma linha valida encontrada." };
  }

  try {
    const incomingByType = values.reduce(
      (total, value) => {
        total[value.type] += 1;
        return total;
      },
      { payable: 0, receivable: 0 },
    );

    for (const type of ["payable", "receivable"] as const) {
      if (incomingByType[type] === 0) {
        continue;
      }

      const limitMessage = await assertAccountLimit(tenantId, type, incomingByType[type]);

      if (limitMessage) {
        return { ok: false, message: limitMessage };
      }
    }

    await db.insert(accounts).values(values);
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }
  revalidatePath("/");

  return { ok: true, message: `${values.length} conta(s) importada(s).` };
}

export async function updateAdminUserAction(formData: FormData): Promise<ActionState> {
  const admin = await requireAdminSession();

  if ("error" in admin) {
    return { ok: false, message: admin.error };
  }

  const parsed = adminUserUpdateSchema.safeParse({
    userId: formString(formData, "userId"),
    name: formString(formData, "name"),
    role: formString(formData, "role"),
    tenantId: formString(formData, "tenantId"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  if (parsed.data.userId === admin.session.userId) {
    return { ok: false, message: "Nao altere seu proprio papel administrativo." };
  }

  try {
    const [target] = await db
      .select({ id: users.id, tenantId: users.tenantId, role: users.role })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);

    if (!target) {
      return { ok: false, message: "Usuario nao encontrado." };
    }

    if (admin.session.role === "admin") {
      if (target.tenantId !== admin.session.tenantId || parsed.data.tenantId !== admin.session.tenantId) {
        return { ok: false, message: "Admin so gerencia usuarios do proprio tenant." };
      }

      if (
        target.role === "super-user" ||
        !adminAssignableRoles.includes(parsed.data.role as (typeof adminAssignableRoles)[number])
      ) {
        return { ok: false, message: "Admin nao pode atribuir este papel." };
      }
    }

    await db
      .update(users)
      .set({
        name: parsed.data.name,
        role: parsed.data.role,
        tenantId: parsed.data.tenantId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parsed.data.userId));
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: "Usuario atualizado." };
}

export async function createAdminTenantAction(formData: FormData): Promise<ActionState> {
  const admin = await requireAdminSession();

  if ("error" in admin) {
    return { ok: false, message: admin.error };
  }

  if (admin.session.role !== "super-user") {
    return { ok: false, message: "Somente super-user pode criar tenants." };
  }

  const parsed = adminTenantCreateSchema.safeParse({
    name: formString(formData, "name"),
    plan: formString(formData, "plan") || "free",
    payableLimit: formString(formData, "payableLimit") || "10",
    receivableLimit: formString(formData, "receivableLimit") || "10",
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  try {
    await db.insert(tenants).values({
      name: parsed.data.name,
      plan: parsed.data.plan,
      payableLimit: String(parsed.data.payableLimit),
      receivableLimit: String(parsed.data.receivableLimit),
    });
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  revalidatePath("/admin");
  return { ok: true, message: "Tenant criado." };
}

export async function createAdminUserAction(formData: FormData): Promise<ActionState> {
  const admin = await requireAdminSession();

  if ("error" in admin) {
    return { ok: false, message: admin.error };
  }

  const parsed = adminUserCreateSchema.safeParse({
    name: formString(formData, "name"),
    email: formString(formData, "email"),
    password: formString(formData, "password"),
    role: formString(formData, "role"),
    tenantId: formString(formData, "tenantId"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  if (admin.session.role === "admin") {
    if (parsed.data.tenantId !== admin.session.tenantId) {
      return { ok: false, message: "Admin so cria usuarios no proprio tenant." };
    }

    if (
      !adminAssignableRoles.includes(parsed.data.role as (typeof adminAssignableRoles)[number])
    ) {
      return { ok: false, message: "Admin nao pode atribuir este papel." };
    }
  }

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);

    if (existing.length > 0) {
      return { ok: false, message: "Email ja cadastrado." };
    }

    await db.insert(users).values({
      tenantId: parsed.data.tenantId,
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
    });
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  revalidatePath("/admin");
  return { ok: true, message: "Usuario criado." };
}

export async function deleteAdminUserAction(formData: FormData): Promise<ActionState> {
  const admin = await requireAdminSession();

  if ("error" in admin) {
    return { ok: false, message: admin.error };
  }

  const parsed = adminUserDeleteSchema.safeParse({
    userId: formString(formData, "userId"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  if (parsed.data.userId === admin.session.userId) {
    return { ok: false, message: "Nao remova seu proprio usuario." };
  }

  try {
    const [target] = await db
      .select({ id: users.id, tenantId: users.tenantId, role: users.role })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);

    if (!target) {
      return { ok: false, message: "Usuario nao encontrado." };
    }

    if (target.role === "super-user") {
      return { ok: false, message: "Super-user nao pode ser removido pelo painel." };
    }

    if (admin.session.role === "admin" && target.tenantId !== admin.session.tenantId) {
      return { ok: false, message: "Admin so remove usuarios do proprio tenant." };
    }

    await db.delete(users).where(eq(users.id, parsed.data.userId));
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: "Usuario removido." };
}

export async function updateAdminTenantAction(formData: FormData): Promise<ActionState> {
  const admin = await requireAdminSession();

  if ("error" in admin) {
    return { ok: false, message: admin.error };
  }

  const parsed = adminTenantUpdateSchema.safeParse({
    tenantId: formString(formData, "tenantId"),
    name: formString(formData, "name"),
    plan: formString(formData, "plan"),
    payableLimit: formString(formData, "payableLimit"),
    receivableLimit: formString(formData, "receivableLimit"),
  });

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  if (admin.session.role !== "super-user" && parsed.data.tenantId !== admin.session.tenantId) {
    return { ok: false, message: "Admin so gerencia o proprio tenant." };
  }

  if (admin.session.role !== "super-user") {
    return { ok: false, message: "Somente super-user altera plano e limites." };
  }

  try {
    await db
      .update(tenants)
      .set({
        name: parsed.data.name,
        plan: parsed.data.plan,
        payableLimit: String(parsed.data.payableLimit),
        receivableLimit: String(parsed.data.receivableLimit),
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, parsed.data.tenantId));
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  revalidatePath("/admin");
  revalidatePath("/");
  return { ok: true, message: "Tenant atualizado." };
}
