import { LoadingScreen } from "@/components/brand/loading-screen";

/**
 * Fallback do segmento raiz — fora dos grupos (auth)/(dashboard), então
 * precisa do próprio data-theme="jump-dark" (mesmo motivo do
 * not-found.tsx). Na prática raramente aparece (`/` só redireciona, sem
 * busca de dado), mas cobre qualquer rota raiz futura.
 */
export default function RootLoading() {
  return (
    <div data-theme="jump-dark" className="flex min-h-screen items-center justify-center bg-background">
      <LoadingScreen />
    </div>
  );
}
