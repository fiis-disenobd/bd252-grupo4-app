-- Migración actualizada para el Módulo `seguridad` integrada con Supabase Auth
-- Incluye: esquema "seguridad", tablas (no destructivas), columna id_auth, mapeo por email,
-- procedure batch usando `seguridad.sesion` o `auth.sessions` (opcional). Ejecutar en SQL Editor.

-- 1) Crear esquema si no existe (no borrar datos existentes)
CREATE SCHEMA IF NOT EXISTS seguridad AUTHORIZATION CURRENT_USER;

-- 2) Tabla estado (no destructiva)
CREATE TABLE IF NOT EXISTS seguridad.estado (
    id_estado   SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(150)
);
INSERT INTO seguridad.estado (id_estado, nombre, descripcion)
VALUES (1, 'ACTIVO', 'Cuenta activa'), (2, 'INACTIVO', 'Cuenta inactiva')
ON CONFLICT (id_estado) DO NOTHING;

-- 3) Tabla usuario (si ya existe, la dejamos y adaptamos)
CREATE TABLE IF NOT EXISTS seguridad.usuario (
    id_usuario     SERIAL PRIMARY KEY,
    id_auth        UUID UNIQUE, -- vinculo opcional con auth.users.id
    nombres        VARCHAR(100) NOT NULL,
    apellidos      VARCHAR(100) NOT NULL,
    telefono       VARCHAR(20),
    nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
    email          VARCHAR(150) UNIQUE,
    password_hash  BYTEA, -- si usas Supabase Auth, puedes dejar nulo o eliminar esta columna
    id_estado      INTEGER NOT NULL REFERENCES seguridad.estado(id_estado) ON DELETE RESTRICT,
    creado_en      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por id_auth y email
CREATE INDEX IF NOT EXISTS idx_seguridad_usuario_id_auth ON seguridad.usuario(id_auth);
CREATE INDEX IF NOT EXISTS idx_seguridad_usuario_email ON seguridad.usuario(email);
CREATE INDEX IF NOT EXISTS idx_seguridad_usuario_nombreusuario ON seguridad.usuario(nombre_usuario);

-- 4) Otras tablas (creación no destructiva)
CREATE TABLE IF NOT EXISTS seguridad.rol (
    id_rol     SERIAL PRIMARY KEY,
    nombre     VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    habilitado BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS seguridad.modulo (
    id_modulo  SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS seguridad.accion (
    id_accion  SERIAL PRIMARY KEY,
    nombre     VARCHAR(50) NOT NULL,
    descripcion TEXT
);

CREATE TABLE IF NOT EXISTS seguridad.permiso (
    id_permiso SERIAL PRIMARY KEY,
    nombre     VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    id_accion  INTEGER NOT NULL REFERENCES seguridad.accion(id_accion) ON DELETE RESTRICT,
    id_modulo  INTEGER NOT NULL REFERENCES seguridad.modulo(id_modulo) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS seguridad.factor_autenticacion (
    id_factor  SERIAL PRIMARY KEY,
    tipo       VARCHAR(50) NOT NULL,
    descripcion TEXT,
    habilitado BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS seguridad.usuario_rol (
    id_usuario INTEGER NOT NULL REFERENCES seguridad.usuario(id_usuario) ON DELETE CASCADE,
    id_rol     INTEGER NOT NULL REFERENCES seguridad.rol(id_rol) ON DELETE CASCADE,
    asignado_en timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id_usuario, id_rol)
);

CREATE TABLE IF NOT EXISTS seguridad.rol_permiso (
    id_rol     INTEGER NOT NULL REFERENCES seguridad.rol(id_rol) ON DELETE CASCADE,
    id_permiso INTEGER NOT NULL REFERENCES seguridad.permiso(id_permiso) ON DELETE CASCADE,
    asignado_en timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (id_rol, id_permiso)
);

CREATE TABLE IF NOT EXISTS seguridad.usuario_factor (
    id_usuario INTEGER NOT NULL REFERENCES seguridad.usuario(id_usuario) ON DELETE CASCADE,
    id_factor  INTEGER NOT NULL REFERENCES seguridad.factor_autenticacion(id_factor) ON DELETE CASCADE,
    PRIMARY KEY (id_usuario, id_factor)
);

CREATE TABLE IF NOT EXISTS seguridad.metodo_recuperacion (
    id_metodo   SERIAL PRIMARY KEY,
    id_usuario  INTEGER NOT NULL REFERENCES seguridad.usuario(id_usuario) ON DELETE CASCADE,
    tipo        VARCHAR(50) NOT NULL,
    valor       VARCHAR(255) NOT NULL,
    verificado  BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS seguridad.token_reset (
    id_token         SERIAL PRIMARY KEY,
    id_usuario       INTEGER NOT NULL REFERENCES seguridad.usuario(id_usuario) ON DELETE CASCADE,
    token_hash       BYTEA NOT NULL,
    creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    usado            BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS seguridad.sesion (
    id_sesion    SERIAL PRIMARY KEY,
    id_usuario   INTEGER NOT NULL REFERENCES seguridad.usuario(id_usuario) ON DELETE CASCADE,
    fecha_inicio timestamptz NOT NULL DEFAULT now(),
    fecha_fin    timestamptz,
    revocada     BOOLEAN DEFAULT FALSE,
    ip           VARCHAR(45),
    user_agent   TEXT
);

CREATE TABLE IF NOT EXISTS seguridad.auditoria (
    id_auditoria  SERIAL PRIMARY KEY,
    id_usuario    INTEGER REFERENCES seguridad.usuario(id_usuario) ON DELETE SET NULL,
    tabla_afectada VARCHAR(100),
    operacion      VARCHAR(50),
    valor_antiguo  TEXT,
    valor_nuevo    TEXT,
    ip             VARCHAR(45),
    fecha          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata       JSONB
);

CREATE INDEX IF NOT EXISTS idx_seguridad_token_usuario ON seguridad.token_reset(id_usuario);
CREATE INDEX IF NOT EXISTS idx_seguridad_token_expira ON seguridad.token_reset(fecha_expiracion);
CREATE INDEX IF NOT EXISTS idx_seguridad_sesion_usuario ON seguridad.sesion(id_usuario);
CREATE INDEX IF NOT EXISTS idx_seguridad_metodo_usuario ON seguridad.metodo_recuperacion(id_usuario);

-- 5) Datos iniciales (roles y permisos de ejemplo)
INSERT INTO seguridad.rol (nombre, descripcion)
VALUES
  ('ADMIN', 'Administrador del sistema (todos los permisos)')
  ,('ANALISTA', 'Analista de cobranzas (operaciones limitadas)')
  ,('SUPERVISOR', 'Supervisor (reportes y supervisión)')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO seguridad.modulo (nombre, descripcion)
VALUES
  ('seguridad','Módulo de administración y acceso'),
  ('programacion','Módulo de programación de cobranzas'),
  ('strategies','Módulo de estrategias')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO seguridad.accion (nombre, descripcion)
VALUES
  ('crear','Crear recurso'),
  ('ver','Ver recurso'),
  ('editar','Editar recurso'),
  ('borrar','Borrar recurso')
ON CONFLICT (nombre) DO NOTHING;

-- Ejemplo de permisos (modulo+accion)
INSERT INTO seguridad.permiso (nombre, descripcion, id_accion, id_modulo)
SELECT concat(m.nombre, ':', a.nombre), 'Permiso ' || m.nombre || '/' || a.nombre, a.id_accion, m.id_modulo
FROM seguridad.modulo m CROSS JOIN seguridad.accion a
ON CONFLICT (nombre) DO NOTHING;

-- 6) Mapear cuentas existentes de auth.users hacia seguridad.usuario (por email)
-- Este bloque intenta asociar registros en seguridad.usuario con usuarios de Supabase Auth
-- Ejecuta esto solo si confías en los emails y las filas existentes.
-- Nota: revisa antes con SELECT para ver coincidencias.

-- Añadir columna id_auth si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'seguridad' AND table_name = 'usuario' AND column_name = 'id_auth'
    ) THEN
        ALTER TABLE seguridad.usuario ADD COLUMN id_auth UUID;
    END IF;
END$$;

-- Actualizar id_auth a partir de auth.users basado en email (verifica que auth.users.email existe)
-- Este UPDATE puede dejar NULLs si no hay coincidencia por email.
UPDATE seguridad.usuario u
SET id_auth = a.id
FROM auth.users a
WHERE u.email IS NOT NULL AND a.email IS NOT NULL AND lower(u.email) = lower(a.email) AND u.id_auth IS NULL;

-- 7) Recomendación respecto a password_hash
-- Si estás usando Supabase Auth, evita almacenar hashes de contraseña en tu esquema local.
-- Puedes limpiar o setear a NULL la columna password_hash si lo deseas:
-- ALTER TABLE seguridad.usuario ALTER COLUMN password_hash DROP NOT NULL; -- ya la definimos sin NOT NULL
-- UPDATE seguridad.usuario SET password_hash = NULL WHERE id_auth IS NOT NULL;

-- 8) PROCEDURE batch (usa la tabla seguridad.sesion como fuente por defecto)
CREATE OR REPLACE PROCEDURE seguridad.sp_batch_desactivar_usuarios_inactivos(
    IN p_dias_limite INTEGER DEFAULT 60,
    IN p_usar_auth_sessions BOOLEAN DEFAULT FALSE -- si true, se usa auth.sessions para determinar última actividad
)
LANGUAGE plpgsql
AS $$
DECLARE
    cur_usuarios_activos CURSOR FOR 
        SELECT 
            u.id_usuario,
            u.id_auth,
            u.nombre_usuario,
            u.creado_en,
            MAX(
              CASE
                WHEN p_usar_auth_sessions THEN (
                    -- usar auth.sessions.created_at si existe
                    (SELECT MAX(s.created_at) FROM auth.sessions s WHERE s.user_id = u.id_auth)
                )
                ELSE MAX(s2.fecha_inicio)
              END
            ) AS ultima_sesion_registrada
        FROM seguridad.usuario u
        LEFT JOIN seguridad.sesion s2 ON u.id_usuario = s2.id_usuario
        WHERE u.id_estado = 1
        GROUP BY u.id_usuario, u.id_auth, u.nombre_usuario, u.creado_en;

    v_id_usuario           INTEGER;
    v_id_auth              UUID;
    v_nombre_usuario       VARCHAR(150);
    v_creado_en            TIMESTAMP;
    v_ultima_sesion_cursor TIMESTAMP;
    v_contador_baja        INTEGER := 0;
    v_fecha_corte          TIMESTAMP;
