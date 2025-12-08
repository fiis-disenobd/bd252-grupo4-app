-- ==============================================================================
-- RPC Functions for Módulo de Seguridad (esquema: seguridad)
-- ==============================================================================

SET search_path = public, seguridad;

-- 1) obtener_usuarios
CREATE OR REPLACE FUNCTION public.obtener_usuarios()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id_usuario', u.id_usuario,
        'nombres', u.nombres,
        'apellidos', u.apellidos,
        'telefono', u.telefono,
        'nombre_usuario', u.nombre_usuario,
        'email', u.email,
        'id_estado', u.id_estado,
        'estado_nombre', (SELECT nombre FROM seguridad.estado e WHERE e.id_estado = u.id_estado),
        'rol_nombre', (SELECT r.nombre FROM seguridad.usuario_rol ur
                       LEFT JOIN seguridad.rol r ON ur.id_rol = r.id_rol
                       WHERE ur.id_usuario = u.id_usuario LIMIT 1),
        'ultima_conexion', (SELECT MAX(fecha_inicio) FROM seguridad.sesion s
                             WHERE s.id_usuario = u.id_usuario)
      ) ORDER BY u.id_usuario
    )
    FROM seguridad.usuario u),
    '[]'::jsonb
  );
$$;
GRANT EXECUTE ON FUNCTION public.obtener_usuarios() TO anon, authenticated;

-- 2) crear_usuario
CREATE OR REPLACE FUNCTION public.crear_usuario(
  p_nombres text,
  p_apellidos text,
  p_telefono text,
  p_nombre_usuario text,
  p_email text,
  p_password_hash text,
  p_id_estado int DEFAULT 1
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
DECLARE
  v_id_usuario int;
  v_hash bytea;
BEGIN
  RAISE NOTICE 'Iniciando crear_usuario para email: %', p_email;
  
  -- Convert hex string to bytea if password provided
  IF p_password_hash IS NOT NULL THEN
    v_hash := decode(p_password_hash, 'hex');
    RAISE NOTICE 'Hash decodificado, longitud: %', length(v_hash);
  ELSE
    v_hash := NULL;
  END IF;

  RAISE NOTICE 'Insertando en seguridad.usuario...';
  
  INSERT INTO seguridad.usuario (
    nombres, apellidos, telefono, nombre_usuario, email, password_hash, id_estado
  ) VALUES (
    p_nombres, p_apellidos, p_telefono, p_nombre_usuario, p_email, v_hash, p_id_estado
  )
  RETURNING id_usuario INTO v_id_usuario;

  RAISE NOTICE 'Usuario creado exitosamente con ID: %', v_id_usuario;

  RETURN jsonb_build_object(
    'success', true,
    'id_usuario', v_id_usuario,
    'mensaje', 'Usuario creado exitosamente'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error en crear_usuario: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN jsonb_build_object('success', false, 'error', SQLERRM, 'sqlstate', SQLSTATE);
END;
$$;
GRANT EXECUTE ON FUNCTION public.crear_usuario(text, text, text, text, text, text, int) TO anon, authenticated;

-- 3) obtener_sesiones
CREATE OR REPLACE FUNCTION public.obtener_sesiones()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id_sesion', s.id_sesion,
        'id_usuario', s.id_usuario,
        'nombre_usuario', (SELECT nombre_usuario FROM seguridad.usuario u WHERE u.id_usuario = s.id_usuario),
        'email', (SELECT email FROM seguridad.usuario u WHERE u.id_usuario = s.id_usuario),
        'ip_address', s.ip,
        'user_agent', s.user_agent,
        'fecha_inicio', s.fecha_inicio,
        'fecha_fin', s.fecha_fin,
        'revocada', s.revocada
      ) ORDER BY s.fecha_inicio DESC
    )
    FROM seguridad.sesion s
    WHERE (s.fecha_fin IS NULL OR s.fecha_fin > NOW()) AND s.revocada = false),
    '[]'::jsonb
  );
$$;
GRANT EXECUTE ON FUNCTION public.obtener_sesiones() TO anon, authenticated;

