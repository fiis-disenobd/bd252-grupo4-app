import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Obtener usuario autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, user: null, message: 'No autenticado' },
        { status: 401 }
      );
    }

    // Obtener información del usuario en la tabla seguridad.usuario
    const { data: usuarioData, error: queryError } = await supabase
      .schema('seguridad')
      .from('usuario')
      .select(`
        id_usuario,
        nombres,
        apellidos,
        email,
        nombre_usuario,
        usuario_rol:usuario_rol(
          rol:rol(nombre)
        )
      `)
      .eq('email', user.email)
      .single();

    if (queryError && queryError.code !== 'PGRST116') throw queryError;

    const rol = usuarioData?.usuario_rol?.[0]?.rol?.nombre || null;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        id_usuario: usuarioData?.id_usuario,
        nombres: usuarioData?.nombres,
        apellidos: usuarioData?.apellidos,
        nombre_usuario: usuarioData?.nombre_usuario,
        rol: rol,
        isAdmin: rol === 'administrador'
      }
    });
  } catch (err: any) {
    console.error('Error en /api/auth/me:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}
