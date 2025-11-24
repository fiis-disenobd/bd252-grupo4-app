import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

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

export default async function StrategyDetailPage({ params }: { params: any }) {
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

  return (
    <div className="p-4">
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

      <div className="mt-6">
        {active ? (
          <div className="p-4 border rounded bg-white dark:bg-slate-800 space-y-3 border-emerald-100">
            <div>
              <div className="text-sm text-muted-foreground">Código</div>
              <div className="font-medium">{active.codigo ?? "-"}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Nombre</div>
              <div className="font-medium">{active.nombre ?? "-"}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Descripción</div>
              <div>{active.descripcion ?? "-"}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Fecha inicio</div>
                <div className="font-medium">{formatDate(active.fecha_inicio)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Fecha fin</div>
                <div className="font-medium">{formatDate(active.fecha_fin)}</div>
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Estado</div>
              <div className="font-medium">{estadoLabels[(active.id_estado_estrategia ?? active.estado) as string] ?? (active.id_estado_estrategia ?? active.estado) ?? "-"}</div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <div className="text-sm text-muted-foreground">Refinanciamientos</div>
                <div>{JSON.stringify(active.refinanciamientos ?? active.refinancings ?? "-")}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Plantillas</div>
                <div>{JSON.stringify(active.plantillas ?? active.templates ?? "-")}</div>
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
    </div>
  );
}

