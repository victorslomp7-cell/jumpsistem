-- Fase 1 — provisionamento automático de perfil.
--
-- Hoje o admin cria contas manualmente pelo painel do Supabase
-- (Authentication → Users → Add user). Sem este trigger, cada novo usuário
-- ficaria sem linha em public.profiles até alguém rodar um INSERT manual.
-- Com o trigger, todo novo usuário já nasce com um perfil 'funcionario';
-- promover para 'admin' continua sendo uma ação manual (por segurança, não
-- dá pra confiar em metadata enviada pelo próprio cliente para conceder
-- admin automaticamente).

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'funcionario'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
