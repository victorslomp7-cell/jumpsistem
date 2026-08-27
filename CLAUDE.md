# Jump Frota

Sistema de gestão de frota náutica (jet ski e lanchas) para a Jump Embarcações.

**Plano completo**: veja `/root/.claude/plans/dazzling-snuggling-ocean.md` nesta
sessão, ou releia o histórico da conversa que aprovou este plano — cobre
modelagem de dados completa, roadmap de 9 fases, e todas as decisões de
produto já validadas com o cliente (não reabrir sem pedir de novo).

## Stack

Next.js 16 (App Router, TypeScript) + Supabase (Postgres/Auth/Storage/Realtime)
+ Vercel + Tailwind CSS v4 + shadcn/ui-style components + Serwist (PWA, Fase 7)
+ Dexie/IndexedDB (offline outbox, Fase 7) + Recharts (Fase 6) + Vitest/Playwright.

**Importante — Next.js 16 tem breaking changes** vs. o que você conhece de
treino: leia `node_modules/next/dist/docs/` antes de assumir convenções.
Já confirmado nesta sessão: `middleware.ts` foi renomeado para `proxy.ts`
(export `proxy`, não `middleware`) — usado em `src/proxy.ts` para refresh de
sessão do Supabase (ver `src/lib/supabase/middleware.ts`).

**Importante — rede bloqueada para Supabase nesta sessão remota**: o egress
proxy do ambiente barra `*.supabase.co` (403 de política, não é bug — não
tentar contornar). Isso significa: 1) não dá pra rodar
`supabase db push`/`gen types`/testar curl direto daqui — migrations são
aplicadas colando o SQL no SQL Editor do painel do Supabase; 2) chamadas do
`@supabase/supabase-js` (via Node fetch) falham rápido e de forma
"graciosa" (`getUser()` retorna `user: null`, não lança exceção), então
`npm run dev` funciona para navegar sem sessão, mas login de verdade só
pode ser testado via Vercel (preview URL) ou na máquina do usuário. Por
isso `src/types/database.types.ts` é escrito à mão (espelhando as
migrations), não gerado por `supabase gen types`.

## Temas

Dois temas via atributo `data-theme` em `src/app/globals.css` (Tailwind v4,
tokens CSS, sem `tailwind.config.ts`):
- `jump-dark` (default do grupo de rotas `(auth)`) — identidade institucional
  da Jump, fundo carvão + dourado.
- tema claro (default global) — dashboard de gestão, estilo Drivvo, dourado
  como cor de destaque.

Paleta extraída visualmente da imagem colada pelo usuário no chat (coroa
dourada sobre fundo carvão, "JUMP EMBARCAÇÕES") — pode ser refinada na
Fase 8 se surgir um manual de marca com códigos de cor diferentes.

**Atenção**: o arquivo `JUMP_LOGO.pdf` enviado pelo usuário continha uma
logo *diferente* ("JUMP COTAS NÁUTICAS", crachá azul) — descartado a pedido
do usuário. O arquivo real da logo dourada ainda não foi recebido; até lá,
login e sidebar usam um wordmark textual (`JUMP` + `EMBARCAÇÕES`) como
placeholder em `src/app/(auth)/login/page.tsx` e
`src/components/layout/sidebar.tsx` (marcados com `TODO`). Ícones do PWA em
`public/icons/` também são placeholder (letra "J").

## Estrutura

- `src/app/(auth)/` — login (tema escuro).
- `src/app/(dashboard)/` — dashboard, veículos, abastecimento, manutenção,
  alertas, relatórios, configurações (tema claro). Rotas ainda não
  implementadas mostram `<ComingSoon />` indicando a fase responsável.
- `src/lib/battery/ingestion.ts` — abstração de ingestão de leitura de
  bateria (`BatteryReadingSource`). Manter a interface estável: é o ponto de
  extensão para uma futura integração com a Motorlog (sem API pública
  documentada hoje — pesquisado e confirmado).
- `src/lib/hours/revision.ts` — regras puras de cálculo de revisão por horas
  (testável sem I/O).
- `src/lib/auth/current-profile.ts` — `getCurrentProfile()`/`requireAdmin()`,
  usado por Server Components e Server Actions para checar role. RLS no
  banco é a garantia real; isso é só UX (esconder/redirecionar).
- `src/proxy.ts` + `src/lib/supabase/middleware.ts` — refresh de sessão e
  redirect (`/login` ↔ `/dashboard`) conforme autenticação.
