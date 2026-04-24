"use client";

import type React from "react";
import { ArrowRight, Eye, LockKeyhole, Mail, UserRound, WalletCards } from "lucide-react";
import { useActionState, useState } from "react";
import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resetPasswordAction,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const initialState = { ok: false, message: "" };

export function AuthPanel() {
  const [mode, setMode] = useState<"login" | "register" | "recover" | "reset">("login");
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, initialState);
  const [registerState, registerFormAction, registerPending] = useActionState(
    registerAction,
    initialState,
  );
  const [recoverState, recoverFormAction, recoverPending] = useActionState(
    requestPasswordResetAction,
    initialState,
  );
  const [resetState, resetFormAction, resetPending] = useActionState(
    resetPasswordAction,
    initialState,
  );
  const activeState =
    mode === "login"
      ? loginState
      : mode === "register"
        ? registerState
        : mode === "recover"
          ? recoverState
          : resetState;

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden overflow-hidden border-r border-border p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute left-16 top-20 h-48 w-48 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="absolute bottom-20 right-24 h-64 w-64 rounded-full bg-emerald-400/14 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-3 text-sky-500 shadow-glow">
              <WalletCards size={28} />
            </span>
            <div>
              <p className="text-sm text-sky-500">FlowCash</p>
              <h1 className="text-4xl font-semibold tracking-tight">Contas no seu ritmo</h1>
            </div>
          </div>
          <p className="mt-8 max-w-xl text-lg leading-8 text-muted-foreground">
            Veja vencimentos, recebimentos e pagamentos em uma tela limpa, com sinais visuais para
            o que precisa de atencao hoje.
          </p>
        </div>

        <div className="relative z-10 grid max-w-2xl gap-4">
          {[
            ["Vencidas", "Priorize contas pendentes antes que elas se acumulem."],
            ["Proximos 7 dias", "Planeje a semana com recebimentos e pagamentos no radar."],
            ["Finalizadas", "Mantenha historico sem apagar registros do banco."],
          ].map(([title, text], index) => (
            <Card
              key={title}
              className="p-5 animate-float-in"
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <div className="flex items-start gap-4">
                <span className="mt-1 h-2 w-2 rounded-full bg-sky-400 shadow-glow animate-pulse-line" />
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-5 flex items-center justify-between lg:justify-end">
            <div className="flex items-center gap-2 lg:hidden">
              <WalletCards className="text-sky-500" size={24} />
              <span className="text-lg font-semibold">FlowCash</span>
            </div>
            <ThemeToggle />
          </div>

          <Card className="p-5 sm:p-6">
            <div className="mb-6">
              <p className="text-sm text-sky-500">
                {mode === "login"
                  ? "Entrar"
                  : mode === "register"
                    ? "Cadastro"
                    : "Recuperacao"}
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                {mode === "login"
                  ? "Acesse seu painel"
                  : mode === "register"
                    ? "Crie sua conta"
                    : mode === "recover"
                      ? "Gere um token local"
                      : "Defina uma nova senha"}
              </h2>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-lg border border-border bg-muted/30 p-1">
              <button
                type="button"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  mode === "login" ? "bg-sky-500 text-white shadow-glow" : "text-muted-foreground",
                )}
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition",
                  mode === "register"
                    ? "bg-sky-500 text-white shadow-glow"
                    : "text-muted-foreground",
                )}
                onClick={() => setMode("register")}
              >
                Cadastro
              </button>
            </div>

            {mode === "login" ? (
              <form action={loginFormAction} className="grid gap-4">
                <Field icon={<Mail size={17} />} label="Email">
                  <Input
                    name="email"
                    type="email"
                    defaultValue="admin@flowclash.com"
                    autoComplete="email"
                    required
                  />
                </Field>
                <Field icon={<LockKeyhole size={17} />} label="Senha">
                  <Input
                    name="password"
                    type="password"
                    defaultValue="@flowcash123"
                    autoComplete="current-password"
                    required
                  />
                </Field>
                {activeState.message ? <ErrorMessage message={activeState.message} /> : null}
                <Button type="submit" disabled={loginPending}>
                  {loginPending ? "Entrando..." : "Entrar"} <ArrowRight size={16} />
                </Button>
              </form>
            ) : (
              mode === "register" ? (
                <form action={registerFormAction} className="grid gap-4">
                  <Field icon={<UserRound size={17} />} label="Nome">
                    <Input name="name" autoComplete="name" required />
                  </Field>
                  <Field icon={<Mail size={17} />} label="Email">
                    <Input name="email" type="email" autoComplete="email" required />
                  </Field>
                  <Field icon={<Eye size={17} />} label="Senha">
                    <Input name="password" type="password" autoComplete="new-password" required />
                  </Field>
                  {activeState.message ? <ErrorMessage message={activeState.message} /> : null}
                  <Button type="submit" disabled={registerPending}>
                    {registerPending ? "Criando..." : "Criar conta"} <ArrowRight size={16} />
                  </Button>
                </form>
              ) : mode === "recover" ? (
                <form action={recoverFormAction} className="grid gap-4">
                  <Field icon={<Mail size={17} />} label="Email">
                    <Input name="email" type="email" autoComplete="email" required />
                  </Field>
                  {activeState.message ? <InfoMessage message={activeState.message} /> : null}
                  <Button type="submit" disabled={recoverPending}>
                    {recoverPending ? "Gerando..." : "Gerar token"} <ArrowRight size={16} />
                  </Button>
                </form>
              ) : (
                <form action={resetFormAction} className="grid gap-4">
                  <Field icon={<LockKeyhole size={17} />} label="Token">
                    <Input name="token" required />
                  </Field>
                  <Field icon={<Eye size={17} />} label="Nova senha">
                    <Input name="password" type="password" autoComplete="new-password" required />
                  </Field>
                  {activeState.message ? <InfoMessage message={activeState.message} /> : null}
                  <Button type="submit" disabled={resetPending}>
                    {resetPending ? "Atualizando..." : "Atualizar senha"} <ArrowRight size={16} />
                  </Button>
                </form>
              )
            )}

            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <button
                type="button"
                className="text-sky-500 hover:text-sky-400"
                onClick={() => setMode("recover")}
              >
                Esqueci minha senha
              </button>
              <button
                type="button"
                className="text-sky-500 hover:text-sky-400"
                onClick={() => setMode("reset")}
              >
                Tenho um token
              </button>
            </div>
          </Card>
        </div>
      </section>
    </main>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        {icon} {label}
      </span>
      {children}
    </label>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
      {message}
    </p>
  );
}

function InfoMessage({ message }: { message: string }) {
  return (
    <p className="break-words rounded-lg border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm text-sky-500">
      {message}
    </p>
  );
}
