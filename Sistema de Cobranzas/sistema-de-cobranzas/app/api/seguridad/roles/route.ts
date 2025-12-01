import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET() {
  try {
    const res = await query('SELECT * FROM seguridad.rol ORDER BY nombre');
    return NextResponse.json({ success: true, roles: res.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, descripcion } = body;
    if (!nombre) return NextResponse.json({ success: false, error: 'nombre requerido' }, { status: 400 });
    const res = await query('INSERT INTO seguridad.rol (nombre, descripcion) VALUES ($1,$2) RETURNING *', [nombre, descripcion]);
    return NextResponse.json({ success: true, rol: res.rows[0] }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
