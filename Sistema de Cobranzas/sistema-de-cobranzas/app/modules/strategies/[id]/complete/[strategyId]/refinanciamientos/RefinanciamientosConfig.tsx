"use client";
import { useState } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

export default function RefinanciamientosConfig({ strategyId }: { strategyId: number }) {
  const [enabled, setEnabled] = useState(false);
  const [montoInicial, setMontoInicial] = useState("");
  const [tasaInteres, setTasaInteres] = useState("");
  const [numCuotas, setNumCuotas] = useState("");
  const [plazoMeses, setPlazoMeses] = useState("");
  const [porcentajeCondonado, setPorcentajeCondonado] = useState("");

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function guardarCambios() {
    setErr(null);
    setMsg(null);
    if (!enabled) { setErr("Debe activar el refinanciamiento."); return; }
    if (!strategyId) { setErr("strategyId inválido."); return; }

    const payload = {
      monto_inicial: Number(montoInicial || 0),
      tasa_interes: Number(tasaInteres || 0),
      num_cuotas: Number(numCuotas || 0),
      plazo_meses: Number(plazoMeses || 0),
      porcentaje_condonado: Number(porcentajeCondonado || 0),
    };

    setSaving(true);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.rpc("guardar_refinanciamiento_estrategia", {
        p_id_estrategia: Number(strategyId),
        p_data: payload,
      });
      if (error) throw new Error(error.message);
      if (data && (data as any).success === false) throw new Error((data as any).error ?? "Error guardando");
      setMsg("Refinanciamiento guardado correctamente.");
    } catch (e: any) {
      setErr(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Refinanciamiento</h2>
        <label className="inline-flex items-center gap-2 text-xs">
          <span>{enabled ? "Activo" : "Inactivo"}</span>
          <input type="checkbox" className="h-4 w-4" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        </label>
      </div>

      {err ? <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">{err}</div> : null}
      {msg ? <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">{msg}</div> : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <label className="text-xs w-40">Monto inicial</label>
          <div className="flex items-center border rounded px-2 py-1 bg-white">
            <span className="mr-2 text-xs select-none">S/.</span>
            <input type="number" min={0} disabled={!enabled} value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} className="outline-none text-sm w-32" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs w-40">Tasa de interés</label>
          <div className="flex items-center border rounded px-2 py-1 bg-white">
            <input type="number" min={0} disabled={!enabled} value={tasaInteres} onChange={(e) => setTasaInteres(e.target.value)} className="outline-none text-sm w-32" />
            <span className="ml-2 text-xs select-none">%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs w-40">Número de Cuotas</label>
          <input type="number" min={0} disabled={!enabled} value={numCuotas} onChange={(e) => setNumCuotas(e.target.value)} className="border rounded px-2 py-1 bg-white outline-none text-sm w-32" />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs w-40">Plazo en meses</label>
          <input type="number" min={0} disabled={!enabled} value={plazoMeses} onChange={(e) => setPlazoMeses(e.target.value)} className="border rounded px-2 py-1 bg-white outline-none text-sm w-32" />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs w-40">Porcentaje condonado</label>
          <div className="flex items-center border rounded px-2 py-1 bg-white">
            <input type="number" min={0} disabled={!enabled} value={porcentajeCondonado} onChange={(e) => setPorcentajeCondonado(e.target.value)} className="outline-none text-sm w-32" />
            <span className="ml-2 text-xs select-none">%</span>
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-end">
        <button onClick={guardarCambios} disabled={saving} className="px-5 py-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-sm disabled:opacity-60">
          {saving ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}
