"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewStrategyForm({ carteraId }: { carteraId: any }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [carteraIdResolved, setCarteraIdResolved] = useState<any>(carteraId ?? null);

  React.useEffect(() => {
    // Debug log to inspect what prop was passed during hydration
    try {
      // eslint-disable-next-line no-console
      console.log("NewStrategyForm: received carteraId prop:", carteraId);
    } catch {}

    if (carteraIdResolved == null) {
      // Try to derive the cartera id from the URL as a fallback
      try {
        const parts = window.location.pathname.split("/").filter(Boolean);
        // Expected path: /modules/strategies/:id/new
        const idx = parts.indexOf("strategies");
        if (idx >= 0 && parts.length > idx + 1) {
          const maybeId = parts[idx + 1];
          if (maybeId) setCarteraIdResolved(maybeId);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [carteraId, carteraIdResolved]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const effectiveCarteraId = carteraIdResolved ?? carteraId;
    if (!effectiveCarteraId) {
      setError("Falta el identificador de la cartera.");
      return;
    }

    if (!codigo || !nombre || !fechaInicio || !fechaFin) {
      setError("Por favor completa los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`/api/estrategias`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            codigo: String(codigo).slice(0, 4),
            nombre,
            descripcion,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            id_cartera: Number(effectiveCarteraId),
          }),
      });

      const json = await resp.json();
      if (!resp.ok) throw new Error(json?.error || JSON.stringify(json));

      // navigate to the cartera's history page after successful creation
      router.push(`/modules/strategies/${encodeURIComponent(String(effectiveCarteraId))}/history`);
    } catch (err: any) {
      setError(err.message ?? "Error al crear la estrategia.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {error ? <div className="text-sm text-red-600">{error}</div> : null}

      <div>
        <label className="block text-sm font-medium">Código (4 chars)</label>
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          maxLength={4}
          required
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          maxLength={50}
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Descripción</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={500}
          className="mt-1 block w-full rounded border px-3 py-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Fecha inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            required
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Fecha fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            required
            className="mt-1 block w-full rounded border px-3 py-2"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-slate-700 text-white"
        >
          {loading ? "Creando..." : "Crear estrategia"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-3 py-2 rounded border">
          Cancelar
        </button>
      </div>
    </form>
  );
}
