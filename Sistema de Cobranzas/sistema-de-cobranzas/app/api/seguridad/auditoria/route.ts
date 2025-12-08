import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('obtener_auditoria');

    if (error) throw error;

    const auditoria = typeof data === 'string' ? JSON.parse(data) : (data || []);

    return NextResponse.json({ success: true, auditoria });
  } catch (err: any) {
    console.error('GET auditoria error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al obtener auditoría' },
      { status: 500 }
    );
  }
}
