import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('obtener_sesiones');

    if (error) {
      console.error('❌ Error fetching sessions:', error);
      throw error;
    }

    const sesiones = typeof data === 'string' ? JSON.parse(data) : (data || []);

    return NextResponse.json({ success: true, sesiones });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id_sesion } = await req.json();
    if (!id_sesion) return NextResponse.json({ success: false, error: 'id_sesion requerido' }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('revocar_sesion', { p_id_sesion: id_sesion });
    
    if (error) {
      console.error('❌ Error updating session:', error);
      throw error;
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
