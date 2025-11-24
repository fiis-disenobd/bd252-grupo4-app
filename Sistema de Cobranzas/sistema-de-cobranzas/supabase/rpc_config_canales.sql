-- RPC function to return canales, tipos de frecuencia y turnos in one JSON payload
-- Apply with: supabase db push (ensure file placed in migrations folder if using CLI conventions)
-- Adjust table/column names if they differ from those used in the app code.

CREATE OR REPLACE FUNCTION public.rpc_config_canales()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
  SELECT jsonb_build_object(
    'canales', COALESCE(
      (SELECT jsonb_agg(row_to_json(c) ORDER BY c.id_canal)
         FROM modulo_estrategias.canal_cobranza c), '[]'::jsonb),
    'frecuencias', COALESCE(
      (SELECT jsonb_agg(row_to_json(f) ORDER BY f.id_tipo_frecuencia)
         FROM modulo_estrategias.tipo_frecuencia_cobranza f), '[]'::jsonb),
    'turnos', COALESCE(
      (SELECT jsonb_agg(row_to_json(t) ORDER BY t.id_turno)
         FROM modulo_estrategias.turno t), '[]'::jsonb)
  );
$$;

-- Optional: grant execute explicitly (Supabase usually grants to authenticated/anon by default)
GRANT EXECUTE ON FUNCTION public.rpc_config_canales() TO anon, authenticated;
