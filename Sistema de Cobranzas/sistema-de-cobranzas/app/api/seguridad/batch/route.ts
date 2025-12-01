import { NextResponse } from 'next/server';
import { query } from '@/lib/postgres';

export async function POST(req: Request) {
  try {
    const { dias } = await req.json().catch(() => ({ dias: 60 }));
    // Call the procedure
    await query('CALL seguridad.sp_batch_desactivar_usuarios_inactivos($1,false)', [dias ?? 60]);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
