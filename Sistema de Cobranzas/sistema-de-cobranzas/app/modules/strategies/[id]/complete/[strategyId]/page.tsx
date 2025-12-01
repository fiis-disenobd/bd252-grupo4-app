import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import FinalizarButton from "./FinalizarButton";

export default async function CompleteStrategyPage({ params }: { params: any }) {
  // Be defensive: Next may sometimes pass `params` as a Promise or wrap them
  // (e.g., params.params). Unwrap and normalize so we reliably read id and
  // strategyId.
  let resolvedParams: any = params;
  if (resolvedParams && typeof (resolvedParams as any).then === "function") {
    try {
      resolvedParams = await resolvedParams;
    } catch {
      resolvedParams = params;
    }
  }

  const carteraId = resolvedParams?.id ?? resolvedParams?.params?.id ?? null;
  const strategyId = resolvedParams?.strategyId ?? resolvedParams?.params?.strategyId ?? null;

  let supabase: any = null;
  let strategy: any = null;
  let fetchResult: any = null;
  let fetchError: string | null = null;

  // createClient can throw (missing env or other server errors). Don't let
  // that crash the whole page — show diagnostic info and still render the
  // action buttons so the user can continue.
  try {
    supabase = await createClient();
  } catch (e: any) {
    fetchError = e?.message ?? String(e);
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("modulo_estrategias.estrategia")
        .select("*")
        .or(`id_estrategia.eq.${strategyId},id.eq.${strategyId}`)
        .limit(1) as any;

      fetchResult = { data, error } as any;
      if (!error && Array.isArray(data) && data.length > 0) strategy = data[0];
    } catch (e: any) {
      fetchError = fetchError ? fetchError + " | " + (e?.message ?? String(e)) : (e?.message ?? String(e));
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Completar estrategia</h1>
          <p className="text-sm text-slate-600 mt-1">Cartera: <span className="font-mono">{carteraId}</span> — Estrategia: <span className="font-mono">{strategyId}</span></p>
        </div>
        <div>
          <Link href={`/modules/strategies/${carteraId}/history`} className="px-3 py-2 rounded border border-emerald-200 text-emerald-700 text-sm">Volver al historial</Link>
        </div>
      </div>

      <div className="mt-6">
        {/* Diagnostic block to help debugging when the page appears empty */}
        
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href={`/modules/strategies/${carteraId}/complete/${strategyId}/templates`} className="block w-full p-6 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-center text-lg font-medium">Plantillas</Link>

          <Link href={`/modules/strategies/${carteraId}/complete/${strategyId}/channels`} className="block w-full p-6 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-center text-lg font-medium">Canales</Link>

          <Link href={`/modules/strategies/${carteraId}/complete/${strategyId}/incentivos`} className="block w-full p-6 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-center text-lg font-medium">Incentivos</Link>

          <Link href={`/modules/strategies/${carteraId}/complete/${strategyId}/refinanciamientos`} className="block w-full p-6 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-center text-lg font-medium">Refinanciamientos</Link>
        </div>

        <FinalizarButton strategyId={Number(strategyId)} carteraId={carteraId} />
      </div>
    </div>
  );
}
