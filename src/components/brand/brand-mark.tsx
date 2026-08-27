import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Wordmark da Jump — usado no canto superior esquerdo tanto do login quanto
 * do dashboard (sidebar), como pediu o cliente, pra manter a marca sempre
 * visível no mesmo lugar.
 *
 * A coroa em `/brand/jump-crown.png` é a arte real enviada pelo cliente
 * (recortada da logo original, fundo transparente — funciona tanto sobre o
 * navy do tema escuro quanto sobre o claro do dashboard). O texto "JUMP" /
 * "EMBARCAÇÕES" continua sendo tipografia do próprio app (não faz parte do
 * PNG), pra herdar a cor de cada tema automaticamente e não ficar preso ao
 * nome "JUMP COTAS NÁUTICAS" que aparece em outra variante da arte.
 */
export function BrandMark({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/brand/jump-crown.png"
        alt="Jump Embarcações"
        width={102}
        height={40}
        className="h-8 w-auto shrink-0"
        priority
      />
      {!compact && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-bold tracking-wide">JUMP</span>
          <span className="text-[9px] font-medium tracking-[0.2em] text-muted-foreground">EMBARCAÇÕES</span>
        </div>
      )}
    </div>
  );
}
