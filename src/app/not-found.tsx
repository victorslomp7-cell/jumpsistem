import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BrandMark } from "@/components/brand/brand-mark";

/**
 * 404 com a identidade do sistema — renderiza dentro do layout raiz normal
 * (ao contrário de global-error.tsx), então herda fontes/estilos. Fica
 * fora dos grupos (auth)/(dashboard), então precisa do próprio
 * data-theme="jump-dark" pra não cair no tema claro (não usado em
 * nenhuma rota hoje) por padrão.
 */
export default function NotFound() {
  return (
    <div
      data-theme="jump-dark"
      className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground"
    >
      <BrandMark />
      <div>
        <h1 className="text-3xl font-semibold">Página não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
      </div>
      <Link href="/dashboard" className={buttonVariants({})}>
        Voltar ao início
      </Link>
    </div>
  );
}
