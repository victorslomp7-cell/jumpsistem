import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 px-6 py-16">
      {/*
        TODO(Fase 8 / assim que o usuário reenviar o arquivo): substituir por
        <Image src="/brand/jump-logo.png" .../> com a logo oficial (coroa
        dourada, "JUMP EMBARCAÇÕES") — o PDF recebido continha uma logo
        diferente ("JUMP COTAS NÁUTICAS", crachá azul) e foi descartado.
      */}
      <div className="flex flex-col items-center gap-1 drop-shadow-[0_0_24px_rgba(217,164,65,0.25)]">
        <span className="text-4xl font-bold tracking-wide text-primary">JUMP</span>
        <span className="text-xs font-medium tracking-[0.3em] text-muted-foreground">
          EMBARCAÇÕES
        </span>
      </div>

      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <h1 className="mb-1 text-xl font-semibold">Jump Frota</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Gestão de manutenção, bateria e custos da frota.
        </p>

        <LoginForm />
      </div>

      <p className="text-xs text-muted-foreground">
        Acesso restrito à equipe Jump Embarcações
      </p>
    </main>
  );
}
