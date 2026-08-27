import { cn } from "@/lib/utils";

/**
 * Wordmark da Jump — usado no canto superior esquerdo tanto do login quanto
 * do dashboard (sidebar), como pediu o cliente, pra manter a marca sempre
 * visível no mesmo lugar.
 *
 * TODO(assim que o cliente reenviar a logo como anexo real, não colada no
 * chat): trocar o selo "J" abaixo por <Image src="/brand/jump-logo.png" />
 * com a logo de verdade (coroa dourada). Centralizado aqui pra só precisar
 * trocar em um lugar.
 */
export function BrandMark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-jump-navy-dark text-sm font-bold text-jump-gold">
        J
      </span>
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-wide">JUMP</span>
          <span className="text-[9px] font-medium tracking-[0.2em] text-muted-foreground">EMBARCAÇÕES</span>
        </div>
      )}
    </div>
  );
}