-- 4) revocar_sesion
CREATE OR REPLACE FUNCTION public.revocar_sesion(p_id_sesion int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
BEGIN
  UPDATE seguridad.sesion
  SET revocada = true, fecha_fin = NOW()
  WHERE id_sesion = p_id_sesion;

  RETURN jsonb_build_object('success', true, 'mensaje', 'Sesión revocada');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.revocar_sesion(int) TO anon, authenticated;

-- 5) obtener_permisos
CREATE OR REPLACE FUNCTION public.obtener_permisos()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id_permiso', p.id_permiso,
        'nombre', p.nombre,
        'descripcion', p.descripcion,
        'id_accion', p.id_accion,
        'accion_nombre', (SELECT a.nombre FROM seguridad.accion a WHERE a.id_accion = p.id_accion),
        'id_modulo', p.id_modulo,
        'modulo_nombre', (SELECT m.nombre FROM seguridad.modulo m WHERE m.id_modulo = p.id_modulo)
      ) ORDER BY p.id_permiso
    )
    FROM seguridad.permiso p),
    '[]'::jsonb
  );
$$;
GRANT EXECUTE ON FUNCTION public.obtener_permisos() TO anon, authenticated;

-- 6) asignar_permiso_rol
CREATE OR REPLACE FUNCTION public.asignar_permiso_rol(p_id_rol int, p_id_permiso int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
BEGIN
  INSERT INTO seguridad.rol_permiso (id_rol, id_permiso)
  VALUES (p_id_rol, p_id_permiso)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'mensaje', 'Permiso asignado');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.asignar_permiso_rol(int, int) TO anon, authenticated;

-- 7) revocar_permiso_rol
CREATE OR REPLACE FUNCTION public.revocar_permiso_rol(p_id_rol int, p_id_permiso int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
BEGIN
  DELETE FROM seguridad.rol_permiso
  WHERE id_rol = p_id_rol AND id_permiso = p_id_permiso;

  RETURN jsonb_build_object('success', true, 'mensaje', 'Permiso revocado');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.revocar_permiso_rol(int, int) TO anon, authenticated;

-- 8) obtener_roles
CREATE OR REPLACE FUNCTION public.obtener_roles()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
  SELECT COALESCE(
    (SELECT jsonb_agg(
      jsonb_build_object(
        'id_rol', r.id_rol,
        'nombre', r.nombre,
        'descripcion', r.descripcion,
        'permisos', COALESCE(
          (SELECT jsonb_agg(
            jsonb_build_object(
              'id_rol', rp.id_rol,
              'id_permiso', rp.id_permiso,
              'nombre', p.nombre
            )
          )
          FROM seguridad.rol_permiso rp
          LEFT JOIN seguridad.permiso p ON rp.id_permiso = p.id_permiso
          WHERE rp.id_rol = r.id_rol),
          '[]'::jsonb
        ),
        'usuariosCount', (SELECT COUNT(*) FROM seguridad.usuario_rol ur WHERE ur.id_rol = r.id_rol)
      ) ORDER BY r.nombre
    )
    FROM seguridad.rol r),
    '[]'::jsonb
  );
$$;
GRANT EXECUTE ON FUNCTION public.obtener_roles() TO anon, authenticated;

-- 9) crear_rol
CREATE OR REPLACE FUNCTION public.crear_rol(p_nombre text, p_descripcion text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
DECLARE
  v_id_rol int;
BEGIN
  INSERT INTO seguridad.rol (nombre, descripcion)
  VALUES (p_nombre, p_descripcion)
  RETURNING id_rol INTO v_id_rol;

  RETURN jsonb_build_object(
    'success', true,
    'id_rol', v_id_rol,
    'mensaje', 'Rol creado exitosamente'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.crear_rol(text, text) TO anon, authenticated;

-- 10) obtener_auditoria
CREATE OR REPLACE FUNCTION public.obtener_auditoria()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
  SELECT COALESCE(
    (
      SELECT jsonb_agg(audit_row)
      FROM (
        SELECT jsonb_build_object(
          'id_auditoria', a.id_auditoria,
          'id_usuario', a.id_usuario,
          'usuario_nombre', (SELECT nombre_usuario FROM seguridad.usuario u WHERE u.id_usuario = a.id_usuario),
          'tabla_afectada', a.tabla_afectada,
          'operacion', a.operacion,
          'valor_antiguo', a.valor_antiguo,
          'valor_nuevo', a.valor_nuevo,
          'ip', a.ip,
          'fecha', a.fecha
        ) AS audit_row
        FROM seguridad.auditoria a
        ORDER BY a.fecha DESC
        LIMIT 200
      ) sub
    ),
    '[]'::jsonb
  );
$$;
GRANT EXECUTE ON FUNCTION public.obtener_auditoria() TO anon, authenticated;

-- 11) obtener_estadisticas
CREATE OR REPLACE FUNCTION public.obtener_estadisticas()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
DECLARE
  v_total_usuarios int;
  v_usuarios_activos int;
  v_usuarios_inactivos int;
  v_sesiones_activas int;
  v_total_roles int;
  v_total_permisos int;
