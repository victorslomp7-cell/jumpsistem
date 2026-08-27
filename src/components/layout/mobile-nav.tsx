import Link from "next/link";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Geral" },
  { href: "/vehicles", label: "Veículos" },
  { href: "/battery", label: "Baterias" },
  { href: "/maintenance/new", label: "Lançar" },
  { href: "/alerts", label: "Alertas" },
  { href: "/reports", label: "Mais" },
] as const;

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border bg-card md:hidden">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
