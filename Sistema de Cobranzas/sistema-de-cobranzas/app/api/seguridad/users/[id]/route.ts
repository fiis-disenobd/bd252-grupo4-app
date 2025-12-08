import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const usuarioId = parseInt(id);
    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    const client = await createClient();

    const { data: usuarios, error: userError } = await client.rpc('obtener_usuarios');
    if (userError) throw userError;

    const usuarioList = Array.isArray(usuarios) ? usuarios : (usuarios || []);
    const usuario = usuarioList.find((u: any) => u.id_usuario === usuarioId);

    if (!usuario) {
      return NextResponse.json(
        { success: false, error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    const { data: rolesData, error: rolesError } = await client.rpc('obtener_roles');
    if (rolesError) throw rolesError;

    const roles = Array.isArray(rolesData) ? rolesData : (rolesData || []);

    return NextResponse.json({
      success: true,
      usuario,
      rolesDisponibles: roles
    });
  } catch (e: any) {
    console.error('Error fetching user:', e);
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const usuarioId = parseInt(id);
    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { idRol } = body;
    const rolId = typeof idRol === 'string' ? parseInt(idRol) : Number(idRol);

    if (!rolId || Number.isNaN(rolId)) {
      return NextResponse.json(
        { success: false, error: 'ID de rol requerido' },
        { status: 400 }
      );
    }

    const client = await createClient();

    const { data, error } = await client.rpc('asignar_rol_usuario', {
      p_id_usuario: usuarioId,
      p_id_rol: rolId
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: true, mensaje: 'El usuario ya tiene asignado este rol' });
      }
      return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mensaje: data?.mensaje || 'Rol asignado exitosamente'
    });
  } catch (e: any) {
    console.error('Error assigning role:', e);
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const usuarioId = parseInt(id);
    if (isNaN(usuarioId)) {
      return NextResponse.json(
        { success: false, error: 'ID de usuario inválido' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { idRol } = body;
    const rolId = typeof idRol === 'string' ? parseInt(idRol) : Number(idRol);

    if (!rolId || Number.isNaN(rolId)) {
      return NextResponse.json(
        { success: false, error: 'ID de rol requerido' },
        { status: 400 }
      );
    }

    const client = await createClient();

    const { data, error } = await client.rpc('revocar_rol_usuario', {
      p_id_usuario: usuarioId,
      p_id_rol: rolId
    });

    if (error) {
      return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      mensaje: data?.mensaje || 'Rol removido exitosamente'
    });
  } catch (e: any) {
    console.error('Error removing role:', e);
    return NextResponse.json(
      { success: false, error: String(e) },
      { status: 500 }
    );
  }
}
