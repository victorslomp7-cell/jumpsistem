import Image from "next/image";

/**
 * Tela de carregamento com a marca — pedida pelo cliente pra aparecer
 * sempre que o sistema estiver carregando alguma tela (não só um esqueleto
 * genérico). Usada pelos `loading.tsx` de cada área (dashboard, login,
 * raiz) — ver cada um pra como a área ao redor (altura/tema) é montada.
 *
 * O anel giratório é dourado (`--color-jump-gold`) sobre uma trilha
 * dourada bem fraca (`/20`) — as cores da marca, como pedido; a coroa fica
 * centralizada dentro do anel.
 */
export function LoadingScreen({ label = "Carregando…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4">
      <div className="relative flex size-36 items-center justify-center">
        <div className="absolute inset-0 rounded-full border-[6px] border-jump-gold/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-[6px] border-transparent border-t-jump-gold border-r-jump-gold" />
        <Image
          src="/brand/jump-crown.png"
          alt="Jump Embarcações"
          width={218}
          height={88}
          className="relative h-14 w-auto"
          priority
        />
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
