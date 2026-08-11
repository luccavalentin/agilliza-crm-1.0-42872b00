CREATE OR REPLACE FUNCTION public.eleger_lider_oportunidade(p_simulacao_id uuid, p_lock_timeout timestamptz)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id uuid;
BEGIN
  UPDATE public.simulacoes
     SET oportunidade_lock_em = now()
   WHERE id = p_simulacao_id
     AND homefin_id_oportunidade IS NULL
     AND (oportunidade_lock_em IS NULL OR oportunidade_lock_em < p_lock_timeout)
  RETURNING id INTO v_id;

  RETURN v_id IS NOT NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION public.eleger_lider_oportunidade(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.eleger_lider_oportunidade(uuid, timestamptz) TO service_role;
