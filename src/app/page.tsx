import { desc, eq } from "drizzle-orm";
import { redirect, unstable_rethrow } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { Card } from "@/components/ui/card";
import { db } from "@/db";
import { accounts } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  let user: Awaited<ReturnType<typeof getCurrentUser>>;

  try {
    user = await getCurrentUser();
  } catch (error) {
    unstable_rethrow(error);
    console.error("FlowCash dashboard user load failed:", error);
    return <SetupError />;
  }

  if (!user) {
    redirect("/login");
  }

  let accountRows: Array<typeof accounts.$inferSelect>;

  try {
    accountRows = await db
      .select()
      .from(accounts)
      .where(eq(accounts.deleted, false))
      .orderBy(desc(accounts.dueDate));
  } catch (error) {
    unstable_rethrow(error);
    console.error("FlowCash dashboard accounts load failed:", error);
    return <SetupError />;
  }

  const visibleAccounts = accountRows.filter((account) => {
    const collaborators = account.collaboratorEmails
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean);

    return account.userId === user.id || collaborators.includes(user.email.toLowerCase());
  });

  const exchangeRate = Number(process.env.EXCHANGE_RATE_BRL_USD ?? "5.15");

  return (
    <Dashboard
      user={{ name: user.name, email: user.email }}
      exchangeRate={Number.isFinite(exchangeRate) && exchangeRate > 0 ? exchangeRate : 5.15}
      accounts={visibleAccounts.map((account) => ({
        id: account.id,
        title: account.title,
        description: account.description,
        dueDate: account.dueDate.toISOString(),
        amountBrl: account.amountBrl,
        amountUsd: account.amountUsd,
        type: account.type,
        status: account.status,
        category: account.category,
        tags: account.tags,
        recurrence: account.recurrence,
        collaboratorEmails: account.collaboratorEmails,
        createdAt: account.createdAt.toISOString(),
      }))}
    />
  );
}

function SetupError() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-xl p-6">
        <p className="text-sm text-sky-500">FlowCash setup</p>
        <h1 className="mt-2 text-2xl font-semibold">Banco de dados indisponivel</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Nao foi possivel carregar os dados do Postgres. Verifique se o banco esta rodando e
          aplique o schema antes de acessar o dashboard.
        </p>
        <pre className="mt-4 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-sm">
          docker-compose up -d db{"\n"}bun run db:push{"\n"}bun run db:seed
        </pre>
      </Card>
    </main>
  );
}
