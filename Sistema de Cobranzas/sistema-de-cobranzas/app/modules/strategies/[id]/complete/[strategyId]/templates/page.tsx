import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TemplatesConfig from "./TemplatesConfig";

export default async function TemplatesPage({ params }: { params: any }) {
  let resolved = params;
  if (resolved && typeof (resolved as any).then === "function") {
    try { resolved = await resolved; } catch { resolved = params; }
  }

  const carteraId = resolved?.id ?? resolved?.params?.id ?? null;
  const strategyId = resolved?.strategyId ?? resolved?.params?.strategyId ?? null;

  const supabase = await createClient();
  let plantillas: any[] = [];
  let seleccionadas: number[] = [];
  let fetchError: string | null = null;
  try {
    // Obtener todas las plantillas de la cartera (filtradas por id_cartera) y su canal.
    const { data: pData, error: pErr } = await supabase
      .from("modulo_estrategias.plantilla")
      .select("id_plantilla,nombre,descripcion,contenido,id_cartera,id_canal")
      .eq("id_cartera", Number(carteraId))
      .order("id_plantilla", { ascending: true });
    if (!pErr && Array.isArray(pData)) plantillas = pData;

    // Obtener las plantillas ya asociadas a la estrategia
    if (strategyId) {
      const { data: relData, error: relErr } = await supabase
        .from("modulo_estrategias.estrategia_plantilla")
        .select("id_plantilla")
        .eq("id_estrategia", Number(strategyId));
      if (!relErr && Array.isArray(relData)) seleccionadas = relData.map(r => r.id_plantilla);
      if (relErr) fetchError = relErr.message;
    }
    if (pErr) fetchError = pErr.message;
  } catch (e: any) {
    fetchError = e?.message ?? String(e);
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Plantillas</h1>
          <p className="text-sm text-slate-600 mt-1">Cartera: <span className="font-mono">{carteraId}</span> — Estrategia: <span className="font-mono">{strategyId}</span></p>
        </div>
        <Link href={`/modules/strategies/${carteraId}/complete/${strategyId}`} className="px-3 py-2 rounded border text-sm">Volver</Link>
      </div>
      {fetchError ? <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">Error cargando datos: {fetchError}</div> : null}
      <TemplatesConfig
        carteraId={carteraId}
        strategyId={strategyId}
        plantillas={plantillas}
        seleccionadas={seleccionadas}
      />
    </div>
  );
}
