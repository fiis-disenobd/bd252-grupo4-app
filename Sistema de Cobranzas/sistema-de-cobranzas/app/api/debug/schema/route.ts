import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createAdminClient();

    // Obtener todas las tablas en todos los esquemas
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_schema, table_name')
      .in('table_schema', ['seguridad', 'modulo_seguridad', 'public']);

    if (error) {
      console.error('Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Agrupar por schema
    const grouped = (data || []).reduce((acc: any, table: any) => {
      if (!acc[table.table_schema]) acc[table.table_schema] = [];
      acc[table.table_schema].push(table.table_name);
      return acc;
    }, {});

    return NextResponse.json({ schemas: grouped });
  } catch (e: any) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
