"use client";
import React, { useState } from "react";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

type Canal = { id_canal: number; nombre: string };
type TipoFrecuencia = { id_tipo_frecuencia: number; nombre: string };
type Turno = { id_turno: number; nombre: string; hora_inicio: string; hora_fin: string };

export default function ChannelsConfig({
  carteraId,
  strategyId,
  canales,
  tiposFrecuencia,
  turnos,
}: {
  carteraId: any;
  strategyId: any;
  canales: Canal[];
  tiposFrecuencia: TipoFrecuencia[];
  turnos: Turno[];
}) {
  const [selectedCanales, setSelectedCanales] = useState<Record<number, boolean>>(() => {
    const init: Record<number, boolean> = {};
    canales.forEach(c => { init[c.id_canal] = false; });
    return init;
  });
  const [frecuenciaValor, setFrecuenciaValor] = useState<Record<number, number>>({});
  const [frecuenciaTipo, setFrecuenciaTipo] = useState<Record<number, number>>({});
  const [turnosSeleccionados, setTurnosSeleccionados] = useState<Record<number, Set<number>>>(() => {
    const init: Record<number, Set<number>> = {};
    canales.forEach(c => { init[c.id_canal] = new Set(); });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  function toggleCanal(id: number) {
    setSelectedCanales(prev => ({ ...prev, [id]: !prev[id] }));
  }
  function changeValor(id: number, v: string) {
    const n = v === "" ? NaN : Number(v);
    setFrecuenciaValor(prev => ({ ...prev, [id]: n }));
  }
  function changeTipo(id: number, tipoId: string) {
    setFrecuenciaTipo(prev => ({ ...prev, [id]: Number(tipoId) }));
  }
  function toggleTurno(canalId: number, turnoId: number) {
    setTurnosSeleccionados(prev => {
      const copy: Record<number, Set<number>> = { ...prev };
      const set = new Set(copy[canalId]);
      if (set.has(turnoId)) set.delete(turnoId); else set.add(turnoId);
      copy[canalId] = set;
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
    const rows: any[] = [];
    for (const canal of canales) {
      if (!selectedCanales[canal.id_canal]) continue;
      const valor = frecuenciaValor[canal.id_canal];
      const tipo = frecuenciaTipo[canal.id_canal];
      if (!valor || Number.isNaN(valor) || valor <= 0) {
        setError(`Valor de frecuencia faltante o inválido para canal ${canal.nombre}`);
        return;
      }
      if (!tipo) {
        setError(`Tipo de frecuencia faltante para canal ${canal.nombre}`);
        return;
      }
      const turnSet = turnosSeleccionados[canal.id_canal];
      if (!turnSet || turnSet.size === 0) {
        setError(`Selecciona al menos un turno para canal ${canal.nombre}`);
        return;
      }
      turnSet.forEach(turnoId => {
        rows.push({
          id_estrategia: idEstrat,
          id_canal: canal.id_canal,
          id_turno: turnoId,
          valor_frecuencia: valor,
            id_tipo_frecuencia: tipo,
        });
      });
    }
    if (rows.length === 0) {
      setError("No hay datos para guardar.");
      return;
    }
    setSaving(true);
    try {
      const supabase = createBrowserClient();
      const { data, error: rpcErr } = await supabase.rpc("guardar_config_canales", { rows_data: rows });
      if (rpcErr) throw new Error(rpcErr.message);
      if (data && !(data as any).success) throw new Error((data as any).error ?? "Error desconocido");
      setOkMessage(`Se guardaron ${rows.length} registros correctamente.`);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700">{error}</div> : null}
      {okMessage ? <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">{okMessage}</div> : null}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <fieldset className="border rounded p-4 space-y-4">
          <legend className="px-2 text-sm font-medium">Canales</legend>
          {canales.map(c => (
            <label key={c.id_canal} className="flex items-center justify-between gap-4 text-sm">
              <span>{c.nombre}</span>
              <button
                type="button"
                onClick={() => toggleCanal(c.id_canal)}
                className={`h-6 w-11 rounded-full flex items-center px-1 transition ${selectedCanales[c.id_canal] ? "bg-emerald-600" : "bg-slate-300"}`}
                aria-pressed={selectedCanales[c.id_canal]}
              >
                <span className={`h-4 w-4 rounded-full bg-white shadow transform transition ${selectedCanales[c.id_canal] ? "translate-x-5" : "translate-x-0"}`}></span>
              </button>
            </label>
          ))}
        </fieldset>
        <fieldset className="border rounded p-4 space-y-4 overflow-x-auto">
          <legend className="px-2 text-sm font-medium">Frecuencia</legend>
          {canales.filter(c => selectedCanales[c.id_canal]).length === 0 ? (
            <div className="text-xs text-slate-500">Selecciona canales para configurar frecuencia.</div>
          ) : canales.filter(c => selectedCanales[c.id_canal]).map(c => (
            <div key={c.id_canal} className="flex items-center gap-2">
              <div className="w-32 text-sm truncate" title={c.nombre}>{c.nombre}</div>
              <input
                type="number"
                min={1}
                className="w-20 rounded border px-2 py-1 text-sm bg-white"
                value={Number.isFinite(frecuenciaValor[c.id_canal]) ? frecuenciaValor[c.id_canal] : ""}
                onChange={e => changeValor(c.id_canal, e.target.value)}
                placeholder="valor"
              />
              <select
                className="rounded border px-2 py-1 text-sm bg-white"
                value={frecuenciaTipo[c.id_canal] ?? ""}
                onChange={e => changeTipo(c.id_canal, e.target.value)}
              >
                <option value="" disabled>tipo</option>
                {tiposFrecuencia.map(t => (
                  <option key={t.id_tipo_frecuencia} value={t.id_tipo_frecuencia}>{t.nombre}</option>
                ))}
              </select>
            </div>
          ))}
        </fieldset>
        <fieldset className="border rounded p-4 space-y-4">
          <legend className="px-2 text-sm font-medium">Horario</legend>
          {canales.filter(c => selectedCanales[c.id_canal]).length === 0 ? (
            <div className="text-xs text-slate-500">Selecciona canales para elegir turnos.</div>
          ) : canales.filter(c => selectedCanales[c.id_canal]).map(c => (
            <div key={c.id_canal} className="space-y-1">
              <div className="text-xs font-medium">{c.nombre}</div>
              <div className="flex flex-wrap gap-3">
                {turnos.map(t => {
                  const checked = turnosSeleccionados[c.id_canal]?.has(t.id_turno);
                  return (
                    <label key={t.id_turno} className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        className="h-3 w-3"
                        checked={checked}
                        onChange={() => toggleTurno(c.id_canal, t.id_turno)}
                      />
                      {t.nombre}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          {turnos.length > 0 ? (
            <div className="mt-4 overflow-auto">
              <table className="min-w-full text-xs border-collapse border">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="border px-2 py-1 text-left">Turno</th>
                    <th className="border px-2 py-1 text-left">Hora Inicio</th>
                    <th className="border px-2 py-1 text-left">Hora Fin</th>
                  </tr>
                </thead>
                <tbody>
                  {turnos.map(t => (
                    <tr key={t.id_turno} className="odd:bg-white even:bg-slate-50">
                      <td className="border px-2 py-1">{t.nombre}</td>
                      <td className="border px-2 py-1">{t.hora_inicio}</td>
                      <td className="border px-2 py-1">{t.hora_fin}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </fieldset>
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
