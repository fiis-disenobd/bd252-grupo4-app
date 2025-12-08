import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Faltan variables de entorno');
      return NextResponse.json(
        { success: false, error: 'Faltan variables de entorno' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔄 Iniciando asignación de rol administrador a todos los usuarios...\n');

    // 1. Obtener todos los usuarios de auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error al obtener usuarios de auth:', authError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener usuarios de auth' },
        { status: 500 }
      );
    }

    console.log(`📋 Se encontraron ${users.length} usuarios en auth\n`);

    // 2. Obtener TODOS los roles y buscar el administrador
    const { data: allRoles, error: rolesError } = await supabase
      .schema('seguridad')
      .from('rol')
      .select('id_rol, nombre');

    if (rolesError) {
      console.error('❌ Error al obtener roles:', rolesError);
      return NextResponse.json(
        { success: false, error: 'Error al obtener roles', details: rolesError.message },
        { status: 500 }
      );
    }

    // Buscar el rol administrador (case-insensitive)
    const adminRole = allRoles?.find(r => r.nombre?.toLowerCase() === 'administrador');
    
    if (!adminRole) {
      console.error('❌ Rol administrador no encontrado. Roles disponibles:', allRoles);
      return NextResponse.json(
        { success: false, error: 'Rol administrador no encontrado', rolesDisponibles: allRoles },
        { status: 500 }
      );
    }

    const adminRoleId = adminRole.id_rol;
    console.log(`✅ Rol administrador encontrado: ID ${adminRoleId}`);

    // 3. Para cada usuario de auth, crear un registro en seguridad.usuario si no existe
    // y asignarle el rol administrador
    let usuariosCreados = 0;
    let rolesAsignados = 0;
    let yaExistentes = 0;
    const procesados = [];

    for (const authUser of users) {
      try {
        // Verificar si el usuario ya existe en seguridad.usuario
        const { data: existingUser, error: checkError } = await supabase
          .schema('seguridad')
          .from('usuario')
          .select('id_usuario, email')
          .eq('email', authUser.email)
          .single();

        let usuarioId: number;

        if (checkError && checkError.code === 'PGRST116') {
          // Usuario no existe, crearlo
          const { data: newUser, error: createError } = await supabase
            .schema('seguridad')
            .from('usuario')
            .insert({
              email: authUser.email,
              nombres: authUser.user_metadata?.nombres || 'Usuario',
              apellidos: authUser.user_metadata?.apellidos || 'Sistema',
              nombre_usuario: authUser.email.split('@')[0],
              telefono: authUser.user_metadata?.telefono || null,
              id_estado: 1 // Activo
            })
            .select('id_usuario')
            .single();

          if (createError) {
            console.error(`⚠️  Error creando usuario ${authUser.email}:`, createError.message);
            continue;
          }

          usuarioId = newUser.id_usuario;
          usuariosCreados++;
          procesados.push(`✅ Usuario creado: ${authUser.email} (ID: ${usuarioId})`);
        } else if (checkError) {
          console.error(`⚠️  Error verificando usuario ${authUser.email}:`, checkError.message);
          continue;
        } else {
          usuarioId = existingUser.id_usuario;
          yaExistentes++;
          procesados.push(`ℹ️  Usuario ya existe: ${authUser.email} (ID: ${usuarioId})`);
        }

        // Verificar si ya tiene el rol administrador
        const { data: existingRole, error: roleCheckError } = await supabase
          .schema('seguridad')
          .from('usuario_rol')
          .select('id_usuario_rol')
          .eq('id_usuario', usuarioId)
          .eq('id_rol', adminRoleId)
          .single();

        if (roleCheckError && roleCheckError.code === 'PGRST116') {
          // No tiene el rol, asignarlo
          const { error: assignError } = await supabase
            .schema('seguridad')
            .from('usuario_rol')
            .insert({
              id_usuario: usuarioId,
              id_rol: adminRoleId
            });

          if (assignError) {
            console.error(`⚠️  Error asignando rol a ${authUser.email}:`, assignError.message);
          } else {
            rolesAsignados++;
            procesados.push(`  👑 Rol administrador asignado`);
          }
        } else if (!roleCheckError) {
          procesados.push(`  👑 Rol administrador ya asignado`);
        }
      } catch (err: any) {
        console.error(`❌ Error procesando usuario ${authUser.email}:`, err.message);
      }
    }

    const summary = {
      usuariosCreados,
      rolesAsignados,
      yaExistentes,
      totalProcesados: users.length,
      detalles: procesados
    };

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Usuarios creados: ${usuariosCreados}`);
    console.log(`👑 Roles administrador asignados: ${rolesAsignados}`);
    console.log(`ℹ️  Usuarios que ya existían: ${yaExistentes}`);
    console.log(`📋 Total usuarios procesados: ${users.length}`);
    console.log('='.repeat(60));

    return NextResponse.json({
      success: true,
      message: '🎉 ¡Completado! Todos los usuarios tienen rol administrador',
      summary
    });
  } catch (err: any) {
    console.error('❌ Error fatal:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}
