"use client";

import "./globals.css";

/**
 * Fallback pra um erro no próprio root layout (raríssimo — nosso layout.tsx
 * só embrulha o ServiceWorkerRegistration + children, sem I/O). Precisa
 * definir <html>/<body> do zero: esse arquivo SUBSTITUI o layout raiz
 * inteiro quando ativo, então nada dele (fontes, providers) chega aqui —
 * ver node_modules/next/dist/docs/.../error.md ("global-error must include
 * html and body tags"). Cores diretas (não via next/font) porque as
 * variáveis de fonte do layout raiz também não chegam aqui.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="pt-BR" data-theme="jump-dark">
      <body className="flex min-h-screen items-center justify-center bg-background p-8 text-foreground antialiased">
        <div className="flex max-w-md flex-col items-center gap-3 rounded-2xl border border-border bg-card p-8 text-center shadow-xl">
          <h1 className="text-lg font-semibold">Algo deu errado</h1>
          <p className="text-sm text-muted-foreground">
            O Jump Frota encontrou um erro inesperado. Tente recarregar a página.
          </p>
          {error.digest && <p className="text-xs text-muted-foreground">Código: {error.digest}</p>}
          <button
            type="button"
            onClick={() => retry()}
            className="mt-2 inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Tentar de novo
          </button>
        </div>
      </body>
    </html>
  );
}
