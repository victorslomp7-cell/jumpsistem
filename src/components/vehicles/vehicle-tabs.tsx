import Link from "next/link";
import { cn } from "@/lib/utils";

const TABS = [
  { segment: "", label: "Geral" },
  { segment: "battery", label: "Bateria" },
  { segment: "hours", label: "Horas" },
  { segment: "maintenance", label: "Manutenção" },
] as const;

export function VehicleTabs({ vehicleId, active }: { vehicleId: string; active: string }) {
  return (
    <nav className="flex gap-1 border-b border-border">
      {TABS.map((tab) => {
        const href = `/vehicles/${vehicleId}${tab.segment ? `/${tab.segment}` : ""}`;
        const isActive = active === tab.segment;
        return (
          <Link
            key={tab.segment}
            href={href}
            className={cn(
              "border-b-2 px-4 py-2 text-sm font-medium",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
