import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Strategy = Record<string, any>;

function formatDate(d?: string | null) {
  if (!d) return "-";
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return String(d);
  }
}

export default async function HistoryPage({ params }: { params: any }) {
  const id = params?.id ?? (params?.params && params.params.id) ?? null;

  if (!id) {
    // If server params are not available, render a client fallback that extracts the id
    // from the browser location and fetches the strategies there.
    const ClientOnlyHistory = (await import("./HistoryClient")).default;

    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold">Historial de estrategias</h1>
        <div className="text-sm text-destructive mt-2">Falta el identificador de la cartera en la URL (render server-side).</div>
        <div className="mt-4">
          <Link href="/modules/strategies" className="text-sm underline">Volver a la lista de carteras</Link>
        </div>
        <div className="mt-6">
          {/* Client-side fallback */}
          {/* @ts-expect-error Async import of client component */}
          <ClientOnlyHistory />
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Try to fetch from the schema-qualified table first
  let rows: Strategy[] = [];
  try {
    const { data, error } = await supabase
      .from("modulo_estrategias.estrategia")
      .select("*")
      .eq("id_cartera", Number(id))
      .order("fecha_inicio", { ascending: false }) as any;

    if (!error && Array.isArray(data)) rows = data;
  } catch (e) {
    // ignore and fallback to RPC
  }

  if (rows.length === 0) {
    try {
      const { data: rpcData } = await supabase.rpc("get_estrategias_por_cartera", { p_id_cartera: Number(id) } as any) as any;
      if (Array.isArray(rpcData)) rows = rpcData;
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historial de estrategias</h1>
          <p className="text-sm text-slate-600 mt-1">Cartera id: <span className="font-mono">{id}</span></p>
        </div>
        <div className="flex gap-2">
          <Link href={`/modules/strategies/${id}/new`} className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm">Nueva Estrategia</Link>
          <Link href="/modules/strategies" className="px-3 py-2 rounded border border-emerald-200 text-emerald-700 text-sm">Volver</Link>
        </div>
      </div>

      <div className="mt-6">
        {rows.length === 0 ? (
          <div className="p-4 border rounded bg-yellow-50">No se encontraron estrategias para esta cartera.</div>
        ) : (
          <div className="overflow-auto">
              <table className="min-w-full border-collapse table-auto text-sm text-slate-900 dark:text-slate-200">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-left text-sm">
                    <th className="px-4 py-2 border text-slate-700 dark:text-slate-300">Código</th>
                    <th className="px-4 py-2 border text-slate-700 dark:text-slate-300">Nombre</th>
                    <th className="px-4 py-2 border text-slate-700 dark:text-slate-300">Descripción</th>
                    <th className="px-4 py-2 border text-slate-700 dark:text-slate-300">Fecha Inicio</th>
                    <th className="px-4 py-2 border text-slate-700 dark:text-slate-300">Fecha Fin</th>
                    <th className="px-4 py-2 border text-slate-700 dark:text-slate-300">Estado</th>
                    <th className="px-4 py-2 border text-slate-700 dark:text-slate-300">Opciones</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s: Strategy) => (
                    <tr key={s.id_estrategia ?? s.id ?? JSON.stringify(s)} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-700">
                      <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{s.codigo ?? "-"}</td>
                      <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{s.nombre ?? "-"}</td>
                      <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{s.descripcion ?? "-"}</td>
                      <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{formatDate(s.fecha_inicio)}</td>
                      <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{formatDate(s.fecha_fin)}</td>
                      <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{(s.id_estado_estrategia ?? s.estado) ?? "-"}</td>
                      <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">
                        {((s.id_estado_estrategia ?? s.estado) === "P") ? (
                          <a
                            href={`/modules/strategies/${id}/complete/${encodeURIComponent(String(s.id_estrategia ?? s.id ?? ""))}`}
                            className="inline-block px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                          >
                            Completar
                          </a>
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
        )}
      </div>
    </div>
  );
}
