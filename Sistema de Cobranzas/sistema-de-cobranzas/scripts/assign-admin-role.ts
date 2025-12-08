import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan variables de entorno SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function assignAdminRoleToAllUsers() {
  try {
    console.log('🔄 Iniciando asignación de rol administrador a todos los usuarios...\n');

    // 1. Obtener todos los usuarios de auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Error al obtener usuarios de auth:', authError);
      process.exit(1);
    }

    console.log(`📋 Se encontraron ${users.length} usuarios en auth\n`);

    // 2. Obtener el ID del rol "administrador"
    const { data: adminRoleData, error: roleError } = await supabase
      .schema('seguridad')
      .from('rol')
      .select('id_rol')
      .eq('nombre', 'administrador')
      .single();

    if (roleError) {
      console.error('❌ Error al obtener rol administrador:', roleError);
      process.exit(1);
    }

    const adminRoleId = adminRoleData.id_rol;
    console.log(`✅ Rol administrador encontrado con ID: ${adminRoleId}\n`);

    // 3. Para cada usuario de auth, crear un registro en seguridad.usuario si no existe
    // y asignarle el rol administrador
    let usuariosCreados = 0;
    let rolesAsignados = 0;
    let yaExistentes = 0;

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
          console.log(`✅ Usuario creado: ${authUser.email} (ID: ${usuarioId})`);
        } else if (checkError) {
          console.error(`⚠️  Error verificando usuario ${authUser.email}:`, checkError.message);
          continue;
        } else {
          usuarioId = existingUser.id_usuario;
          yaExistentes++;
          console.log(`ℹ️  Usuario ya existe: ${authUser.email} (ID: ${usuarioId})`);
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
            console.log(`  👑 Rol administrador asignado`);
          }
        } else if (!roleCheckError) {
          console.log(`  👑 Rol administrador ya asignado`);
        }
      } catch (err: any) {
        console.error(`❌ Error procesando usuario ${authUser.email}:`, err.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Usuarios creados: ${usuariosCreados}`);
    console.log(`👑 Roles administrador asignados: ${rolesAsignados}`);
    console.log(`ℹ️  Usuarios que ya existían: ${yaExistentes}`);
    console.log(`📋 Total usuarios procesados: ${users.length}`);
    console.log('='.repeat(60));
    console.log('\n🎉 ¡Completado! Todos los usuarios tienen rol administrador');
  } catch (err: any) {
    console.error('❌ Error fatal:', err.message);
    process.exit(1);
  }
}

assignAdminRoleToAllUsers();
