import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16: `middleware.ts` foi renomeado para `proxy.ts` (export `proxy`,
// não `middleware`) — ver AGENTS.md e a nota em CLAUDE.md.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Roda em toda rota exceto assets estáticos, imagens, o
     * manifest/ícones/service worker do PWA (sw.js precisa ser servido
     * puro, senão o navegador registra o HTML do redirect pro /login como
     * se fosse o service worker) e as rotas /api/* — cada Route Handler já
     * faz sua própria checagem de auth e devolve JSON (401, não redirect);
     * isso é essencial pro webhook do Supabase em /api/push/notify, que
     * chega sem cookie de sessão nenhum e não pode ser redirecionado.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|brand/|api/).*)",
  ],
};
