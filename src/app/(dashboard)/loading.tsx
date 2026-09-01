import { LoadingScreen } from "@/components/brand/loading-screen";

/**
 * Aplica em TODAS as rotas do dashboard (colocado no nível do route group,
 * não em cada página) — cobre o intervalo entre clicar num link e os
 * dados chegarem do Supabase. O layout (sidebar/topbar) continua
 * renderizado normalmente por fora — só a área de conteúdo entra em
 * Suspense, então a navegação nunca "pisca" a marca.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <LoadingScreen />
    </div>
  );
}
