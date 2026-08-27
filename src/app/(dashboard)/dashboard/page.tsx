import { Card, CardContent, CardHeader, CardTitle, CardValue } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/*
 * Dashboard geral — placeholder de Fase 0 para validar o tema "drivvo-light".
 * Os cards abaixo passam a puxar dados reais do Supabase a partir da Fase 2/3
 * (bateria, horas) e Fase 6 (custos agregados/gráficos).
 */
export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Visão geral da frota</h1>
        <p className="text-sm text-muted-foreground">
          Estrutura inicial do projeto — os dados abaixo serão conectados nas próximas fases.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Custo total (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue>R$ —</CardValue>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alertas abertos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <CardValue>—</CardValue>
            <Badge variant="warning">aguardando dados</Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Veículos bloqueados</CardTitle>
          </CardHeader>
          <CardContent>
            <CardValue>—</CardValue>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Frota</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cadastro de veículos chega na Fase 1 (Auth + Veículos).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
