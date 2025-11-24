"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient as createBrowserClient } from "@/lib/supabase/client";

type Strategy = Record<string, any>;

export default function HistoryClient() {
  const pathname = usePathname() ?? "";
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf("strategies");
  const id = idx >= 0 && parts.length > idx + 1 ? parts[idx + 1] : null;

  const [rows, setRows] = useState<Strategy[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No se encontró el id en la URL.");
      setLoading(false);
      return;
    }

    const supabase = createBrowserClient();

    async function load() {
      setLoading(true);
      try {
        // Try RPC first
        const { data: rpcData, error: rpcErr } = await supabase.rpc("get_estrategias_por_cartera", { p_id_cartera: Number(id) } as any) as any;
        if (!rpcErr && Array.isArray(rpcData)) {
          setRows(rpcData);
          setLoading(false);
          return;
        }

        // Fallback: try direct select
        const { data, error } = await supabase
          .from("modulo_estrategias.estrategia")
          .select("*")
          .eq("id_cartera", Number(id))
          .order("fecha_inicio", { ascending: false }) as any;

        if (!error && Array.isArray(data)) {
          setRows(data);
        } else {
          setRows([]);
        }
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  if (loading) return <div className="p-4">Cargando historial...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;
  if (!rows || rows.length === 0) return <div className="p-4">No se encontraron estrategias para esta cartera.</div>;

  return (
    <div className="p-4">
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
            {rows.map((s) => (
              <tr key={s.id_estrategia ?? JSON.stringify(s)} className="odd:bg-white even:bg-slate-50 dark:odd:bg-slate-800 dark:even:bg-slate-700">
                <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{s.codigo ?? "-"}</td>
                <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{s.nombre ?? "-"}</td>
                <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{s.descripcion ?? "-"}</td>
                <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{s.fecha_inicio ? new Date(s.fecha_inicio).toLocaleDateString() : "-"}</td>
                <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{s.fecha_fin ? new Date(s.fecha_fin).toLocaleDateString() : "-"}</td>
                <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">{(s.id_estado_estrategia ?? s.estado) ?? "-"}</td>
                <td className="px-4 py-2 border align-top text-slate-900 dark:text-slate-200">
                  {((s.id_estado_estrategia ?? s.estado) === "P") ? (
                    <a
                      href={`/modules/strategies/${new URL(window.location.href).pathname.split("/").filter(Boolean).slice(-3)[1]}/complete/${encodeURIComponent(String(s.id_estrategia ?? s.id ?? ""))}`}
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
    </div>
  );
}
