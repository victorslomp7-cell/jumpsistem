# Jump Frota

Sistema de gestão de frota náutica (jet ski e lanchas) da Jump Embarcações:
manutenção, controle de bateria, horas de motor, abastecimento e custos.

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres,
Auth, Storage, Realtime) · Vercel · PWA offline-first (Fase 7).

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # preencha com as credenciais do seu projeto Supabase
npm run dev
```

Abre em `http://localhost:3000`. Sem as credenciais do Supabase preenchidas,
o dashboard funciona com o layout/tema, mas as telas que dependem de dados
reais aparecem como "em construção" até suas respectivas fases.

## Como ver o app rodando sem instalar nada localmente

Este projeto é feito para ser hospedado na **Vercel**, com uma **Preview URL**
pública gerada a cada push — assim dá para abrir no navegador do celular de
verdade (importante para testar a instalação como PWA, que só funciona bem em
dispositivo real, não em emulação de desktop).

1. Crie uma conta gratuita em [vercel.com](https://vercel.com) (pode entrar
   com a mesma conta do GitHub).
2. "Add New… → Project" e importe o repositório `jumpsistem`.
3. Em "Environment Variables", adicione as mesmas chaves do `.env.example`
   (pegue os valores no dashboard do Supabase, em *Project Settings → API*).
4. Deploy. Todo push em qualquer branch passa a gerar uma URL de preview.

## Banco de dados (Supabase)

1. Crie um projeto gratuito em [supabase.com](https://supabase.com).
2. Instale a CLI (`npm install -g supabase` ou veja a
   [documentação oficial](https://supabase.com/docs/guides/cli)) e rode:
   ```bash
   supabase link --project-ref <seu-project-ref>
   supabase db push          # aplica supabase/migrations/*.sql
   supabase db execute -f supabase/seed.sql   # dados de demonstração
   ```
3. Crie um usuário (Authentication → Users → Add user) e depois insira o
   perfil correspondente rodando o `insert` comentado no topo de
   `supabase/seed.sql`.

## Roadmap

O projeto é construído em fases incrementais — veja `CLAUDE.md` para a
estrutura de pastas e convenções, e o plano completo (compartilhado durante
o planejamento inicial) para o desenho de dados e regras de negócio de cada
fase:

0. Setup do projeto — ✅
1. Autenticação + cadastro de veículos
2. Controle de bateria (bloqueio automático <12V)
3. Horas de motor e alertas de revisão
4. Abastecimento
5. Manutenção e histórico
6. Dashboards e relatórios
7. PWA offline-first + notificações push
8. Polish visual e QA
