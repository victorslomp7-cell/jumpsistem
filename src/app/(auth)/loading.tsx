import { LoadingScreen } from "@/components/brand/loading-screen";

/**
 * Renderiza dentro de (auth)/layout.tsx, então já herda o gradiente navy
 * e a marca no topo. Hoje /login é estático (sem busca de dado), então
 * isso praticamente não aparece na prática — existe pra cobrir qualquer
 * rota futura em (auth) que passe a buscar dado.
 */
export default function AuthLoading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <LoadingScreen />
    </main>
  );
}
