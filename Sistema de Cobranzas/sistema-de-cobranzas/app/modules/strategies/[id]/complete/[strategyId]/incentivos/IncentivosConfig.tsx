"use client";
import { useState } from "react";

import { createClient as createBrowserClient } from "@/lib/supabase/client";

export default function IncentivosConfig({ strategyId }: { strategyId: number }) {
  const [condonacionOn, setCondonacionOn] = useState(false);
  const [descuentoOn, setDescuentoOn] = useState(false);
  const [bonificacionOn, setBonificacionOn] = useState(false);

  const [condMin, setCondMin] = useState("");
  const [condMax, setCondMax] = useState("");
  const [descMin, setDescMin] = useState("");
  const [descMax, setDescMax] = useState("");
  const [boniMin, setBoniMin] = useState("");
  const [boniMax, setBoniMax] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function guardarCambios() {
    setErr(null);
    setMsg(null);
    const items: any[] = [];
    if (condonacionOn) items.push({ nombre: "Condonación", valor_min: Number(condMin || 0), valor_max: Number(condMax || 0) });
    if (descuentoOn) items.push({ nombre: "Descuento", valor_min: Number(descMin || 0), valor_max: Number(descMax || 0) });
    if (bonificacionOn) items.push({ nombre: "Bonificación", valor_min: Number(boniMin || 0), valor_max: Number(boniMax || 0) });

    if (!strategyId) { setErr("strategyId inválido."); return; }
    if (items.length === 0) { setErr("No hay incentivos para guardar."); return; }

    setSaving(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.rpc("guardar_incentivos_estrategia", {
        p_id_estrategia: Number(strategyId),
        p_items: items,
      });
      if (error) throw new Error(error.message);
      if (data && (data as any).success === false) throw new Error((data as any).error ?? "Error guardando");
      setMsg(`Guardado: ${(data as any)?.count ?? items.length} registro(s).`);
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
      {/* Condonación */}
      <section className="border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Condonación</h2>
          <label className="inline-flex items-center gap-2 text-xs">
            <span>{condonacionOn ? "Activo" : "Inactivo"}</span>
            <input
              type="checkbox"
              checked={condonacionOn}
              onChange={(e) => setCondonacionOn(e.target.checked)}
              className="h-4 w-4"
            />
          </label>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs w-24">Valor mínimo</label>
            <div className="flex items-center border rounded px-2 py-1 bg-white">
              <input
                type="number"
                value={condMin}
                onChange={(e) => setCondMin(e.target.value)}
                className="outline-none text-sm w-24"
                disabled={!condonacionOn}
                min={0}
              />
              <span className="ml-2 text-xs select-none">%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs w-24">Valor máximo</label>
            <div className="flex items-center border rounded px-2 py-1 bg-white">
              <input
                type="number"
                value={condMax}
                onChange={(e) => setCondMax(e.target.value)}
                className="outline-none text-sm w-24"
                disabled={!condonacionOn}
                min={0}
              />
              <span className="ml-2 text-xs select-none">%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Descuento */}
      <section className="border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Descuento</h2>
          <label className="inline-flex items-center gap-2 text-xs">
            <span>{descuentoOn ? "Activo" : "Inactivo"}</span>
            <input
              type="checkbox"
              checked={descuentoOn}
              onChange={(e) => setDescuentoOn(e.target.checked)}
              className="h-4 w-4"
            />
          </label>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs w-24">Valor mínimo</label>
            <div className="flex items-center border rounded px-2 py-1 bg-white">
              <input
                type="number"
                value={descMin}
                onChange={(e) => setDescMin(e.target.value)}
                className="outline-none text-sm w-24"
                disabled={!descuentoOn}
                min={0}
              />
              <span className="ml-2 text-xs select-none">%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs w-24">Valor máximo</label>
            <div className="flex items-center border rounded px-2 py-1 bg-white">
              <input
                type="number"
                value={descMax}
                onChange={(e) => setDescMax(e.target.value)}
                className="outline-none text-sm w-24"
                disabled={!descuentoOn}
                min={0}
              />
              <span className="ml-2 text-xs select-none">%</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bonificación */}
      <section className="border rounded p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Bonificación</h2>
          <label className="inline-flex items-center gap-2 text-xs">
            <span>{bonificacionOn ? "Activo" : "Inactivo"}</span>
            <input
              type="checkbox"
              checked={bonificacionOn}
              onChange={(e) => setBonificacionOn(e.target.checked)}
              className="h-4 w-4"
            />
          </label>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-xs w-24">Valor mínimo</label>
            <div className="flex items-center border rounded px-2 py-1 bg-white">
              <span className="mr-2 text-xs select-none">S/.</span>
              <input
                type="number"
                value={boniMin}
                onChange={(e) => setBoniMin(e.target.value)}
                className="outline-none text-sm w-28"
                disabled={!bonificacionOn}
                min={0}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs w-24">Valor máximo</label>
            <div className="flex items-center border rounded px-2 py-1 bg-white">
              <span className="mr-2 text-xs select-none">S/.</span>
              <input
                type="number"
                value={boniMax}
                onChange={(e) => setBoniMax(e.target.value)}
                className="outline-none text-sm w-28"
                disabled={!bonificacionOn}
                min={0}
              />
            </div>
          </div>
        </div>
      </section>
      {/* Save button outside sections, bottom-right */}
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
