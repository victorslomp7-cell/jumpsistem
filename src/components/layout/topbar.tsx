import { signOut } from "@/app/(dashboard)/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/types/domain";

export function TopBar({ email, profile }: { email: string | null; profile: Profile | null }) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:px-8">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{profile?.full_name ?? email ?? "—"}</span>
        {profile?.role && (
          <Badge variant={profile.role === "admin" ? "primary" : "default"}>
            {profile.role === "admin" ? "Admin" : "Funcionário"}
          </Badge>
        )}
      </div>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          Sair
        </Button>
      </form>
    </header>
  );
}
