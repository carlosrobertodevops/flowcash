import { and, desc, eq, sql } from "drizzle-orm";
import { redirect, unstable_rethrow } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { Card } from "@/components/ui/card";
import { db } from "@/db";
import { accounts, tenants } from "@/db/schema";
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
  let tenantPlan = {
    name: "FlowCash",
    plan: "free",
    payableLimit: 10,
    receivableLimit: 10,
    payableUsed: 0,
    receivableUsed: 0,
  };

  try {
    if (!user.tenantId) {
      return <SetupError />;
    }

    accountRows = await db
      .select()
      .from(accounts)
      .where(
        user.role === "super-user"
          ? eq(accounts.deleted, false)
          : and(eq(accounts.tenantId, user.tenantId), eq(accounts.deleted, false)),
      )
      .orderBy(desc(accounts.dueDate));

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, user.tenantId))
      .limit(1);
    const [payableCount] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(accounts)
      .where(
        and(
          eq(accounts.tenantId, user.tenantId),
          eq(accounts.type, "payable"),
          eq(accounts.deleted, false),
        ),
      );
    const [receivableCount] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(accounts)
      .where(
        and(
          eq(accounts.tenantId, user.tenantId),
          eq(accounts.type, "receivable"),
          eq(accounts.deleted, false),
        ),
      );

    tenantPlan = {
      name: tenant?.name ?? "FlowCash",
      plan: tenant?.plan ?? "free",
      payableLimit: Number(tenant?.payableLimit ?? 10),
      receivableLimit: Number(tenant?.receivableLimit ?? 10),
      payableUsed: Number(payableCount?.total ?? 0),
      receivableUsed: Number(receivableCount?.total ?? 0),
    };
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

    return (
      user.role === "super-user" ||
      user.role === "admin" ||
      account.userId === user.id ||
      collaborators.includes(user.email.toLowerCase())
    );
  });

  const exchangeRate = Number(process.env.EXCHANGE_RATE_BRL_USD ?? "5.15");

  return (
    <Dashboard
      user={{
        name: user.name,
        email: user.email,
        role: user.role,
        tenantName: tenantPlan.name,
        plan: tenantPlan.plan,
      }}
      quota={{
        payableLimit: tenantPlan.payableLimit,
        receivableLimit: tenantPlan.receivableLimit,
        payableUsed: tenantPlan.payableUsed,
        receivableUsed: tenantPlan.receivableUsed,
      }}
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
        <p className="text-sm font-medium uppercase tracking-wide text-sky-500">
          FlowCash · setup
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Banco de dados indisponível
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Não foi possível carregar os dados do Postgres. Verifique se o banco está rodando e
          aplique o schema antes de acessar o dashboard.
        </p>
        <pre className="mt-4 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-6">
          docker compose up -d db{"\n"}bun run db:push{"\n"}bun run db:seed
        </pre>
        <p className="mt-4 text-xs text-muted-foreground">
          Após inicializar o banco, recarregue esta página.
        </p>
      </Card>
    </main>
  );
}
