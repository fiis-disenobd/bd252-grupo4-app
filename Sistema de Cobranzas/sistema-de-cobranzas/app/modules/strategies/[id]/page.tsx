import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";
import PlantillasTable from "./PlantillasTable";

type Strategy = Record<string, any>;

function formatDate(d?: string | null) {
  if (!d) return "-";
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return String(d);
  }
}

async function StrategyContent({ params }: { params: any }) {
  let resolvedParams = params;
  // In some Next.js edge cases `params` can be a Promise — unwrap if necessary
  if (resolvedParams && typeof (resolvedParams as any).then === "function") {
    try {
      resolvedParams = await resolvedParams;
    } catch {
      resolvedParams = params;
    }
  }

  const id = resolvedParams?.id ?? (resolvedParams?.params && resolvedParams.params.id) ?? null;

      if (!id) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Estrategias</h1>
        <div className="text-sm text-destructive mt-2">Falta el identificador de la cartera en la URL.</div>
        <div className="mt-4">
          <a href="/modules/strategies" className="text-sm underline">Volver a la lista de carteras</a>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Resolve cartera name (try schema table first, then RPC)
  let carteraName = `#${id}`;
  try {
    const { data: carteraData, error: carteraErr } = await supabase
      .from("modulo_estrategias.cartera")
      .select("nombre")
      .eq("id_cartera", Number(id))
      .limit(1) as any;

    if (!carteraErr && Array.isArray(carteraData) && carteraData.length > 0) {
      carteraName = carteraData[0].nombre ?? carteraName;
    }
  } catch (_) {
    try {
      const { data: carterasRpc } = await supabase.rpc("get_carteras") as any;
      if (Array.isArray(carterasRpc)) {
        const found = carterasRpc.find((c: any) => String(c.id_cartera ?? c.id ?? c.pk) === String(id));
        if (found) carteraName = found.nombre ?? carteraName;
      }
    } catch (__)
    {
      // ignore
    }
  }

  // Try to get the active strategy: id_estado_estrategia = 'A'
  let active: Strategy | null = null;
  try {
    const { data, error } = await supabase
      .from("modulo_estrategias.estrategia")
      .select("*")
      .eq("id_cartera", Number(id))
      .eq("id_estado_estrategia", "A")
      .order("fecha_inicio", { ascending: false })
      .limit(1) as any;

    if (!error && Array.isArray(data) && data.length > 0) active = data[0];
  } catch (e) {
    // ignore; we'll fallback to RPC
  }

  if (!active) {
    try {
      const { data: rpcData } = await supabase.rpc("get_estrategias_por_cartera", { p_id_cartera: Number(id) } as any) as any;
      if (Array.isArray(rpcData)) {
        active = rpcData.find((r: any) => (r.id_estado_estrategia ?? r.estado) === "A") ?? null;
      }
    } catch (e) {
      // ignore
    }
  }

  const estadoLabels: Record<string, string> = { P: "Proceso", C: "Cola", A: "Activo", I: "Inactivo" };

  // Fetch related data for active strategy
  let canalesInfo: Array<{canal: string; frecuencia: string; unidad: string; turnos: string[]}> = [];
  let plantillasData: any[] = [];
  let incentivosData: any[] = [];
  let refinanciamientosData: any[] = [];

  if (active) {
    const strategyId = active.id_estrategia ?? active.id;
    
    // Fetch all data using RPCs
    try {
      const [detalleRes, canalesRes, frecuenciasRes, turnosRes, plantillasRes, incentivosRes, refinRes] = await Promise.all([
        supabase.rpc("obtener_detalle_estrategia", { p_id_estrategia: strategyId }),
        supabase.rpc("lista_canales"),
        supabase.rpc("lista_frecuencias"),
        supabase.rpc("lista_turnos"),
        supabase.rpc("obtener_plantillas_estrategia", { p_id_estrategia: strategyId }),
        supabase.rpc("obtener_incentivos_estrategia", { p_id_estrategia: strategyId }),
        supabase.rpc("obtener_refinanciamientos_estrategia", { p_id_estrategia: strategyId })
      ]);

      const detalle = (Array.isArray(detalleRes.data) ? detalleRes.data : []) as any[];
      const canales = (Array.isArray(canalesRes.data) ? canalesRes.data : []) as any[];
      const frecuencias = (Array.isArray(frecuenciasRes.data) ? frecuenciasRes.data : []) as any[];
      const turnos = (Array.isArray(turnosRes.data) ? turnosRes.data : []) as any[];

      // Group by canal
      const grouped: Record<number, any[]> = {};
      detalle.forEach((d: any) => {
        if (!grouped[d.id_canal]) grouped[d.id_canal] = [];
        grouped[d.id_canal].push(d);
      });

      canalesInfo = Object.keys(grouped).map(canalId => {
        const rows = grouped[Number(canalId)];
        const canalObj = canales.find(c => c.id_canal === Number(canalId));
        const frecObj = frecuencias.find(f => f.id_tipo_frecuencia === rows[0]?.id_tipo_frecuencia);
        const turnoNames = rows.map(r => {
          const turno = turnos.find(t => t.id_turno === r.id_turno);
          return turno?.nombre ?? `T${r.id_turno}`;
        });
        
        return {
          canal: canalObj?.nombre ?? `Canal ${canalId}`,
          frecuencia: String(rows[0]?.valor_frecuencia ?? ""),
          unidad: frecObj?.nombre ?? "",
          turnos: turnoNames
        };
      });

      plantillasData = Array.isArray(plantillasRes.data) ? plantillasRes.data : [];
      incentivosData = Array.isArray(incentivosRes.data) ? incentivosRes.data : [];
      refinanciamientosData = Array.isArray(refinRes.data) ? refinRes.data : [];
    } catch {}
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Estrategia activa — {carteraName}</h1>
          <p className="text-sm text-slate-600 mt-1">Cartera: {carteraName} (id {id})</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/modules/strategies/${id}/history`} className="px-3 py-2 rounded border text-sm">Historial</Link>
          <Link href={`/modules/strategies/${id}/new`} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm">Nueva Estrategia</Link>
        </div>
      </div>

      {active ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Strategy info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="p-6 border rounded bg-white space-y-5">
              <div>
                <div className="text-xs text-slate-500 mb-1">Código:</div>
                <div className="font-semibold text-lg">{active.codigo ?? "E001254"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Nombre:</div>
                <div className="font-medium text-base">{active.nombre ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Descripción:</div>
                <div className="text-sm leading-relaxed">{active.descripcion ?? "-"}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Fecha inicio:</div>
                <div className="font-medium">{formatDate(active.fecha_inicio)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Fecha fin:</div>
                <div className="font-medium">{formatDate(active.fecha_fin)}</div>
              </div>
            </div>
          </div>

          {/* Right columns - 2x2 grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Canales */}
            <div className="p-6 border-2 rounded-lg bg-white">
              <h3 className="text-xl font-bold mb-4 text-center">Canales</h3>
              <div className="text-xs overflow-x-auto">
                {canalesInfo.length > 0 ? (
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="border px-2 py-1 text-left font-semibold">Canal</th>
                        <th className="border px-2 py-1 text-center font-semibold">Frecuencia</th>
                        <th className="border px-2 py-1 text-center font-semibold">Unidad</th>
                        <th className="border px-2 py-1 text-center font-semibold">Mañana</th>
                        <th className="border px-2 py-1 text-center font-semibold">Tarde</th>
                        <th className="border px-2 py-1 text-center font-semibold">Noche</th>
                      </tr>
                    </thead>
                    <tbody>
                      {canalesInfo.map((info, idx) => (
                        <tr key={idx} className="odd:bg-white even:bg-slate-50">
                          <td className="border px-2 py-1">{info.canal}</td>
                          <td className="border px-2 py-1 text-center">{info.frecuencia}</td>
                          <td className="border px-2 py-1 text-center">{info.unidad}</td>
                          <td className="border px-2 py-1 text-center">
                            {info.turnos.includes("Mañana") ? "✓" : ""}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {info.turnos.includes("Tarde") ? "✓" : ""}
                          </td>
                          <td className="border px-2 py-1 text-center">
                            {info.turnos.includes("Noche") ? "✓" : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center text-slate-400">Sin configurar</div>
                )}
              </div>
            </div>

            {/* Incentivos */}
            <div className="p-6 border-2 rounded-lg bg-white">
              <h3 className="text-xl font-bold mb-4 text-center">Incentivos</h3>
              <div className="text-sm text-slate-600">
                {incentivosData.length > 0 ? (
                  <div className="space-y-2">
                    {incentivosData.map((inc, idx) => (
                      <div key={idx} className="text-center">
                        <div className="text-2xl font-bold">{inc.porcentaje_condonacion ?? 0}%</div>
                        <div className="text-xs">condonación</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-400">Sin configurar</div>
                )}
              </div>
            </div>

            {/* Refinanciamientos */}
            <div className="p-6 border-2 rounded-lg bg-white">
              <h3 className="text-xl font-bold mb-4 text-center">Refinanciamientos</h3>
              <div className="text-sm text-slate-600">
                {refinanciamientosData.length > 0 ? (
                  <div className="space-y-2">
                    {refinanciamientosData.map((ref, idx) => (
                      <div key={idx}>
                        <div className="text-3xl font-bold text-center">{ref.monto_inicial ?? 200}</div>
                        <div className="text-xs text-center">Monto inicial</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-slate-400">Sin configurar</div>
                )}
              </div>
            </div>

            {/* Plantillas */}
            <div className="p-6 border-2 rounded-lg bg-white">
              <h3 className="text-xl font-bold mb-4 text-center">Plantillas</h3>
              <PlantillasTable plantillas={plantillasData} />
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 border rounded bg-yellow-50">
          <div className="font-medium">No hay una estrategia activa para esta cartera.</div>
          <div className="text-sm mt-2">Puedes crear una nueva estrategia con el botón "Nueva Estrategia".</div>
        </div>
      )}
    </div>
  );
}

export default function StrategyDetailPage({ params }: { params: any }) {
  return (
    <Suspense fallback={<div className="p-4">Cargando estrategia...</div>}>
      <StrategyContent params={params} />
    </Suspense>
  );
}