BEGIN
    v_fecha_corte := NOW() - (p_dias_limite || ' days')::INTERVAL;

    RAISE NOTICE 'Iniciando proceso batch de seguridad...';
    RAISE NOTICE 'Fecha de corte: %', v_fecha_corte;

    OPEN cur_usuarios_activos;

    LOOP
        FETCH cur_usuarios_activos INTO v_id_usuario, v_id_auth, v_nombre_usuario, v_creado_en, v_ultima_sesion_cursor;
        EXIT WHEN NOT FOUND;

        IF (v_ultima_sesion_cursor IS NOT NULL AND v_ultima_sesion_cursor < v_fecha_corte) OR
           (v_ultima_sesion_cursor IS NULL AND v_creado_en < v_fecha_corte) THEN

            UPDATE seguridad.usuario
            SET id_estado = (SELECT id_estado FROM seguridad.estado WHERE nombre = 'INACTIVO' LIMIT 1),
                actualizado_en = NOW()
            WHERE id_usuario = v_id_usuario;

            INSERT INTO seguridad.auditoria (
                id_usuario, tabla_afectada, operacion, valor_antiguo, valor_nuevo, ip, fecha
            ) VALUES (
                v_id_usuario,
                'usuario',
                'BATCH_UPDATE',
                'id_estado: 1 (ACTIVO)',
                'id_estado: 2 (INACTIVO) - Por Inactividad',
                'SYSTEM',
                NOW()
            );

            v_contador_baja := v_contador_baja + 1;
        END IF;
    END LOOP;

    CLOSE cur_usuarios_activos;

    RAISE NOTICE 'Proceso finalizado. Usuarios desactivados: %', v_contador_baja;
END;
$$;

-- 9) Programación con pg_cron (ejecutar solo si tu plan lo permite)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;
-- SELECT cron.schedule('batch_suspension_inactividad','0 0 * * *', $$CALL seguridad.sp_batch_desactivar_usuarios_inactivos(60, true);$$);

-- 10) Verificación rápida: listar tablas en esquema seguridad
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'seguridad'
ORDER BY table_name;

-- FIN MIGRACIÓN
