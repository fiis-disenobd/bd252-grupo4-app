import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function POST(req: Request) {
  try {
    const { id_usuario, id_rol } = await req.json();
    if (!id_usuario || !id_rol) return NextResponse.json({ success: false, error: 'Faltan parametros' }, { status: 400 });
    await query('INSERT INTO seguridad.usuario_rol (id_usuario, id_rol) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id_usuario, id_rol]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
