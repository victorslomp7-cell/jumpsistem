"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Error boundary do dashboard inteiro — sem isso, qualquer exceção não
 * tratada (ex.: falha inesperada numa consulta ao Supabase) caía na tela
 * de erro genérica do Next, fora da identidade visual do sistema.
 *
 * Next 16: o segundo parâmetro do error boundary agora é `retry` (tenta
 * de novo buscar e renderizar o segmento), não mais `reset` — ver
 * node_modules/next/dist/docs/.../error.md.
 */
export default function DashboardError({
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
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="flex max-w-md flex-col items-center gap-3 p-8 text-center">
        <h2 className="text-lg font-semibold">Algo deu errado</h2>
        <p className="text-sm text-muted-foreground">
          Não conseguimos carregar esta tela. Tente de novo — se continuar acontecendo, avise o suporte.
        </p>
        {error.digest && <p className="text-xs text-muted-foreground">Código: {error.digest}</p>}
        <Button onClick={() => retry()} className="mt-2">
          Tentar de novo
        </Button>
      </Card>
    </div>
  );
}
