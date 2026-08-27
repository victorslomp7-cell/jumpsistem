import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-10">
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