BEGIN
  SELECT COUNT(*) INTO v_total_usuarios FROM seguridad.usuario;
  SELECT COUNT(*) INTO v_usuarios_activos FROM seguridad.usuario WHERE id_estado = 1;
  SELECT COUNT(*) INTO v_usuarios_inactivos FROM seguridad.usuario WHERE id_estado = 2;
  SELECT COUNT(*) INTO v_sesiones_activas FROM seguridad.sesion
    WHERE fecha_fin IS NULL AND revocada = false;
  SELECT COUNT(*) INTO v_total_roles FROM seguridad.rol;
  SELECT COUNT(*) INTO v_total_permisos FROM seguridad.permiso;

  RETURN jsonb_build_object(
    'totalUsuarios', v_total_usuarios,
    'usuariosActivos', v_usuarios_activos,
    'usuariosInactivos', v_usuarios_inactivos,
    'sesionesActivas', v_sesiones_activas,
    'totalRoles', v_total_roles,
    'totalPermisos', v_total_permisos
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.obtener_estadisticas() TO anon, authenticated;

-- 12) asignar_rol_usuario
CREATE OR REPLACE FUNCTION public.asignar_rol_usuario(
  p_id_usuario int,
  p_id_rol int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
BEGIN
  INSERT INTO seguridad.usuario_rol (id_usuario, id_rol)
  VALUES (p_id_usuario, p_id_rol)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'mensaje', 'Rol asignado');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.asignar_rol_usuario(int, int) TO anon, authenticated;

-- 13) revocar_rol_usuario
CREATE OR REPLACE FUNCTION public.revocar_rol_usuario(
  p_id_usuario int,
  p_id_rol int
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
BEGIN
  DELETE FROM seguridad.usuario_rol
  WHERE id_usuario = p_id_usuario AND id_rol = p_id_rol;

  RETURN jsonb_build_object('success', true, 'mensaje', 'Rol revocado');
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.revocar_rol_usuario(int, int) TO anon, authenticated;

-- 15) ejecutar_batch_desactivar
-- Primero eliminar todas las versiones antiguas
DROP FUNCTION IF EXISTS public.ejecutar_batch_desactivar(int, boolean) CASCADE;
DROP FUNCTION IF EXISTS public.ejecutar_batch_desactivar(int) CASCADE;

CREATE OR REPLACE FUNCTION public.ejecutar_batch_desactivar(
  p_dias_limite int DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
BEGIN
  CALL seguridad.sp_batch_desactivar_usuarios_inactivos(p_dias_limite);
  
  RETURN jsonb_build_object(
    'success', true,
    'mensaje', 'Proceso batch ejecutado exitosamente',
    'dias_limite', p_dias_limite
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
GRANT EXECUTE ON FUNCTION public.ejecutar_batch_desactivar(int) TO anon, authenticated;

-- 14) registrar_auditoria
CREATE OR REPLACE FUNCTION public.registrar_auditoria(
  p_id_usuario int,
  p_tabla text,
  p_operacion text,
  p_valor_antiguo jsonb DEFAULT NULL,
  p_valor_nuevo jsonb DEFAULT NULL,
  p_ip text DEFAULT NULL,
  p_metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, seguridad
AS $$
BEGIN
  INSERT INTO seguridad.auditoria(
    id_usuario,
    tabla_afectada,
    operacion,
    valor_antiguo,
    valor_nuevo,
    ip,
    metadata
  ) VALUES (
    p_id_usuario,
    p_tabla,
    p_operacion,
    p_valor_antiguo::text,
    p_valor_nuevo::text,
    p_ip,
    p_metadata
  );
END;
$$;
GRANT EXECUTE ON FUNCTION public.registrar_auditoria(int, text, text, jsonb, jsonb, text, jsonb) TO anon, authenticated;
