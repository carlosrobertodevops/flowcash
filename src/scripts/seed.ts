import { eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { accounts, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";

const adminEmail = "admin@flowclash.com";
const adminPassword = "@flowcash123";

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(12, 0, 0, 0);
  return date;
}

const sampleAccounts = [
  {
    title: "Aluguel do apartamento",
    description: "Despesa fixa mensal da moradia.",
    dueDate: daysFromNow(-4),
    amountBrl: "2400.00",
    amountUsd: "470.00",
    type: "payable" as const,
    status: "pending" as const,
    category: "Moradia",
    tags: "fixo, casa",
    recurrence: "monthly" as const,
    collaboratorEmails: "",
  },
  {
    title: "Projeto freelance",
    description: "Recebimento pendente de landing page entregue.",
    dueDate: daysFromNow(3),
    amountBrl: "3800.00",
    amountUsd: "745.00",
    type: "receivable" as const,
    status: "pending" as const,
    category: "Trabalho",
    tags: "freelance, cliente",
    recurrence: "none" as const,
    collaboratorEmails: "",
  },
  {
    title: "Internet fibra",
    description: "Conta residencial de internet.",
    dueDate: daysFromNow(6),
    amountBrl: "129.90",
    amountUsd: "25.50",
    type: "payable" as const,
    status: "pending" as const,
    category: "Servicos",
    tags: "internet, fixo",
    recurrence: "monthly" as const,
    collaboratorEmails: "",
  },
  {
    title: "Assinatura de software",
    description: "Ferramentas de produtividade pagas no cartao.",
    dueDate: daysFromNow(-10),
    amountBrl: "89.90",
    amountUsd: "17.60",
    type: "payable" as const,
    status: "paid" as const,
    category: "Software",
    tags: "assinatura",
    recurrence: "monthly" as const,
    collaboratorEmails: "",
  },
  {
    title: "Consultoria financeira",
    description: "Sessao avulsa ja recebida via transferencia.",
    dueDate: daysFromNow(-2),
    amountBrl: "650.00",
    amountUsd: "127.50",
    type: "receivable" as const,
    status: "received" as const,
    category: "Consultoria",
    tags: "receita, avulso",
    recurrence: "none" as const,
    collaboratorEmails: "",
  },
];

async function main() {
  const passwordHash = await hashPassword(adminPassword);

  const [admin] = await db
    .insert(users)
    .values({
      name: "Admin FlowCash",
      email: adminEmail,
      passwordHash,
      role: "admin",
    })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        name: "Admin FlowCash",
        passwordHash,
        role: "admin",
        updatedAt: new Date(),
      },
    })
    .returning();

  for (const account of sampleAccounts) {
    const existing = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(eq(accounts.title, account.title))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(accounts).values({
        ...account,
        userId: admin.id,
      });
    }
  }

  console.log(`Seed concluido. Admin: ${adminEmail} / ${adminPassword}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
