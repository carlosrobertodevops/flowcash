import { and, asc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { redirect, unstable_rethrow } from "next/navigation";
import { updateAdminTenantAction, updateAdminUserAction } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { db } from "@/db";
import { accounts, tenants, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";

async function updateTenantFormAction(formData: FormData) {
  "use server";
  await updateAdminTenantAction(formData);
}

async function updateUserFormAction(formData: FormData) {
  "use server";
  await updateAdminUserAction(formData);
}

const roleLabel = {
  "super-user": "Super-user",
  admin: "Admin",
  standard: "Standard",
  free: "Free",
  user: "Legado",
};

const planLabel = {
  free: "Free",
  standard: "Standard",
  business: "Business",
};

function quotaText(used: number, limit: number) {
  return limit <= 0 ? `${used}/ilimitado` : `${used}/${limit}`;
}

export default async function AdminPage() {
  let currentUser: Awaited<ReturnType<typeof getCurrentUser>>;

  try {
    currentUser = await getCurrentUser();
  } catch (error) {
    unstable_rethrow(error);
    console.error("FlowCash admin user load failed:", error);
    return <AdminSetupError />;
  }

  if (!currentUser) {
    redirect("/login");
  }

  if (currentUser.role !== "super-user" && currentUser.role !== "admin") {
    redirect("/");
  }

  if (!currentUser.tenantId) {
    return <AdminSetupError />;
  }

  const isSuperUser = currentUser.role === "super-user";

  let tenantRows: Array<{
    id: string;
    name: string;
    plan: "free" | "standard" | "business";
    payableLimit: string;
    receivableLimit: string;
    userCount: number;
    payableUsed: number;
    receivableUsed: number;
  }>;
  let userRows: Array<{
    id: string;
    name: string;
    email: string;
    role: "user" | "admin" | "super-user" | "standard" | "free";
    tenantId: string | null;
    tenantName: string | null;
    createdAt: Date;
  }>;

  try {
    tenantRows = await db
      .select({
        id: tenants.id,
        name: tenants.name,
        plan: tenants.plan,
        payableLimit: tenants.payableLimit,
        receivableLimit: tenants.receivableLimit,
        userCount: sql<number>`count(distinct ${users.id})::int`,
        payableUsed: sql<number>`count(distinct ${accounts.id}) filter (where ${accounts.type} = 'payable' and ${accounts.deleted} = false)::int`,
        receivableUsed: sql<number>`count(distinct ${accounts.id}) filter (where ${accounts.type} = 'receivable' and ${accounts.deleted} = false)::int`,
      })
      .from(tenants)
      .leftJoin(users, eq(users.tenantId, tenants.id))
      .leftJoin(accounts, eq(accounts.tenantId, tenants.id))
      .where(isSuperUser ? undefined : eq(tenants.id, currentUser.tenantId))
      .groupBy(tenants.id)
      .orderBy(asc(tenants.name));

    userRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        tenantId: users.tenantId,
        tenantName: tenants.name,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(tenants, eq(users.tenantId, tenants.id))
      .where(isSuperUser ? undefined : and(eq(users.tenantId, currentUser.tenantId)))
      .orderBy(asc(users.name), asc(users.email));
  } catch (error) {
    unstable_rethrow(error);
    console.error("FlowCash admin load failed:", error);
    return <AdminSetupError />;
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-xl border border-border bg-card/55 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-sky-500">Administracao</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Usuarios e planos SaaS
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {currentUser.name} · {roleLabel[currentUser.role]} ·{" "}
              {isSuperUser ? "dominio global" : "dominio do tenant"}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-card/70 px-4 text-sm font-medium text-foreground backdrop-blur transition hover:border-sky-400/70 hover:text-sky-500"
          >
            Dashboard
          </Link>
        </header>

        <section className="grid gap-4 xl:grid-cols-3">
          {tenantRows.map((tenant) => (
            <Card key={tenant.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-sky-500">{tenant.name}</p>
                  <h2 className="mt-1 text-xl font-semibold">{planLabel[tenant.plan]}</h2>
                </div>
                <Badge>{tenant.userCount} usuario(s)</Badge>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <p>A pagar: {quotaText(tenant.payableUsed, Number(tenant.payableLimit))}</p>
                <p>A receber: {quotaText(tenant.receivableUsed, Number(tenant.receivableLimit))}</p>
              </div>
              {isSuperUser ? (
                <form action={updateTenantFormAction} className="mt-4 grid gap-3">
                  <input type="hidden" name="tenantId" value={tenant.id} />
                  <Input name="name" defaultValue={tenant.name} aria-label="Nome do tenant" />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Select name="plan" defaultValue={tenant.plan} aria-label="Plano">
                      <option value="free">Free</option>
                      <option value="standard">Standard</option>
                      <option value="business">Business</option>
                    </Select>
                    <Input
                      name="payableLimit"
                      type="number"
                      min="0"
                      defaultValue={tenant.payableLimit}
                      aria-label="Limite a pagar"
                    />
                    <Input
                      name="receivableLimit"
                      type="number"
                      min="0"
                      defaultValue={tenant.receivableLimit}
                      aria-label="Limite a receber"
                    />
                  </div>
                  <Button type="submit" variant="secondary">
                    Salvar plano
                  </Button>
                </form>
              ) : null}
            </Card>
          ))}
        </section>

        <Card className="overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-semibold">Usuarios</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSuperUser
                ? "Super-user coordena todos os usuarios do app."
                : "Admin coordena apenas usuarios do proprio tenant."}
            </p>
          </div>
          <div className="overflow-auto">
            <table className="w-full min-w-[920px] text-sm">
              <thead className="bg-muted/45 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Papel</th>
                  <th className="px-4 py-3 text-right font-medium">Acao</th>
                </tr>
              </thead>
              <tbody>
                {userRows.map((user) => {
                  const locked = user.id === currentUser.id || user.role === "super-user";
                  const formId = `admin-user-${user.id}`;
                  return (
                    <tr key={user.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <Input
                          form={formId}
                          name="name"
                          defaultValue={user.name}
                          disabled={locked}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-4 py-3">
                        <Select
                          form={formId}
                          name="tenantId"
                          defaultValue={user.tenantId ?? ""}
                          disabled={locked}
                        >
                          {tenantRows.map((tenant) => (
                            <option key={tenant.id} value={tenant.id}>
                              {tenant.name}
                            </option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Select
                          form={formId}
                          name="role"
                          defaultValue={user.role === "user" ? "free" : user.role}
                          disabled={locked}
                        >
                          {isSuperUser ? <option value="super-user">Super-user</option> : null}
                          <option value="admin">Admin</option>
                          <option value="standard">Standard</option>
                          <option value="free">Free</option>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <form id={formId} action={updateUserFormAction}>
                          <input type="hidden" name="userId" value={user.id} />
                          <Button type="submit" variant="secondary" disabled={locked}>
                            Salvar
                          </Button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </main>
  );
}

function AdminSetupError() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Card className="max-w-xl p-6">
        <p className="text-sm font-medium uppercase tracking-wide text-sky-500">
          FlowCash · admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Administração indisponível
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Não foi possível carregar usuários, tenants e planos. Verifique se o schema SaaS foi
          aplicado no banco.
        </p>
        <pre className="mt-4 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-xs leading-6">
          docker compose up -d db{"\n"}bun run db:push{"\n"}bun src/scripts/upgrade-saas-schema.ts{"\n"}bun run db:seed
        </pre>
      </Card>
    </main>
  );
}
