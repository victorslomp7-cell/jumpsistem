-- Fase 7 (complemento) — dispara o push diretamente do banco via pg_net,
-- em vez de depender da UI de "Database Webhooks" do painel (que não
-- aparece em todo projeto/versão do Supabase). Funcionalmente é a mesma
-- coisa: uma chamada HTTP assíncrona disparada por um trigger no INSERT.
--
-- Troque a URL abaixo pelo domínio real do seu projeto na Vercel antes de
-- rodar (ex.: https://jumpsistem.vercel.app/api/push/notify).

create extension if not exists pg_net with schema extensions;

create function public.notify_push_on_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://jumpsistem.vercel.app/api/push/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', 'bb98e74ead247e519c7cd0afcf2a5cfd1e8cb4a6fa6bfc34'
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'alerts',
      'record', to_jsonb(new)
    )
  );
  return new;
end;
$$;

create trigger on_alert_insert_notify_push
  after insert on public.alerts
  for each row execute function public.notify_push_on_alert();
