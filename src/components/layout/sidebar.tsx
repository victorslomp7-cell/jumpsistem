import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Geral" },
  { href: "/vehicles", label: "Veículos" },
  { href: "/refuels", label: "Abastecimento" },
  { href: "/maintenance", label: "Manutenção" },
  { href: "/alerts", label: "Alertas" },
  { href: "/reports", label: "Relatórios" },
  { href: "/settings/users", label: "Configurações" },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card px-4 py-6 md:flex">
      {/* TODO(Fase 8 / assim que o usuário reenviar o arquivo): trocar pela logo oficial */}
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="flex size-7 items-center justify-center rounded-md bg-jump-charcoal text-sm font-bold text-jump-gold">
          J
        </span>
        <span className="text-sm font-semibold tracking-wide">JUMP FROTA</span>
      </div>
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
