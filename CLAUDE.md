# Jump Frota

Sistema de gestão de frota náutica (jet ski e lanchas) para a Jump Embarcações.

**Plano completo**: veja `/root/.claude/plans/dazzling-snuggling-ocean.md` nesta
sessão, ou releia o histórico da conversa que aprovou este plano — cobre
modelagem de dados completa, roadmap de 9 fases, e todas as decisões de
produto já validadas com o cliente (não reabrir sem pedir de novo).

## Stack

Next.js 16 (App Router, TypeScript) + Supabase (Postgres/Auth/Storage/Realtime)
+ Vercel + Tailwind CSS v4 + shadcn/ui-style components + service worker
escrito à mão (PWA, Fase 7 — não Serwist: a versão estável ainda depende do
@serwist/webpack-plugin e o Next 16 já usa Turbopack até no build de
produção, sem garantia de compatibilidade) + Dexie/IndexedDB (offline
outbox, Fase 7) + web-push (Fase 7) + Recharts (Fase 6) + Vitest/Playwright.

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
- `src/app/(dashboard)/` — dashboard, veículos, manutenção, alertas,
  relatórios, configurações (tema claro). Rotas ainda não implementadas
  mostram `<ComingSoon />` indicando a fase responsável.
- **Abastecimento foi removido** (decisão do cliente — não faz parte da
  necessidade de uma empresa de cotas náuticas): sem tabela `refuels`, sem
  telas, sem aba no veículo (migration `0008_remove_refuels.sql`). Se
  reaparecer em algum código velho/comentário antigo, é resquício — não
  reintroduzir sem pedido explícito.
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
  para criar/editar/remover (funcionário só lê). Sub-abas
  `[id]/{battery,hours,maintenance}`.
  **Remover veículo é sempre soft delete** (`deleted_at`, migration
  `0009_vehicle_soft_delete.sql`) — nunca um DELETE de verdade, porque
  `battery_readings`/`engine_hour_readings`/`maintenance_events`/`alerts`
  têm `on delete cascade` pro `vehicle_id`; apagar a linha de verdade
  apagaria o histórico de custo já gasto. `ArchiveVehicleDialog` exige
  digitar o apelido exato do veículo pra confirmar (revalidado no servidor
  em `archiveVehicle`, não só no client) — só admin, com
  `ReactivateVehicleButton` pra desfazer. Veículos removidos somem das
  listas ativas (`/vehicles`, `/dashboard`) mas continuam entrando nos
  relatórios agregados (o dinheiro já foi gasto).
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
- Anexos genéricos (NF/orçamento de manutenção) via
  `src/lib/storage/attachments.ts` (bucket privado `attachments` + tabela
  genérica `attachments`) — visualização por link assinado em
  `src/app/api/attachments/[id]/route.ts`.
- `supabase/migrations/` — uma migration por fase (`0001_init.sql` = perfis
  + veículos; `0002_profile_provisioning.sql` = trigger que auto-cria perfil
  `funcionario` em `auth.users` novo; `0003_battery.sql` = leituras de
  bateria, alertas, e o trigger de bloqueio <12V; `0004_hours_revision.sql`
  = horas de motor, `maintenance_events`, e a lógica de alerta de revisão —
  tem uma Parte 2 opcional/pg_cron que deve ser colada e rodada
  separadamente, ver comentário no topo do arquivo; `0005_refuels.sql` =
  abastecimento — **removido na 0008**, ver abaixo — e tabela genérica
  `attachments`/bucket de Storage, que continuam em uso; `0006_push_subscriptions.sql`;
  `0007_push_webhook_trigger.sql`; `0008_remove_refuels.sql` = dropa
  `refuels` e o enum `payment_method`; `0009_vehicle_soft_delete.sql` =
  `vehicles.deleted_at`).
  `supabase/seed.sql` — dados de demonstração (ainda não aplicado pelo
  usuário).
- Dashboards/relatórios: `src/lib/reports/aggregate.ts` (agregação pura em
  memória — dataset pequeno, sem view/materialização no banco por ora) +
  gráficos Recharts em `src/components/charts/`. `/reports` e
  `/reports/[vehicleId]` são **restritos a admin** (relatório financeiro
  agregado, conforme decisão de RLS do projeto); o card de custo do
  `/dashboard` também só aparece pra admin. Alertas (`VehicleAlertBadges`)
  aparecem direto no veículo (lista, ficha, tabela do dashboard), não só na
  Central de Alertas. O card "Manutenção por tipo de veículo" em `/reports`
  tem um seletor (`MaintenanceChartCard`, Client Component): "Por mês"
  (padrão, colunas empilhadas) ou "Progressão" (linha contínua acumulada,
  uma cor por tipo — jet ski dourado, lancha carvão — igual ao gráfico de
  tendência de bateria; ver `maintenanceProgressionByVehicleType` em
  `aggregate.ts`).
- Comparativo por modelo: `src/lib/reports/compare-models.ts` (puro,
  testado) agrupa veículos por `model` (não por tipo — inclui arquivados,
  já que o objetivo é sinalizar modelo problemático mesmo que já removido)
  e calcula qtd. de veículos, horas médias (última leitura de cada
  veículo), custo total/por veículo/por hora, % de leituras de bateria
  <12V, e intervalo médio de dias entre revisões (só conta veículo com
  ≥2 revisões). Tela em `/reports/comparativo` (admin-only) com gráfico de
  barras + tabela. Exportação em `.xlsx` via `/api/reports/comparativo/export`
  (ExcelJS, gerado sob demanda no servidor — 3 abas: snapshot comparativo,
  pivot mensal por modelo, pivot anual por modelo).
- PWA/offline (Fase 7): `public/sw.js` (service worker manual, registrado
  por `src/components/pwa/service-worker-registration.tsx` no layout raiz) —
  cache-first pra assets estáticos, stale-while-revalidate pra navegação,
  push/notificationclick pro Web Push. **Importante**: `src/proxy.ts` exclui
  `sw.js` e `api/` do matcher — sem isso, o navegador registraria o HTML do
  redirect pro `/login` como se fosse o service worker (bug real encontrado
  e corrigido nesta fase), e o webhook do Supabase em `/api/push/notify`
  seria redirecionado antes de rodar (ele chega sem cookie de sessão).
  Fila offline: `src/lib/offline/{db.ts,sync-manager.ts}` (Dexie) — os
  formulários de campo (bateria, horas) usam `src/hooks/use-offline-submit.ts`,
  que tenta o POST direto e cai pra fila local se estiver offline ou a rede
  falhar no meio do caminho; `Route Handlers` em
  `src/app/api/{battery-readings,engine-hour-readings}` são o único caminho
  de escrita pra esses dois (usado tanto no envio direto quanto pela fila).
  `SyncStatusBadge` na TopBar mostra offline/pendências.
  Web Push: migration `0006_push_subscriptions.sql` + `src/lib/push/`
  (assinatura no browser) + `/api/push/subscribe` (salva) + `/api/push/notify`
  (rota comum do Next, **não** Edge Function — mais simples de configurar:
  só um Database Webhook do Supabase na tabela `alerts`, evento INSERT,
  apontando pra essa rota com o header `x-webhook-secret`) +
  `src/lib/supabase/admin.ts` (service role, só usado ali, nunca no client).
  `0007_push_webhook_trigger.sql` é um caminho alternativo pro mesmo
  resultado via `pg_net` direto no banco (trigger chamando `net.http_post`)
  — usado porque a UI de "Database Webhooks" não apareceu no painel do
  usuário; equivalente funcional ao Database Webhook, só que 100% SQL.
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
