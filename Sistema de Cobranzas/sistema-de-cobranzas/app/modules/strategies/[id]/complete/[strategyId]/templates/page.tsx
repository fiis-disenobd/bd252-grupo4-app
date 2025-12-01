import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TemplatesColumns from "./TemplatesColumns";

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
    // Usar RPCs para evitar problemas de search_path y RLS
    const carteraNum = Number(carteraId);
    const estrategiaNum = Number(strategyId);

    const [plsRes, selRes] = await Promise.all([
      supabase.rpc("obtener_plantillas_filtradas", { p_id_cartera: carteraNum, p_id_estrategia: estrategiaNum }),
      supabase.rpc("obtener_plantillas_seleccionadas", { p_id_estrategia: estrategiaNum })
    ]);

    if (plsRes.error) fetchError = plsRes.error.message;
    if (selRes.error) fetchError = fetchError || selRes.error.message;

    plantillas = Array.isArray(plsRes.data) ? plsRes.data : [];
    seleccionadas = Array.isArray(selRes.data) ? selRes.data as number[] : [];
  } catch (e: any) {
    fetchError = e?.message ?? String(e);
  }

  const preseleccionadasIds = Array.isArray(seleccionadas) ? seleccionadas : [];

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
      <TemplatesColumns plantillas={plantillas} strategyId={Number(strategyId)} preseleccionadas={preseleccionadasIds} />
    </div>
  );
}
