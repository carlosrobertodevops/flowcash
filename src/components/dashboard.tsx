"use client";

import type React from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BellRing,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  GripVertical,
  LogOut,
  Plus,
  Printer,
  Upload,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { importCsvAction, logoutAction } from "@/app/actions";
import { AccountDialog, type DashboardAccount } from "@/components/account-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DASHBOARD_LAYOUT_STORAGE_KEY,
  DASHBOARD_WIDGET_IDS,
  type DashboardDropPlacement,
  type DashboardWidgetId,
  parseDashboardLayout,
  reorderDashboardLayout,
  serializeDashboardLayout,
} from "@/lib/dashboard-layout";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type DashboardProps = {
  user: {
    name: string;
    email: string;
  };
  accounts: DashboardAccount[];
  exchangeRate: number;
};

const statusLabel = {
  pending: "Pendente",
  paid: "Paga",
  received: "Recebida",
};

const typeLabel = {
  payable: "A pagar",
  receivable: "A receber",
};

const csvHeader =
  "title,description,dueDate,amountBrl,amountUsd,type,status,category,tags,collaboratorEmails";

const widgetTitle: Record<DashboardWidgetId, string> = {
  notifications: "Notificacoes",
  import: "Importacao CSV",
  metrics: "Cards",
  accounts: "Contas",
  chart: "Resumo visual",
  table: "Tabela",
};

const widgetSize: Record<DashboardWidgetId, string> = {
  notifications: "xl:col-span-6",
  import: "xl:col-span-6",
  metrics: "xl:col-span-12",
  accounts: "xl:col-span-7",
  chart: "xl:col-span-5",
  table: "xl:col-span-5",
};

function isSameOrAfterToday(date: Date, today: Date) {
  const cleanDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const cleanToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return cleanDate >= cleanToday;
}

