"use server";

import { eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { accounts, passwordResetTokens, users } from "@/db/schema";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import {
  accountInputSchema,
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
  account: { userId: string; collaboratorEmails: string },
  session: { userId: string; email: string },
) {
  if (account.userId === session.userId) {
    return true;
  }

  return account.collaboratorEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .includes(session.email.toLowerCase());
}

async function getAccessibleAccount(accountId: string, session: { userId: string; email: string }) {
  const [account] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);

  if (!account || account.deleted || !canAccess(account, session)) {
    return null;
  }

  return account;
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

  try {
    existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, parsed.data.email))
      .limit(1);
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }

  if (existing.length > 0) {
    return { ok: false, message: "Este email ja esta cadastrado." };
  }

  let user: typeof users.$inferSelect;

  try {
    [user] = await db
      .insert(users)
      .values({
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: "user",
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

  const parsed = accountInputSchema.safeParse(accountPayload(formData));

  if (!parsed.success) {
    return { ok: false, message: firstError(parsed.error) ?? "Dados invalidos." };
  }

  try {
    const [created] = await db
      .insert(accounts)
      .values({
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
    await db.insert(accounts).values(values);
  } catch (error) {
    return { ok: false, message: databaseErrorMessage(error) };
  }
  revalidatePath("/");

  return { ok: true, message: `${values.length} conta(s) importada(s).` };
}
