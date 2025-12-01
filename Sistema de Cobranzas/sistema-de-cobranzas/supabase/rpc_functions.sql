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

-- Function 5: obtener_detalle_estrategia
-- Returns detalle_estrategia for a given strategy ID
CREATE OR REPLACE FUNCTION public.obtener_detalle_estrategia(p_id_estrategia int)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(row_to_json(d))
     FROM modulo_estrategias.detalle_estrategia d
     WHERE d.id_estrategia = p_id_estrategia),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.obtener_detalle_estrategia(int) TO anon, authenticated;

-- Function 6: obtener_plantillas_estrategia
-- Returns plantillas associated with a strategy
CREATE OR REPLACE FUNCTION public.obtener_plantillas_estrategia(p_id_estrategia int)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id_plantilla', ep.id_plantilla,
        'nombre', p.nombre,
        'canal', c.nombre,
        'descripcion', p.descripcion,
        'contenido', p.contenido
      )
    )
    FROM modulo_estrategias.estrategia_plantilla ep
    LEFT JOIN modulo_estrategias.plantilla p ON p.id_plantilla = ep.id_plantilla
    LEFT JOIN modulo_estrategias.canal_cobranza c ON c.id_canal = p.id_canal
    WHERE ep.id_estrategia = p_id_estrategia),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.obtener_plantillas_estrategia(int) TO anon, authenticated;

-- Function 7: obtener_incentivos_estrategia
-- Returns incentivos for a given strategy
CREATE OR REPLACE FUNCTION public.obtener_incentivos_estrategia(p_id_estrategia int)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(row_to_json(i))
     FROM modulo_estrategias.catalogo_incentivo i
     WHERE i.id_estrategia = p_id_estrategia),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.obtener_incentivos_estrategia(int) TO anon, authenticated;

-- Function 8: obtener_refinanciamientos_estrategia
-- Returns refinanciamientos for a given strategy
CREATE OR REPLACE FUNCTION public.obtener_refinanciamientos_estrategia(p_id_estrategia int)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(row_to_json(r))
     FROM modulo_estrategias.catalogo_refinanciamiento r
     WHERE r.id_estrategia = p_id_estrategia),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.obtener_refinanciamientos_estrategia(int) TO anon, authenticated;

-- Function 9: obtener_plantillas_filtradas
-- Returns plantillas of a cartera filtered by configured channels of the strategy
CREATE OR REPLACE FUNCTION public.obtener_plantillas_filtradas(p_id_cartera int, p_id_estrategia int)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
  WITH canales_cfg AS (
    SELECT DISTINCT d.id_canal
    FROM modulo_estrategias.detalle_estrategia d
    WHERE d.id_estrategia = p_id_estrategia
  )
  SELECT COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id_plantilla', pl.id_plantilla,
          'nombre', pl.nombre,
          'descripcion', pl.descripcion,
          'contenido', pl.contenido,
          'id_cartera', pl.id_cartera,
          'id_canal', pl.id_canal,
          'canal', c.nombre
        )
        ORDER BY pl.id_plantilla
      )
      FROM modulo_estrategias.plantilla pl
      INNER JOIN canales_cfg cfg ON cfg.id_canal = pl.id_canal
      LEFT JOIN modulo_estrategias.canal_cobranza c ON c.id_canal = pl.id_canal
      WHERE pl.id_cartera = p_id_cartera
    ),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.obtener_plantillas_filtradas(int, int) TO anon, authenticated;

-- Function 10: obtener_plantillas_seleccionadas
-- Returns the list of id_plantilla currently linked to a strategy
CREATE OR REPLACE FUNCTION public.obtener_plantillas_seleccionadas(p_id_estrategia int)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(ep.id_plantilla ORDER BY ep.id_plantilla)
      FROM modulo_estrategias.estrategia_plantilla ep
      WHERE ep.id_estrategia = p_id_estrategia
    ),
    '[]'::jsonb
  );
$$;

GRANT EXECUTE ON FUNCTION public.obtener_plantillas_seleccionadas(int) TO anon, authenticated;

-- Function 11: guardar_plantillas_estrategia
-- Bulk insert selected plantilla IDs for a strategy. Ignores duplicates.
CREATE OR REPLACE FUNCTION public.guardar_plantillas_estrategia(p_id_estrategia int, p_ids int[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, modulo_estrategias
AS $$
DECLARE
  inserted_count int := 0;
BEGIN
  IF p_ids IS NULL OR array_length(p_ids, 1) IS NULL THEN
    RETURN jsonb_build_object('success', true, 'count', 0);
  END IF;

  INSERT INTO modulo_estrategias.estrategia_plantilla (id_estrategia, id_plantilla)
  SELECT p_id_estrategia, UNNEST(p_ids)
  ON CONFLICT (id_estrategia, id_plantilla) DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'count', inserted_count);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.guardar_plantillas_estrategia(int, int[]) TO anon, authenticated;

-- ==============================================================================
-- End of RPC Functions
-- ==============================================================================
-- After running this script, you can call these functions from your app:
--   await supabase.rpc('lista_canales')
--   await supabase.rpc('lista_frecuencias')
--   await supabase.rpc('lista_turnos')
--   await supabase.rpc('guardar_config_canales', { rows_data: [...] })
--   await supabase.rpc('obtener_detalle_estrategia', { p_id_estrategia: 123 })
--   await supabase.rpc('obtener_plantillas_estrategia', { p_id_estrategia: 123 })
--   await supabase.rpc('obtener_incentivos_estrategia', { p_id_estrategia: 123 })
--   await supabase.rpc('obtener_refinanciamientos_estrategia', { p_id_estrategia: 123 })
-- ==============================================================================
