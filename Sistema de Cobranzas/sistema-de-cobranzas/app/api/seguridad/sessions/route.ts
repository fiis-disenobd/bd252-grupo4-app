import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET() {
  try {
    const sql = `
      SELECT 
        s.id_sesion,
        u.nombre_usuario,
        u.email,
        s.fecha_inicio,
        s.ip,
        s.user_agent
      FROM seguridad.sesion s
      JOIN seguridad.usuario u ON s.id_usuario = u.id_usuario
      WHERE s.fecha_fin IS NULL AND s.revocada = FALSE
      ORDER BY s.fecha_inicio DESC
    `;
    const res = await query(sql);
    return NextResponse.json({ success: true, sessions: res.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { id_usuario } = await req.json();
    if (!id_usuario) return NextResponse.json({ success: false, error: 'id_usuario requerido' }, { status: 400 });
    const res = await query('INSERT INTO seguridad.sesion (id_usuario, ip, user_agent) VALUES ($1,$2,$3) RETURNING *', [id_usuario, '127.0.0.1', 'cli-test']);
    return NextResponse.json({ success: true, session: res.rows[0] }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id_sesion } = await req.json();
    if (!id_sesion) return NextResponse.json({ success: false, error: 'id_sesion requerido' }, { status: 400 });
    await query('UPDATE seguridad.sesion SET revocada = TRUE, fecha_fin = NOW() WHERE id_sesion = $1', [id_sesion]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
