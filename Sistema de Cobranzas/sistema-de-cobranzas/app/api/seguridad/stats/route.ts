import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: stats, error } = await supabase.rpc('obtener_estadisticas');

    if (error) throw error;

    return NextResponse.json({
      success: true,
      stats: stats || {}
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 });
  }
}
