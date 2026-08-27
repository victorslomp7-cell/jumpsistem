import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile } from "@/lib/auth/current-profile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRowActions } from "@/components/settings/user-row-actions";
import type { Profile } from "@/types/domain";

export default async function SettingsUsersPage() {
  const current = await getCurrentProfile();
  if (current?.profile?.role !== "admin") {
    redirect("/dashboard");
  }

  const { data } = await (await createClient())
    .from("profiles")
    .select("*")
    .order("full_name");
  const profiles = (data as Profile[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Usuários</h1>
        <p className="text-sm text-muted-foreground">
          Contas são criadas em Authentication → Users no painel do Supabase; aqui você define o
          papel (admin/funcionário) e ativa/desativa o acesso.
        </p>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Papel</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{profile.full_name}</td>
                <td className="px-4 py-3">
                  <Badge variant={profile.role === "admin" ? "primary" : "default"}>
                    {profile.role === "admin" ? "Admin" : "Funcionário"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={profile.active ? "success" : "destructive"}>
                    {profile.active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <UserRowActions profile={profile} isSelf={profile.id === current.userId} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
