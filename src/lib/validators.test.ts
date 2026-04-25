import { describe, expect, test } from "bun:test";
import { accountInputSchema } from "./validators";

describe("account input schema", () => {
  test("normalizes form values with Zod coercion and defaults", () => {
    const parsed = accountInputSchema.parse({
      title: "  Aluguel  ",
      description: "  Pagamento mensal  ",
      dueDate: "2026-05-10",
      amountBrl: "1500.50",
      amountUsd: "291.36",
      type: "payable",
      status: "pending",
      category: "  ",
      tags: "  casa, fixo  ",
      recurrence: "none",
      collaboratorEmails: "  amigo@example.com  ",
    });

    expect(parsed).toMatchObject({
      title: "Aluguel",
      description: "Pagamento mensal",
      amountBrl: 1500.5,
      amountUsd: 291.36,
      type: "payable",
      status: "pending",
      category: "Geral",
      tags: "casa, fixo",
      recurrence: "none",
      collaboratorEmails: "amigo@example.com",
    });
    expect(parsed.dueDate).toBeInstanceOf(Date);
  });

  test("rejects status incompatible with account type", () => {
    const parsed = accountInputSchema.safeParse({
      title: "Cliente A",
      description: "Recebimento mensal",
      dueDate: "2026-05-10",
      amountBrl: "900",
      amountUsd: "174.76",
      type: "receivable",
      status: "paid",
      category: "Servicos",
      tags: "cliente",
      recurrence: "none",
      collaboratorEmails: "",
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.message).toBe("Conta a receber nao pode ficar como paga.");
    }
  });
});
