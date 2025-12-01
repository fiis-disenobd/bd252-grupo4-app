"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FinalizarButton({ strategyId, carteraId }: { strategyId: number; carteraId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleFinalizar() {
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("finalizar_estrategia", {
        p_id_estrategia: strategyId,
      });

      if (rpcError) throw new Error(rpcError.message);
      if (data && !(data as any).success) {
        throw new Error((data as any).error ?? "Error al finalizar estrategia");
      }

      // Redirigir al historial
      router.push(`/modules/strategies/${carteraId}/history`);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 flex flex-col items-center">
      {error && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700 max-w-md">
          {error}
        </div>
      )}
      <button
        onClick={handleFinalizar}
        disabled={loading}
        className="px-6 py-3 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-lg font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Finalizando..." : "Finalizar y Mover a la Cola"}
      </button>
    </div>
  );
}
