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

export type AccountInput = z.infer<typeof accountInputSchema>;
