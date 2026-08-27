"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { signIn } from "./actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signIn, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        E-mail
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="voce@jump.com.br"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        Senha
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </label>

      {state?.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" disabled={isPending} className="mt-2 w-full">
        {isPending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
