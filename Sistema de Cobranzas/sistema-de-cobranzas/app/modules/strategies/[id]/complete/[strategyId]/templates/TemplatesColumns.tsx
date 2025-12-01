"use client";
import { useState, useMemo, useEffect } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

type Plantilla = {
  id_plantilla: number;
  nombre: string;
  descripcion: string;
  contenido: string;
  id_cartera?: number;
  id_canal?: number;
  canal?: string;
};

export default function TemplatesColumns({ plantillas, strategyId, preseleccionadas = [] }: { plantillas: Plantilla[]; strategyId: number; preseleccionadas?: number[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [filter, setFilter] = useState("");
  const [lista, setLista] = useState<Plantilla[]>([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Pre-cargar seleccionadas si vienen desde el servidor
  useEffect(() => {
    if (!preseleccionadas || preseleccionadas.length === 0) return;
    const map = new Map<number, Plantilla>(plantillas.map((p) => [p.id_plantilla, p]));
    const items = preseleccionadas.map((id) => map.get(id)).filter(Boolean) as Plantilla[];
    if (items.length) setLista(items);
  }, [plantillas, preseleccionadas]);

  const rows = useMemo(() => {
    if (!filter) return plantillas;
    const f = filter.toLowerCase();
    return plantillas.filter(
      (p) =>
        (p.nombre || "").toLowerCase().includes(f) ||
        (p.descripcion || "").toLowerCase().includes(f) ||
        (p.canal || "").toLowerCase().includes(f)
    );
  }, [plantillas, filter]);

  const selected = useMemo(() => rows.find((p) => p.id_plantilla === selectedId) || null, [rows, selectedId]);

  function agregarSeleccionada() {
    if (!selected) return;
    setLista((prev) => (prev.find((x) => x.id_plantilla === selected.id_plantilla) ? prev : [...prev, selected]));
  }

  function quitar(id: number) {
    setLista((prev) => prev.filter((p) => p.id_plantilla !== id));
    if (selectedId === id) {
      // keep selection but button will show again since no longer in list
    }
  }

  async function guardarCambios() {
    setErr(null);
    setMsg(null);
    const ids = lista.map((p) => p.id_plantilla);
    if (!strategyId || ids.length === 0) {
      setErr(!strategyId ? "strategyId inválido." : "No hay plantillas para guardar.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.rpc("guardar_plantillas_estrategia", {
        p_id_estrategia: Number(strategyId),
        p_ids: ids,
      });
      if (error) throw new Error(error.message);
      if (data && (data as any).success === false) throw new Error((data as any).error ?? "Error guardando");
      setMsg(`Guardado: ${(data as any)?.count ?? ids.length} inserciones (duplicados ignorados).`);
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {err ? <div className="md:col-span-3 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">{err}</div> : null}
      {msg ? <div className="md:col-span-3 p-3 rounded bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">{msg}</div> : null}
      {/* Columna 1: Plantillas (tabla) */}
      <div className="border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium">Plantillas</h2>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Buscar..."
            className="rounded border px-2 py-1 text-xs w-40"
          />
        </div>
        <div className="text-xs overflow-auto max-h-[480px]">
          {rows.length === 0 ? (
            <div className="text-slate-500">No hay plantillas para mostrar.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-slate-100">
                  <th className="border px-2 py-1 text-left">Nombre</th>
                  <th className="border px-2 py-1 text-left">Canal</th>
                  <th className="border px-2 py-1 text-left">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr
                    key={p.id_plantilla}
                    className={`cursor-pointer select-none odd:bg-white even:bg-slate-50 hover:bg-emerald-50 ${
                      selectedId === p.id_plantilla ? "outline outline-2 outline-emerald-400" : ""
                    }`}
                    onClick={() => setSelectedId(p.id_plantilla)}
                    title="Click para ver contenido"
                  >
                    <td className="border px-2 py-1 text-slate-800">{p.nombre}</td>
                    <td className="border px-2 py-1 text-slate-700">{p.canal ?? p.id_canal ?? "-"}</td>
                    <td className="border px-2 py-1 text-slate-600">{p.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Columna 2: Contenido */}
      <div className="border rounded p-4">
        <h2 className="text-sm font-medium mb-3">Contenido</h2>
        {selected ? (
          <div className="space-y-2">
            <div className="text-sm font-semibold">{selected.nombre}</div>
            <div className="text-xs text-slate-500">Canal: {selected.canal ?? selected.id_canal ?? "-"}</div>
            <div className="text-xs text-slate-500">Descripción: {selected.descripcion}</div>
            <pre className="mt-2 text-xs bg-slate-50 p-3 rounded whitespace-pre-wrap max-h-[420px] overflow-auto">
              {selected.contenido}
            </pre>
            {lista.find((x) => x.id_plantilla === selected.id_plantilla) ? null : (
              <div className="pt-2 flex justify-end">
                <button
                  onClick={agregarSeleccionada}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-sm"
                >
                  Agregar
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate-500">Selecciona una plantilla para ver el contenido.</div>
        )}
      </div>

      {/* Columna 3: Lista seleccionada */}
      <div className="border rounded p-4">
        <h2 className="text-sm font-medium mb-3">Seleccionadas</h2>
        <div className="text-xs overflow-auto max-h-[480px]">
          {lista.length === 0 ? (
            <div className="text-slate-500">Aún no agregas plantillas.</div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="bg-slate-100">
                  <th className="border px-2 py-1 text-left">Nombre</th>
                  <th className="border px-2 py-1 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((p) => (
                  <tr key={p.id_plantilla} className="odd:bg-white even:bg-slate-50">
                    <td className="border px-2 py-1">{p.nombre}</td>
                    <td className="border px-2 py-1 text-center space-x-2">
                      <button
                        onClick={() => setSelectedId(p.id_plantilla)}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => quitar(p.id_plantilla)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {/* Footer save button across columns */}
      <div className="md:col-span-3 mt-2 flex justify-end">
        <button
          onClick={guardarCambios}
          disabled={saving}
          className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
