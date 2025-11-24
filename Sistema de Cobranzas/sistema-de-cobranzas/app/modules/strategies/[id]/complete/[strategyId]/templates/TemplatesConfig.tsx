"use client";
import React, { useState, useMemo } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

type Plantilla = {
  id_plantilla: number;
  nombre: string;
  descripcion: string;
  contenido: string;
  id_cartera: number;
  id_canal: number;
};

export default function TemplatesConfig({
  carteraId,
  strategyId,
  plantillas,
  seleccionadas,
}: {
  carteraId: any;
  strategyId: any;
  plantillas: Plantilla[];
  seleccionadas: number[];
}) {
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(seleccionadas)
  );
  const [openPreview, setOpenPreview] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!filter) return plantillas;
    const f = filter.toLowerCase();
    return plantillas.filter(
      (p) =>
        p.nombre.toLowerCase().includes(f) ||
        p.descripcion.toLowerCase().includes(f) ||
        p.contenido.toLowerCase().includes(f)
    );
  }, [filter, plantillas]);

  function toggle(id: number) {
    setSelected((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  function togglePreview(id: number) {
    setOpenPreview((prev) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  async function handleGuardar() {
    setError(null);
    setOkMessage(null);
    const idEstrat = Number(strategyId);
    if (!idEstrat || Number.isNaN(idEstrat)) {
      setError("strategyId inválido.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      // Obtener actuales relaciones para saber qué borrar
      const { data: actuales, error: relErr } = await supabase
        .from("modulo_estrategias.estrategia_plantilla")
        .select("id_plantilla")
        .eq("id_estrategia", idEstrat);
      if (relErr) throw new Error(relErr.message);

      const actualesSet = new Set<number>((actuales || []).map((r: any) => r.id_plantilla));
      const nuevos = [...selected].filter((id) => !actualesSet.has(id));
      const eliminados = [...actualesSet].filter((id) => !selected.has(id));

      // Inserciones
      if (nuevos.length > 0) {
        const rows = nuevos.map((id) => ({ id_estrategia: idEstrat, id_plantilla: id }));
        const { error: insErr } = await supabase
          .from("modulo_estrategias.estrategia_plantilla")
          .insert(rows);
        if (insErr) throw new Error(insErr.message);
      }

      // Eliminaciones
      for (const id of eliminados) {
        const { error: delErr } = await supabase
          .from("modulo_estrategias.estrategia_plantilla")
          .delete()
          .match({ id_estrategia: idEstrat, id_plantilla: id });
        if (delErr) throw new Error(delErr.message);
      }

      setOkMessage(
        `Cambios guardados. Añadidas: ${nuevos.length}, Eliminadas: ${eliminados.length}. Total seleccionadas: ${selected.size}`
      );
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">{error}</div>
      ) : null}
      {okMessage ? (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">{okMessage}</div>
      ) : null}

      <div className="flex items-center gap-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded border px-3 py-2 text-sm w-64"
        />
        <div className="text-xs text-slate-500">Seleccionadas: {selected.size}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay plantillas para mostrar.</div>
        ) : (
          filtered.map((p) => {
            const isSel = selected.has(p.id_plantilla);
            const isOpen = openPreview.has(p.id_plantilla);
            return (
              <div
                key={p.id_plantilla}
                className={`border rounded p-3 space-y-2 bg-white dark:bg-slate-800 shadow-sm relative`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-sm">{p.nombre}</div>
                    <div className="text-xs text-slate-500 line-clamp-2" title={p.descripcion}>{p.descripcion}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggle(p.id_plantilla)}
                    className={`h-6 w-11 rounded-full flex items-center px-1 transition ${isSel ? "bg-emerald-600" : "bg-slate-300"}`}
                    aria-pressed={isSel}
                  >
                    <span className={`h-4 w-4 rounded-full bg-white shadow transform transition ${isSel ? "translate-x-5" : "translate-x-0"}`}></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => togglePreview(p.id_plantilla)}
                    className="text-xs underline"
                  >
                    {isOpen ? "Ocultar" : "Ver contenido"}
                  </button>
                  <span className="text-[10px] text-slate-400">ID {p.id_plantilla} • Canal {p.id_canal}</span>
                </div>
                {isOpen ? (
                  <pre className="text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded overflow-auto max-h-40 whitespace-pre-wrap">{p.contenido}</pre>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={handleGuardar}
          disabled={saving}
          className="px-6 py-3 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium disabled:opacity-60"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
