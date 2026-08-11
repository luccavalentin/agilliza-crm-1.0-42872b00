-- Adiciona coluna de lock para evitar race condition na criação de oportunidades
ALTER TABLE public.simulacoes ADD COLUMN IF NOT EXISTS oportunidade_lock_em timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.simulacoes.oportunidade_lock_em IS 'Data/hora em que uma requisição assumiu a liderança para criar a oportunidade na HomeFin';

-- Grants para authenticated (usado pelas server functions via context.supabase)
GRANT UPDATE(oportunidade_lock_em) ON public.simulacoes TO authenticated;
GRANT SELECT(oportunidade_lock_em) ON public.simulacoes TO authenticated;
