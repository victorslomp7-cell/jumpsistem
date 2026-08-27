-- Seed de demonstração — veículos fake para a Fase 1 já nascer com dado
-- visível. Usuários/perfis de teste devem ser criados via Supabase Auth
-- (não é possível inserir em auth.users diretamente aqui); depois de criar
-- um usuário admin pelo dashboard do Supabase, insira o perfil correspondente:
--
--   insert into public.profiles (id, full_name, role)
--   values ('<uuid do auth.users>', 'Nome do Admin', 'admin');

insert into public.vehicles (nickname, type, model, revision_interval_hours, revision_warning_hours, battery_check_frequency_days)
values
  ('GTI 001', 'jet_ski', 'Sea-Doo GTI 170', 50, 10, 1),
  ('GTX 002', 'jet_ski', 'Sea-Doo GTX 170', 50, 10, 1),
  ('Lancha 001', 'lancha', 'NHD 260', 100, 20, null);
