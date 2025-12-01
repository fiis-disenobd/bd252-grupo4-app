import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function GET() {
  try {
    const sql = `
      SELECT 
        a.id_auditoria,
        u.nombre_usuario,
        a.tabla_afectada,
        a.operacion,
        a.valor_antiguo,
        a.valor_nuevo,
        a.ip,
        a.fecha
      FROM seguridad.auditoria a
      LEFT JOIN seguridad.usuario u ON a.id_usuario = u.id_usuario
      ORDER BY a.fecha DESC
    `;
    const res = await query(sql);
    return NextResponse.json({ success: true, auditoria: res.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
