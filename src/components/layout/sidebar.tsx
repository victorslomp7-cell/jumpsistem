import Link from "next/link";
import { BrandMark } from "@/components/brand/brand-mark";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Geral" },
  { href: "/vehicles", label: "Veículos" },
  { href: "/maintenance", label: "Manutenção" },
  { href: "/alerts", label: "Alertas" },
  { href: "/reports", label: "Relatórios" },
  { href: "/settings/users", label: "Configurações" },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6 md:flex">
      <BrandMark className="mb-8 px-2" />
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
