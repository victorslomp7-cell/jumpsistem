import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Cliente com a service role key — bypassa RLS. Só pra uso em contextos de
 * servidor totalmente confiáveis e sem sessão de usuário (ex.: o webhook do
 * Supabase que chama /api/push/notify, que não carrega cookie nenhum).
 * NUNCA importar isto de um Client Component nem devolver a chave ao browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
