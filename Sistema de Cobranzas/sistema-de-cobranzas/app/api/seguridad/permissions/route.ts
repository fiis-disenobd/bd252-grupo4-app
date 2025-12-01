import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET() {
  try {
    const sql = `
      SELECT p.id_permiso, p.nombre AS permiso, a.nombre AS accion, m.nombre AS modulo
      FROM seguridad.permiso p
      JOIN seguridad.accion a ON p.id_accion = a.id_accion
      JOIN seguridad.modulo m ON p.id_modulo = m.id_modulo
      ORDER BY m.nombre, a.nombre
    `;
    const res = await query(sql);
    return NextResponse.json({ success: true, permisos: res.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const { id_rol, id_permiso } = b;
    if (!id_rol || !id_permiso) return NextResponse.json({ success: false, error: 'Faltan parametros' }, { status: 400 });
    await query('INSERT INTO seguridad.rol_permiso (id_rol, id_permiso) VALUES ($1,$2) ON CONFLICT DO NOTHING', [id_rol, id_permiso]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const b = await req.json();
    const { id_rol, id_permiso } = b;
    if (!id_rol || !id_permiso) return NextResponse.json({ success: false, error: 'Faltan parametros' }, { status: 400 });
    await query('DELETE FROM seguridad.rol_permiso WHERE id_rol = $1 AND id_permiso = $2', [id_rol, id_permiso]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