- Veículos: CRUD completo em `src/app/(dashboard)/vehicles/` (list, new,
  `[id]`, `[id]/edit`, Server Actions em `actions.ts`), restrito a admin
  para criar/editar/excluir (funcionário só lê). Sub-abas
  `[id]/{battery,hours,refuels,maintenance}` são placeholders `<ComingSoon />`
  até suas respectivas fases.
- Bateria: `src/lib/battery/ingestion.ts` (`ManualBatteryReadingAdapter` grava
  via Supabase; `MotorlogApiAdapter` stub) + tela em
  `src/app/(dashboard)/vehicles/[id]/battery/` (gráfico de tendência Recharts
  + formulário). A regra de bloqueio <12V é o trigger `handle_battery_reading`
  no banco (0003) — o app só reflete o resultado, não decide.
- Alertas: `src/app/(dashboard)/alerts/` lê a tabela `alerts` (populada pelo
  trigger de bateria hoje; revisão entra na Fase 3) e permite
  reconhecer/resolver.
- Horas/revisão: `src/lib/hours/revision.ts` (regra pura, `evaluateRevision`)
  + tela em `src/app/(dashboard)/vehicles/[id]/hours/` (progresso até a
  próxima revisão, lançar leitura, registrar revisão concluída). A decisão
  de abrir/fechar alerta de revisão vive no banco
  (`evaluate_vehicle_revision`, 0004) — triggers reavaliam em tempo real ao
  lançar horas, registrar revisão, ou o admin editar o intervalo/aviso do
  veículo; o cron diário (Parte 2 de 0004, pg_cron) é só rede de segurança.
- Manutenção: `src/app/(dashboard)/maintenance/` (lista global timeline +
  novo) e `src/app/(dashboard)/vehicles/[id]/maintenance/` (aba do veículo)
  usam a mesma `maintenance_events` da Fase 3 — o formulário geral cobre
  todos os tipos (revisão/troca de peça/troca de bateria/outro), custo,
  orçamento, garantia e anexo; `type = 'revisao'` aciona a mesma reavaliação
  de contagem de horas da Fase 3 (o trigger no banco não distingue de onde
  veio o INSERT). Timeline colorida por tipo em
  `src/components/maintenance/event-type-badge.tsx`.
- Abastecimento: `src/app/(dashboard)/refuels/` (lista global + novo) e
  `src/app/(dashboard)/vehicles/[id]/refuels/` (aba do veículo), compartilhando
  `RefuelForm`/`RefuelList`. Anexo de NF via `src/lib/storage/attachments.ts`
  (bucket privado `attachments` + tabela genérica `attachments`, reaproveitada
  pela Fase 5) — visualização por link assinado em
  `src/app/api/attachments/[id]/route.ts`.
- `supabase/migrations/` — uma migration por fase (`0001_init.sql` = perfis
  + veículos; `0002_profile_provisioning.sql` = trigger que auto-cria perfil
  `funcionario` em `auth.users` novo; `0003_battery.sql` = leituras de
  bateria, alertas, e o trigger de bloqueio <12V; `0004_hours_revision.sql`
  = horas de motor, `maintenance_events`, e a lógica de alerta de revisão —
  tem uma Parte 2 opcional/pg_cron que deve ser colada e rodada
  separadamente, ver comentário no topo do arquivo; `0005_refuels.sql` =
  abastecimento, tabela genérica `attachments`, e o bucket de Storage).
  `supabase/seed.sql` — dados de demonstração (ainda não aplicado pelo
  usuário).
- Dashboards/relatórios: `src/lib/reports/aggregate.ts` (agregação pura em
  memória — dataset pequeno, sem view/materialização no banco por ora) +
  gráficos Recharts em `src/components/charts/`. `/reports` e
  `/reports/[vehicleId]` são **restritos a admin** (relatório financeiro
  agregado, conforme decisão de RLS do projeto); o card de custo do
  `/dashboard` também só aparece pra admin. Alertas (`VehicleAlertBadges`)
  aparecem direto no veículo (lista, ficha, tabela do dashboard), não só na
  Central de Alertas.
- Testes: `npm run test` (Vitest) cobre as regras puras críticas
  (`src/lib/battery/ingestion.test.ts`, `src/lib/hours/revision.test.ts`,
  `src/lib/reports/aggregate.test.ts`) — também rodado no CI.

## Convenções

- Idioma da interface e dos textos de commit: pt-BR.
- Regras de negócio críticas (bloqueio de bateria <12V, alerta de revisão)
  vivem no banco (trigger/function/cron via `pg_cron`), não só no app — ver
  o plano para o desenho exato.
- RLS sempre ativo: funcionário lança dados de campo, mas relatórios
  financeiros agregados e configurações ficam restritos a admin.
- Rodar `npm run lint` e `npm run build` antes de cada commit.

@AGENTS.md
