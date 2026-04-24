import { z } from "zod";

const moneySchema = z.coerce
  .number({ invalid_type_error: "Informe um valor valido." })
  .min(0, "O valor nao pode ser negativo.")
  .max(999999999.99, "O valor informado e muito alto.");

export const accountInputSchema = z
  .object({
    title: z.string().trim().min(2, "Titulo deve ter pelo menos 2 caracteres.").max(120),
    description: z.string().trim().min(2, "Descricao deve ter pelo menos 2 caracteres.").max(800),
    dueDate: z.coerce.date({ invalid_type_error: "Informe uma data de vencimento valida." }),
    amountBrl: moneySchema,
    amountUsd: moneySchema,
    type: z.enum(["payable", "receivable"]),
    status: z.enum(["pending", "paid", "received"]),
    category: z.string().trim().max(80).default("Geral"),
    tags: z.string().trim().max(240).default(""),
    recurrence: z.enum(["none", "monthly", "yearly"]).default("none"),
    collaboratorEmails: z.string().trim().max(500).default(""),
  })
  .superRefine((data, ctx) => {
    if (data.type === "payable" && data.status === "received") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "Conta a pagar nao pode ficar como recebida.",
      });
    }

    if (data.type === "receivable" && data.status === "paid") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message: "Conta a receber nao pode ficar como paga.",
      });
    }
  });

export const authInputSchema = z.object({
  email: z.string().trim().email("Informe um email valido.").toLowerCase(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});

export const registerInputSchema = authInputSchema.extend({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres.").max(100),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().trim().email("Informe um email valido.").toLowerCase(),
});

export const passwordResetSchema = z.object({
  token: z.string().trim().min(12, "Informe um token valido."),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
});

export const importCsvSchema = z.object({
  csv: z.string().trim().min(10, "Cole pelo menos uma linha CSV valida."),
});

export const adminUserUpdateSchema = z.object({
  userId: z.string().uuid("Usuario invalido."),
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres.").max(100),
  role: z.enum(["admin", "standard", "free", "super-user"]),
  tenantId: z.string().uuid("Tenant invalido."),
});

export const adminTenantUpdateSchema = z.object({
  tenantId: z.string().uuid("Tenant invalido."),
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres.").max(100),
  plan: z.enum(["free", "standard", "business"]),
  payableLimit: z.coerce
    .number({ invalid_type_error: "Limite a pagar invalido." })
    .int("Limite a pagar deve ser inteiro.")
    .min(0, "Limite a pagar nao pode ser negativo.")
    .max(999999, "Limite a pagar muito alto."),
  receivableLimit: z.coerce
    .number({ invalid_type_error: "Limite a receber invalido." })
    .int("Limite a receber deve ser inteiro.")
    .min(0, "Limite a receber nao pode ser negativo.")
    .max(999999, "Limite a receber muito alto."),
});

export const adminTenantCreateSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres.").max(100),
  plan: z.enum(["free", "standard", "business"]).default("free"),
  payableLimit: z.coerce
    .number({ invalid_type_error: "Limite a pagar invalido." })
    .int("Limite a pagar deve ser inteiro.")
    .min(0, "Limite a pagar nao pode ser negativo.")
    .max(999999, "Limite a pagar muito alto.")
    .default(10),
  receivableLimit: z.coerce
    .number({ invalid_type_error: "Limite a receber invalido." })
    .int("Limite a receber deve ser inteiro.")
    .min(0, "Limite a receber nao pode ser negativo.")
    .max(999999, "Limite a receber muito alto.")
    .default(10),
});

export const adminUserCreateSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres.").max(100),
  email: z.string().trim().email("Informe um email valido.").toLowerCase(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres."),
  role: z.enum(["admin", "standard", "free", "super-user"]),
  tenantId: z.string().uuid("Tenant invalido."),
});

export const adminUserDeleteSchema = z.object({
  userId: z.string().uuid("Usuario invalido."),
});

export type AccountInput = z.infer<typeof accountInputSchema>;
