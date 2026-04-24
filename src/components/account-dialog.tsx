"use client";

import { Calendar, DollarSign, Repeat2, Save, Tags, Trash2, UsersRound, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  createAccountAction,
  softDeleteAccountAction,
  updateAccountAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { dateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DashboardAccount = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  amountBrl: string;
  amountUsd: string;
  type: "payable" | "receivable";
  status: "pending" | "paid" | "received";
  category: string;
  tags: string;
  recurrence: "none" | "monthly" | "yearly";
  collaboratorEmails: string;
  createdAt: string;
};

type AccountDialogProps = {
  account: DashboardAccount | null;
  exchangeRate: number;
  open: boolean;
  onClose: () => void;
};

const emptyAccount = {
  title: "",
  description: "",
  dueDate: dateInputValue(new Date()),
  amountBrl: "",
  amountUsd: "",
  type: "payable",
  status: "pending",
  category: "Geral",
  tags: "",
  recurrence: "none",
  collaboratorEmails: "",
};

export function AccountDialog({ account, exchangeRate, open, onClose }: AccountDialogProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"payable" | "receivable">("payable");
  const [amountBrl, setAmountBrl] = useState("");
  const [amountUsd, setAmountUsd] = useState("");
  const [isPending, startTransition] = useTransition();
  const defaults = useMemo(
    () =>
      account
        ? {
            title: account.title,
            description: account.description,
            dueDate: dateInputValue(account.dueDate),
            amountBrl: account.amountBrl,
            amountUsd: account.amountUsd,
            type: account.type,
            status: account.status,
            category: account.category,
            tags: account.tags,
            recurrence: account.recurrence,
            collaboratorEmails: account.collaboratorEmails,
          }
        : emptyAccount,
    [account],
  );

  useEffect(() => {
    if (open) {
      setMessage("");
      setType(defaults.type as "payable" | "receivable");
      setAmountBrl(defaults.amountBrl);
      setAmountUsd(defaults.amountUsd);
      window.setTimeout(() => formRef.current?.reset(), 0);
    }
  }, [defaults.amountBrl, defaults.amountUsd, defaults.type, open]);

  if (!open) {
    return null;
  }

  function submit(formData: FormData) {
    setMessage("");
    startTransition(async () => {
      const result = account
        ? await updateAccountAction(account.id, formData)
        : await createAccountAction(formData);

      if (!result.ok) {
        setMessage(result.message ?? "Nao foi possivel salvar.");
        return;
      }

      onClose();
    });
  }

  function remove() {
    if (!account) {
      return;
    }

    setMessage("");
    startTransition(async () => {
      const result = await softDeleteAccountAction(account.id);

      if (!result.ok) {
        setMessage(result.message ?? "Nao foi possivel apagar.");
        return;
      }

      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-md">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-xl border border-sky-400/30 bg-background/88 p-5 shadow-[0_0_70px_rgba(14,165,233,.25)] backdrop-blur-2xl animate-float-in">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-sky-500">{account ? "Editar conta" : "Nova conta"}</p>
            <h2 className="text-2xl font-semibold tracking-tight">
              {account ? account.title : "Registrar movimentacao"}
            </h2>
          </div>
          <Button aria-label="Fechar" size="icon" variant="ghost" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form ref={formRef} action={submit} className="grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Titulo
            <Input name="title" defaultValue={defaults.title} placeholder="Ex: Aluguel" required />
          </label>

          <label className="grid gap-2 text-sm font-medium">
            Descricao
            <Textarea
              name="description"
              defaultValue={defaults.description}
              placeholder="Detalhes da conta"
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <Calendar size={16} /> Vencimento
              </span>
              <Input name="dueDate" type="date" defaultValue={defaults.dueDate} required />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <DollarSign size={16} /> Valor BRL
              </span>
              <Input
                name="amountBrl"
                type="number"
                step="0.01"
                min="0"
                value={amountBrl}
                onChange={(event) => setAmountBrl(event.target.value)}
                required
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <DollarSign size={16} /> Valor USD
              </span>
              <Input
                name="amountUsd"
                type="number"
                step="0.01"
                min="0"
                value={amountUsd}
                onChange={(event) => setAmountUsd(event.target.value)}
                required
              />
              <button
                type="button"
                className="text-left text-xs font-medium text-sky-500 hover:text-sky-400"
                onClick={() => setAmountUsd((Number(amountBrl || 0) / exchangeRate).toFixed(2))}
              >
                Calcular por cotacao BRL/USD {exchangeRate.toFixed(2)}
              </button>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              Tipo
              <Select
                name="type"
                defaultValue={defaults.type}
                onChange={(event) => setType(event.target.value as "payable" | "receivable")}
              >
                <option value="payable">A pagar</option>
                <option value="receivable">A receber</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Situacao
              <Select name="status" defaultValue={defaults.status}>
                <option value="pending">Pendente</option>
                {type === "payable" ? (
                  <option value="paid">Paga</option>
                ) : (
                  <option value="received">Recebida</option>
                )}
              </Select>
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <Tags size={16} /> Categoria
              </span>
              <Input name="category" defaultValue={defaults.category} placeholder="Ex: Moradia" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <Tags size={16} /> Tags
              </span>
              <Input name="tags" defaultValue={defaults.tags} placeholder="fixo, casa, urgente" />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              <span className="inline-flex items-center gap-2">
                <Repeat2 size={16} /> Recorrencia
              </span>
              <Select name="recurrence" defaultValue={defaults.recurrence}>
                <option value="none">Sem recorrencia</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </Select>
            </label>
          </div>

          <label className="grid gap-2 text-sm font-medium">
            <span className="inline-flex items-center gap-2">
              <UsersRound size={16} /> Colaboradores
            </span>
            <Input
              name="collaboratorEmails"
              defaultValue={defaults.collaboratorEmails}
              placeholder="email1@dominio.com, email2@dominio.com"
            />
          </label>

          {message ? (
            <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
              {message}
            </p>
          ) : null}

          <div className={cn("flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between")}>
            {account ? (
              <Button type="button" variant="danger" onClick={remove} disabled={isPending}>
                <Trash2 size={16} /> Apagar
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                <Save size={16} /> {isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
