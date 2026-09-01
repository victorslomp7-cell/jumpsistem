"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Error boundary da área de login — renderiza dentro de (auth)/layout.tsx,
 * então já herda o fundo em gradiente navy e a marca no topo.
 */
export default function AuthError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-2 text-lg font-semibold">Algo deu errado</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Não conseguimos carregar o login. Tente de novo em instantes.
        </p>
        {error.digest && <p className="mb-4 text-xs text-muted-foreground">Código: {error.digest}</p>}
        <Button onClick={() => retry()} className="w-full">
          Tentar de novo
        </Button>
      </div>
    </main>
  );
}
