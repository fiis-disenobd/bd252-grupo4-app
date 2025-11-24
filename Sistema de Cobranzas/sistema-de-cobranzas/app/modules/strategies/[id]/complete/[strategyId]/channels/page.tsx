import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ChannelsConfig from "./ChannelsConfig";

export default async function ChannelsPage({ params }: { params: any }) {
  let resolved = params;
  if (resolved && typeof (resolved as any).then === "function") {
    try { resolved = await resolved; } catch { resolved = params; }
  }

  const carteraId = resolved?.id ?? resolved?.params?.id ?? null;
  const strategyId = resolved?.strategyId ?? resolved?.params?.strategyId ?? null;

  const supabase = await createClient();

  let canales: any[] = [];
  let tiposFrecuencia: any[] = [];
  let turnos: any[] = [];
  let fetchError: string | null = null;
  try {
    // Use separate RPC calls to fetch each catalog from custom schema.
    const [canalesRes, frecuenciasRes, turnosRes] = await Promise.all([
      supabase.rpc("lista_canales"),
      supabase.rpc("lista_frecuencias"),
      supabase.rpc("lista_turnos")
    ]);

    if (canalesRes.error) fetchError = canalesRes.error.message;
    else if (Array.isArray(canalesRes.data)) canales = canalesRes.data;

    if (frecuenciasRes.error) fetchError = fetchError || frecuenciasRes.error.message;
    else if (Array.isArray(frecuenciasRes.data)) tiposFrecuencia = frecuenciasRes.data;

    if (turnosRes.error) fetchError = fetchError || turnosRes.error.message;
    else if (Array.isArray(turnosRes.data)) turnos = turnosRes.data;
  } catch (e: any) {
    fetchError = e?.message ?? String(e);
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Configuración de Canales</h1>
          <p className="text-sm text-slate-600 mt-1">Cartera: <span className="font-mono">{carteraId}</span> — Estrategia: <span className="font-mono">{strategyId}</span></p>
        </div>
        <Link href={`/modules/strategies/${carteraId}/complete/${strategyId}`} className="px-3 py-2 rounded border text-sm">Volver</Link>
      </div>
      {fetchError ? (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">Error cargando datos: {fetchError}</div>
      ) : null}
      <ChannelsConfig
        carteraId={carteraId}
        strategyId={strategyId}
        canales={canales}
        tiposFrecuencia={tiposFrecuencia}
        turnos={turnos}
      />
    </div>
  );
}