export function Dashboard({ user, accounts, exchangeRate }: DashboardProps) {
  const [selectedAccount, setSelectedAccount] = useState<DashboardAccount | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [importMessage, setImportMessage] = useState("");
  const [isImporting, startImport] = useTransition();
  const [layout, setLayout] = useState<DashboardWidgetId[]>([...DASHBOARD_WIDGET_IDS]);
  const [draggedWidget, setDraggedWidget] = useState<DashboardWidgetId | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    widgetId: DashboardWidgetId;
    placement: DashboardDropPlacement;
  } | null>(null);
  const [layoutLoaded, setLayoutLoaded] = useState(false);

  useEffect(() => {
    setLayout(parseDashboardLayout(window.localStorage.getItem(DASHBOARD_LAYOUT_STORAGE_KEY)));
    setLayoutLoaded(true);
  }, []);

  useEffect(() => {
    if (!layoutLoaded) {
      return;
    }

    window.localStorage.setItem(DASHBOARD_LAYOUT_STORAGE_KEY, serializeDashboardLayout(layout));
  }, [layout, layoutLoaded]);

  const visibleAccounts = useMemo(() => {
    const term = filter.trim().toLowerCase();

    if (!term) {
      return accounts;
    }

    return accounts.filter((account) =>
      [account.title, account.description, account.category, account.tags, account.collaboratorEmails]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [accounts, filter]);

  const stats = useMemo(() => {
    const today = new Date();
    const sevenDays = new Date(today);
    sevenDays.setDate(today.getDate() + 7);

    const overdue = visibleAccounts.filter(
      (account) => account.status === "pending" && new Date(account.dueDate) < today,
    );
    const dueSoon = visibleAccounts.filter((account) => {
      const dueDate = new Date(account.dueDate);
      return (
        account.status === "pending" && isSameOrAfterToday(dueDate, today) && dueDate <= sevenDays
      );
    });
    const settled = visibleAccounts.filter(
      (account) => account.status === "paid" || account.status === "received",
    );
    const payable = visibleAccounts
      .filter((account) => account.type === "payable")
      .reduce((total, account) => total + Number(account.amountBrl), 0);
    const receivable = visibleAccounts
      .filter((account) => account.type === "receivable")
      .reduce((total, account) => total + Number(account.amountBrl), 0);

    return {
      overdue,
      dueSoon,
      settled,
      payable,
      receivable,
      chart: [
        { name: "Vencidas", total: overdue.length },
        { name: "7 dias", total: dueSoon.length },
        { name: "Finalizadas", total: settled.length },
      ],
    };
  }, [visibleAccounts]);

  const notifications = [...stats.overdue, ...stats.dueSoon].slice(0, 4);

  function createAccount() {
    setSelectedAccount(null);
    setDialogOpen(true);
  }

  function editAccount(account: DashboardAccount) {
    setSelectedAccount(account);
    setDialogOpen(true);
  }

  function exportCsv() {
    const lines = visibleAccounts.map((account) =>
      [
        account.title,
        account.description,
        account.dueDate.slice(0, 10),
        account.amountBrl,
        account.amountUsd,
        account.type,
        account.status,
        account.category,
        account.tags,
        account.collaboratorEmails,
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(","),
    );
    const blob = new Blob([[csvHeader, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "flowcash-contas.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function importCsv(formData: FormData) {
    setImportMessage("");
    startImport(async () => {
      const result = await importCsvAction(formData);
      setImportMessage(result.message ?? (result.ok ? "Importacao concluida." : "Falha na importacao."));
    });
  }

  function updateDropTarget(event: React.DragEvent<HTMLElement>, targetWidget: DashboardWidgetId) {
    event.preventDefault();

    if (!draggedWidget || draggedWidget === targetWidget) {
      setDropTarget(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const placement = event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    event.dataTransfer.dropEffect = "move";
    setDropTarget({ widgetId: targetWidget, placement });
  }

  function moveWidget(targetWidget: DashboardWidgetId) {
    if (!draggedWidget) {
      return;
    }

    const placement = dropTarget?.widgetId === targetWidget ? dropTarget.placement : "before";
    setLayout((current) => reorderDashboardLayout(current, draggedWidget, targetWidget, placement));
    setDraggedWidget(null);
    setDropTarget(null);
  }

  function renderWidget(widgetId: DashboardWidgetId) {
    if (widgetId === "notifications") {
      return (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <BellRing size={18} className="text-sky-500" />
            <h2 className="font-semibold">Notificacoes</h2>
          </div>
          <div className="grid gap-2">
            {notifications.length > 0 ? (
              notifications.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  className="rounded-lg border border-border bg-background/45 px-3 py-2 text-left text-sm transition hover:border-sky-400/60"
                  onClick={() => editAccount(account)}
                >
                  <span className="font-medium">{account.title}</span>{" "}
                  <span className="text-muted-foreground">
                    vence em {formatDate(account.dueDate)}
                  </span>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma conta urgente no momento.</p>
            )}
          </div>
        </Card>
      );
    }

    if (widgetId === "import") {
      return (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <Upload size={18} className="text-sky-500" />
            <h2 className="font-semibold">Importacao bancaria CSV</h2>
          </div>
          <form action={importCsv} className="grid gap-3">
            <textarea
              name="csv"
              className="min-h-24 resize-none rounded-lg border border-border bg-background/55 p-3 text-xs outline-none focus:border-sky-400"
              placeholder={`${csvHeader}\nCartao,Compra mercado,2026-04-30,180.90,35.12,payable,pending,Alimentacao,mercado`}
            />
            {importMessage ? <p className="text-sm text-muted-foreground">{importMessage}</p> : null}
            <Button type="submit" variant="secondary" disabled={isImporting}>
              <FileText size={16} /> {isImporting ? "Importando..." : "Importar CSV"}
            </Button>
          </form>
        </Card>
      );
    }

    if (widgetId === "metrics") {
      return (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Clock3 size={20} />}
            label="Vencidas"
            value={stats.overdue.length.toString()}
            detail="Pendentes com data passada"
          />
          <MetricCard
            icon={<WalletCards size={20} />}
            label="Proximos 7 dias"
            value={stats.dueSoon.length.toString()}
            detail="Contas pendentes no radar"
          />
          <MetricCard
            icon={<CheckCircle2 size={20} />}
            label="Pagas/recebidas"
            value={stats.settled.length.toString()}
            detail="Fluxos ja finalizados"
          />
          <MetricCard
            icon={<ArrowUpRight size={20} />}
            label="Saldo previsto"
            value={formatCurrency(stats.receivable - stats.payable)}
            detail={`${formatCurrency(stats.receivable)} a receber`}
          />
        </section>
      );
    }

    if (widgetId === "accounts") {
      return (
        <section className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">Contas</h2>
            <div className="flex items-center gap-2">
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="h-9 w-44 rounded-lg border border-border bg-background/55 px-3 text-sm outline-none focus:border-sky-400"
                placeholder="Filtrar"
              />
              <Badge>{visibleAccounts.length} ativas</Badge>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {visibleAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                className="text-left"
                onClick={() => editAccount(account)}
              >
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge
                        className={cn(
                          account.type === "receivable"
                            ? "border-emerald-400/40 text-emerald-500"
                            : "border-amber-400/40 text-amber-500",
                        )}
                      >
                        {typeLabel[account.type]}
                      </Badge>
                      <Badge className="ml-2">{account.category}</Badge>
                      <h3 className="mt-3 text-lg font-semibold">{account.title}</h3>
                    </div>
                    {account.type === "receivable" ? (
                      <ArrowDownLeft className="text-emerald-500" size={22} />
                    ) : (
                      <ArrowUpRight className="text-amber-500" size={22} />
                    )}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {account.description}
                  </p>
                  {account.tags ? <p className="mt-2 text-xs text-sky-500">{account.tags}</p> : null}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xl font-semibold">{formatCurrency(account.amountBrl)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(account.amountUsd, "USD")}
                      </p>
                    </div>
                    <div className="text-right text-sm">
                      <p>{formatDate(account.dueDate)}</p>
                      <p className="text-muted-foreground">{statusLabel[account.status]}</p>
                    </div>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </section>
      );
    }

    if (widgetId === "chart") {
      return (
        <Card className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Resumo visual</h2>
              <p className="text-sm text-muted-foreground">Situacao das contas</p>
            </div>
            <Badge>Interativo</Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chart}>
                <CartesianGrid strokeDasharray="4 4" stroke="currentColor" opacity={0.12} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip
                  cursor={{ fill: "rgba(56, 189, 248, 0.08)" }}
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid rgba(56,189,248,.25)",
                    background: "rgba(15,23,42,.88)",
                    color: "white",
                  }}
                />
                <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      );
    }

    return (
      <Card className="overflow-hidden">
        <div className="border-b border-border p-4">
          <h2 className="text-lg font-semibold">Tabela</h2>
        </div>
        <div className="overflow-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-muted/45 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Titulo</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Vencimento</th>
                <th className="px-4 py-3 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {visibleAccounts.map((account) => (
                <tr
                  key={account.id}
                  className="cursor-pointer border-t border-border transition hover:bg-sky-500/8"
                  onClick={() => editAccount(account)}
                >
                  <td className="px-4 py-3 font-medium">{account.title}</td>
                  <td className="px-4 py-3">{typeLabel[account.type]}</td>
                  <td className="px-4 py-3">{statusLabel[account.status]}</td>
                  <td className="px-4 py-3">{account.category}</td>
                  <td className="px-4 py-3">{formatDate(account.dueDate)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(account.amountBrl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-xl border border-border bg-card/55 p-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-sky-500">FlowCash</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Controle de contas
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {user.name} · {user.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button type="button" variant="secondary" onClick={exportCsv}>
              <Download size={16} /> CSV
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.print()}>
              <Printer size={16} /> PDF
            </Button>
            <form action={logoutAction}>
              <Button type="submit" variant="secondary">
                <LogOut size={16} /> Sair
              </Button>
            </form>
            <Button onClick={createAccount}>
              <Plus size={16} /> Nova conta
            </Button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          {layout.map((widgetId) => (
            <section
              key={widgetId}
              className={cn(
                "group relative min-w-0 rounded-xl transition duration-200",
                widgetSize[widgetId],
                draggedWidget === widgetId ? "opacity-60" : "",
                dropTarget?.widgetId === widgetId ? "scale-[0.99]" : "",
              )}
              onDragEnter={(event) => updateDropTarget(event, widgetId)}
              onDragOver={(event) => updateDropTarget(event, widgetId)}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                  setDropTarget(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                moveWidget(widgetId);
              }}
            >
              {dropTarget?.widgetId === widgetId ? (
                <div
                  className={cn(
                    "pointer-events-none absolute left-0 right-0 z-20 h-2 rounded-full bg-sky-400 shadow-[0_0_22px_rgba(56,189,248,.85)]",
                    dropTarget.placement === "before" ? "-top-2" : "-bottom-2",
                  )}
                />
              ) : null}
              <button
                type="button"
                draggable
                aria-label={`Mover ${widgetTitle[widgetId]}`}
                title={`Mover ${widgetTitle[widgetId]}`}
                className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 cursor-grab items-center justify-center rounded-lg border border-sky-400/30 bg-background/80 text-sky-500 opacity-80 shadow-sm backdrop-blur transition hover:border-sky-400 hover:opacity-100 active:cursor-grabbing"
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", widgetId);
                  setDraggedWidget(widgetId);
                }}
                onDragEnd={() => {
                  setDraggedWidget(null);
                  setDropTarget(null);
                }}
              >
                <GripVertical size={16} />
              </button>
              <div
                className={cn(
                  "min-h-full rounded-xl transition duration-200 group-hover:ring-1 group-hover:ring-sky-400/30",
                  dropTarget?.widgetId === widgetId
                    ? "ring-2 ring-sky-400/60 ring-offset-2 ring-offset-background"
                    : "",
                )}
              >
                {renderWidget(widgetId)}
              </div>
            </section>
          ))}
        </section>
      </div>

      <AccountDialog
        account={selectedAccount}
        exchangeRate={exchangeRate}
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-sky-500">
        <span className="rounded-lg border border-sky-400/30 bg-sky-400/10 p-2">{icon}</span>
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </Card>
  );
}
