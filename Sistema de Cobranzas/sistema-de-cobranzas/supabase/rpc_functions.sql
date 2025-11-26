-- ==============================================================================
-- RPC Functions for Módulo de Estrategias
-- ==============================================================================
-- Copy and paste this entire script into your Supabase SQL Editor and run it.
-- These functions bypass RLS and schema search issues by using SECURITY DEFINER.
-- ==============================================================================

-- Function 1: lista_canales
-- Returns all channels (canal_cobranza) as JSONB array
CREATE OR REPLACE FUNCTION public.lista_canales()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id_canal', c.id_canal,
        'nombre', c.nombre
      ) ORDER BY c.id_canal
    )
    FROM modulo_estrategias.canal_cobranza c),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.lista_canales() TO anon, authenticated;

-- Function 2: lista_frecuencias
-- Returns all frequency types (tipo_frecuencia_cobranza) as JSONB array
CREATE OR REPLACE FUNCTION public.lista_frecuencias()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id_tipo_frecuencia', f.id_tipo_frecuencia,
        'nombre', f.nombre
      ) ORDER BY f.id_tipo_frecuencia
    )
    FROM modulo_estrategias.tipo_frecuencia_cobranza f),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.lista_frecuencias() TO anon, authenticated;

-- Function 3: lista_turnos
-- Returns all shifts (turno) as JSONB array
CREATE OR REPLACE FUNCTION public.lista_turnos()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id_turno', t.id_turno,
        'nombre', t.nombre,
        'hora_inicio', t.hora_inicio,
        'hora_fin', t.hora_fin
      ) ORDER BY t.id_turno
    )
    FROM modulo_estrategias.turno t),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.lista_turnos() TO anon, authenticated;

-- Function 4: guardar_config_canales
-- Upserts detalle_estrategia rows in bulk
-- Expects a JSONB array of objects with keys: id_estrategia, id_canal, id_turno, valor_frecuencia, id_tipo_frecuencia
CREATE OR REPLACE FUNCTION public.guardar_config_canales(rows_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
DECLARE
  inserted_count int := 0;
  row_item jsonb;
BEGIN
  -- Iterate over each row in the input array
  FOR row_item IN SELECT * FROM jsonb_array_elements(rows_data)
  LOOP
    INSERT INTO modulo_estrategias.detalle_estrategia (
      id_estrategia,
      id_canal,
      id_turno,
      valor_frecuencia,
      id_tipo_frecuencia
    )
    VALUES (
      (row_item->>'id_estrategia')::int,
      (row_item->>'id_canal')::int,
      (row_item->>'id_turno')::int,
      (row_item->>'valor_frecuencia')::int,
      (row_item->>'id_tipo_frecuencia')::int
    )
    ON CONFLICT (id_estrategia, id_canal, id_turno)
    DO UPDATE SET
      valor_frecuencia = EXCLUDED.valor_frecuencia,
      id_tipo_frecuencia = EXCLUDED.id_tipo_frecuencia;
    
    inserted_count := inserted_count + 1;
  END LOOP;

  RETURN jsonb_build_object('count', inserted_count, 'success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.guardar_config_canales(jsonb) TO anon, authenticated;

-- ==============================================================================
-- End of RPC Functions
-- ==============================================================================
-- After running this script, you can call these functions from your app:
--   await supabase.rpc('lista_canales')
--   await supabase.rpc('lista_frecuencias')
--   await supabase.rpc('lista_turnos')
--   await supabase.rpc('guardar_config_canales', { rows_data: [...] })
-- ==============================================================================
