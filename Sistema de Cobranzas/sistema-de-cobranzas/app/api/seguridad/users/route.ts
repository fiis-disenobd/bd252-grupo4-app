import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';
import crypto from 'crypto';

export async function GET() {
  try {
    const sql = `
      SELECT 
        u.id_usuario,
        u.nombres,
        u.apellidos,
        u.email,
        u.nombre_usuario,
        r.nombre AS rol,
        e.nombre AS estado,
        u.creado_en
      FROM seguridad.usuario u
      LEFT JOIN seguridad.usuario_rol ur ON u.id_usuario = ur.id_usuario
      LEFT JOIN seguridad.rol r ON ur.id_rol = r.id_rol
      LEFT JOIN seguridad.estado e ON u.id_estado = e.id_estado
      ORDER BY u.creado_en DESC
    `;
    const res = await query(sql);
    return NextResponse.json({ success: true, users: res.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombres, apellidos, telefono, nombre_usuario, email, password } = body;
    if (!nombres || !apellidos || !nombre_usuario || !email) {
      return NextResponse.json({ success: false, error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Hash password server-side (sha256). If using Supabase Auth, prefer creating user via Supabase Auth instead.
    let password_hash: Buffer | null = null;
    if (password) {
      const hash = crypto.createHash('sha256').update(password).digest('hex');
      password_hash = Buffer.from(hash, 'hex');
    }

    const sql = `
      INSERT INTO seguridad.usuario (nombres, apellidos, telefono, nombre_usuario, email, password_hash, id_estado)
      VALUES ($1,$2,$3,$4,$5,$6,1)
      RETURNING *
    `;
    const params = [nombres, apellidos, telefono ?? null, nombre_usuario, email, password_hash];
    const res = await query(sql, params);
    return NextResponse.json({ success: true, user: res.rows[0] }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
