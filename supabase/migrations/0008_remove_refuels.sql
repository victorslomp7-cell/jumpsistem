-- Remove abastecimento por decisão do cliente — não faz parte da
-- necessidade real de uma empresa de cotas náuticas (o abastecimento é
-- responsabilidade de quem usa a cota, não da gestão de frota).
--
-- Os arquivos em si (anexos de NF de abastecimento) continuam existindo no
-- bucket "attachments" do Storage até serem removidos manualmente por lá
-- (Storage → attachments → pasta refuel/) — apagar do SQL Editor não
-- apaga arquivo de bucket.

delete from public.attachments where owner_type = 'refuel';
drop table if exists public.refuels;
drop type if exists public.payment_method;
