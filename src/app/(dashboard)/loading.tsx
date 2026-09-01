/**
 * Skeleton compartilhado por TODAS as rotas do dashboard (colocado no
 * nível do route group, não em cada página) — cobre o "branco" entre
 * clicar num link e os dados chegarem do Supabase, que hoje não tinha
 * nenhum feedback visual (nenhuma rota tinha loading.tsx). O layout
 * (sidebar/topbar) continua renderizado normalmente por fora — só a área
 * de conteúdo entra em Suspense, então a navegação nunca "pisca" a marca.
 *
 * Genérico de propósito (cards + tabela) pra caber razoavelmente bem em
 * qualquer tela — não tenta imitar o layout exato de cada rota.
 */
export default function DashboardLoading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Carregando…</span>

      <div aria-hidden="true" className="flex animate-pulse flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-7 w-48 rounded-md bg-muted" />
            <div className="h-4 w-64 rounded-md bg-muted" />
          </div>
          <div className="h-9 w-32 rounded-full bg-muted" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="mt-3 h-7 w-16 rounded bg-muted" />
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <div className="h-5 w-40 rounded bg-muted" />
          </div>
          <div className="divide-y divide-border">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-4 w-1/4 rounded bg-muted" />
                <div className="h-4 w-1/6 rounded bg-muted" />
                <div className="h-4 w-1/5 rounded bg-muted" />
                <div className="h-4 flex-1 rounded bg-muted" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
