import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/domain";

/**
 * Usuário autenticado + perfil (role admin/funcionario) para Server
 * Components. Retorna `null` se não autenticado — o `proxy.ts` já redireciona
 * para /login antes disso acontecer nas rotas do dashboard, mas cada tela
 * ainda deve tratar o caso (ex.: chamada direta a uma Server Action).
 */
export async function getCurrentProfile(): Promise<{ userId: string; email: string | null; profile: Profile | null } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { userId: user.id, email: user.email ?? null, profile: profile as Profile | null };
}

export async function requireAdmin() {
  const current = await getCurrentProfile();
  if (!current || current.profile?.role !== "admin") {
    throw new Error("Ação restrita a administradores.");
  }
  return current;
}
