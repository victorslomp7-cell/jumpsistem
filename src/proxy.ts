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
     * Roda em toda rota exceto assets estáticos, imagens e o manifest/ícones
     * do PWA, para não bloquear carregamento de CSS/JS/ícones.
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons/|brand/).*)",
  ],
};
