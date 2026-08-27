"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { Profile, ProfileRole } from "@/types/domain";
import { setProfileActive, setProfileRole } from "@/app/(dashboard)/settings/users/actions";

export function UserRowActions({ profile, isSelf }: { profile: Profile; isSelf: boolean }) {
  const [isPending, startTransition] = useTransition();

  const toggleRole = () => {
    const nextRole: ProfileRole = profile.role === "admin" ? "funcionario" : "admin";
    startTransition(() => setProfileRole(profile.id, nextRole));
  };

  const toggleActive = () => {
    startTransition(() => setProfileActive(profile.id, !profile.active));
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" disabled={isPending || isSelf} onClick={toggleRole}>
        {profile.role === "admin" ? "Tornar funcionário" : "Tornar admin"}
      </Button>
      <Button variant="outline" size="sm" disabled={isPending || isSelf} onClick={toggleActive}>
        {profile.active ? "Desativar" : "Reativar"}
      </Button>
    </div>
  );
}
