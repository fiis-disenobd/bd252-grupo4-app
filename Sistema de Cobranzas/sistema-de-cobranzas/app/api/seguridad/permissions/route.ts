import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('obtener_permisos');

    if (error) throw error;

    const permisos = typeof data === 'string' ? JSON.parse(data) : (data || []);

    return NextResponse.json({ success: true, permisos });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id_rol, id_permiso } = await req.json();
    if (!id_rol || !id_permiso) return NextResponse.json({ success: false, error: 'Faltan parametros' }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('asignar_permiso_rol', {
      p_id_rol: id_rol,
      p_id_permiso: id_permiso
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id_rol, id_permiso } = await req.json();
    if (!id_rol || !id_permiso) return NextResponse.json({ success: false, error: 'Faltan parametros' }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('revocar_permiso_rol', {
      p_id_rol: id_rol,
      p_id_permiso: id_permiso
    });

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
