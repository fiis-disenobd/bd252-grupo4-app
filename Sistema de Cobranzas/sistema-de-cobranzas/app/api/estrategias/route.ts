import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { codigo, nombre, descripcion, fecha_inicio, fecha_fin, id_cartera } = body;

    if (!codigo || !nombre || !fecha_inicio || !fecha_fin || !id_cartera) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const supabase = await createClient();

    const insertObj = {
      codigo: String(codigo).slice(0, 4),
      nombre,
      descripcion: descripcion ?? "",
      fecha_inicio,
      fecha_fin,
      id_cartera: Number(id_cartera),
    } as any;

    // Prefer RPC in `public` that performs the insert. If it fails, return a helpful error
    // explaining how to create a compatible RPC or grant schema access — trying a
    // direct insert into `modulo_estrategias.estrategia` may cause "schema cache" errors
    // when PostgREST can't see that schema.
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("insert_estrategia", {
        p_codigo: insertObj.codigo,
        p_nombre: insertObj.nombre,
        p_descripcion: insertObj.descripcion,
        p_fecha_inicio: insertObj.fecha_inicio,
        p_fecha_fin: insertObj.fecha_fin,
        p_id_cartera: insertObj.id_cartera,
      } as any) as any;

      if (rpcError) {
        console.error("RPC insert_estrategia error:", rpcError);
        return NextResponse.json({
          error: "RPC insert_estrategia falló: " + (rpcError.message ?? JSON.stringify(rpcError)),
          hint: "Crea una función pública que inserte en modulo_estrategias.estrategia y devuelva JSON, o agrega el esquema modulo_estrategias al search_path de la API."
        }, { status: 502 });
      }

      return NextResponse.json({ data: rpcData }, { status: 201 });
    } catch (e: any) {
      console.error("RPC insert_estrategia exception:", e);
      return NextResponse.json({
        error: "Llamada RPC falló: " + (e?.message ?? String(e)),
        hint: "Asegúrate de crear public.insert_estrategia que devuelva JSON o grants apropiados."
      }, { status: 502 });
    }
  } catch (e: any) {
    console.error("API estrategias POST error:", e);
    return NextResponse.json({ error: e?.message ?? String(e) }, { status: 500 });
  }
}
