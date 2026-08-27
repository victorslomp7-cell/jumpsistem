-- Fase 4 — abastecimento (compra em posto externo) + anexos genéricos
-- (usado aqui para NF de abastecimento; a Fase 5 reaproveita a mesma
-- tabela `attachments` para orçamento/NF/garantia de manutenção).

create type public.payment_method as enum ('dinheiro', 'cartao', 'pix', 'boleto', 'outro');

create table public.refuels (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles (id) on delete cascade,
  refuel_date date not null default current_date,
  engine_hours numeric(10,2),
  fuel_type text not null default 'Gasolina comum',
  liters numeric(10,2) not null,
  price_per_liter numeric(10,4),
  total_value numeric(12,2) not null,
  gas_station text,
  full_tank boolean not null default true,
  payment_method public.payment_method,
  driver_name text,
  created_by uuid references public.profiles (id),
  notes text,
  created_at timestamptz not null default now()
);

create index refuels_vehicle_date_idx on public.refuels (vehicle_id, refuel_date desc);

create type public.attachment_owner_type as enum ('refuel', 'maintenance_event', 'vehicle');

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  owner_type public.attachment_owner_type not null,
  owner_id uuid not null,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index attachments_owner_idx on public.attachments (owner_type, owner_id);

alter table public.refuels enable row level security;
alter table public.attachments enable row level security;

create policy "refuels: qualquer usuário autenticado lê"
  on public.refuels for select
  using (auth.uid() is not null);

create policy "refuels: usuário autenticado lança em seu nome"
  on public.refuels for insert
  with check (auth.uid() is not null and created_by = auth.uid());

create policy "refuels: só admin edita"
  on public.refuels for update
  using (public.current_profile_role() = 'admin')
  with check (public.current_profile_role() = 'admin');

create policy "refuels: só admin remove"
  on public.refuels for delete
  using (public.current_profile_role() = 'admin');

create policy "attachments: qualquer usuário autenticado lê"
  on public.attachments for select
  using (auth.uid() is not null);

create policy "attachments: usuário autenticado envia em seu nome"
  on public.attachments for insert
  with check (auth.uid() is not null and uploaded_by = auth.uid());

create policy "attachments: só admin remove"
  on public.attachments for delete
  using (public.current_profile_role() = 'admin');

-- Bucket de Storage para os arquivos em si (privado — acesso só via signed
-- URL gerada pelo app, ver src/app/api/attachments/[id]/route.ts).
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "attachments bucket: leitura autenticada"
  on storage.objects for select
  using (bucket_id = 'attachments' and auth.uid() is not null);

create policy "attachments bucket: upload autenticado"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.uid() is not null);

create policy "attachments bucket: exclusão restrita a admin"
  on storage.objects for delete
  using (bucket_id = 'attachments' and public.current_profile_role() = 'admin');
