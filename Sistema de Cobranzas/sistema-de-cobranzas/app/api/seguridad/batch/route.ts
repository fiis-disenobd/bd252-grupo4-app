import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Llamar al RPC ejecutar_batch_desactivar con los parámetros correctos
    const { data, error } = await supabase
      .rpc('ejecutar_batch_desactivar', {
        p_dias_limite: 60
      });

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      mensaje: 'Batch ejecutado exitosamente',
      resultado: data
    });
  } catch (err: any) {
    console.error('Error ejecutando batch:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Error al ejecutar batch' },
      { status: 500 }
    );
  }
}
