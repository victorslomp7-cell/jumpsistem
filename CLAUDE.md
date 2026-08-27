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
(export `proxy`, não `middleware`) — use isso ao implementar o refresh de
sessão do Supabase na Fase 1.

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
- `supabase/migrations/` — uma migration por fase (`0001_init.sql` = perfis
  + veículos). `supabase/seed.sql` — dados de demonstração.

## Convenções

- Idioma da interface e dos textos de commit: pt-BR.
- Regras de negócio críticas (bloqueio de bateria <12V, alerta de revisão)
  vivem no banco (trigger/function/cron via `pg_cron`), não só no app — ver
  o plano para o desenho exato.
- RLS sempre ativo: funcionário lança dados de campo, mas relatórios
  financeiros agregados e configurações ficam restritos a admin.
- Rodar `npm run lint` e `npm run build` antes de cada commit.

@AGENTS.md
