import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Intenta una query simple
    const { data, error } = await supabase
      .schema('seguridad')
      .from('usuario')
      .select('count', { count: 'exact', head: true });

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa',
      count: data
    });
  } catch (e: any) {
    console.error('Test connection error:', e);
    return NextResponse.json({
      success: false,
      error: e.message || String(e)
    }, { status: 500 });
  }
}
