import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";

/**
 * Cliente Supabase para uso em Server Components/Route Handlers.
 * A partir da Fase 1, `src/proxy.ts` (não `middleware.ts` — renomeado no
 * Next.js 16, ver AGENTS.md) usa uma variante deste client para refrescar
 * a sessão em cada request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component — ignorado porque o
            // proxy.ts (Fase 1) já cuida de refrescar a sessão a cada request.
          }
        },
      },
    }
  );
}
