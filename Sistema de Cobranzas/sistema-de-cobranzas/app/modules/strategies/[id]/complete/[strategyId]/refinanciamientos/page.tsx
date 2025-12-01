import Link from "next/link";
import RefinanciamientosConfig from "./RefinanciamientosConfig";

export default async function RefinanciamientosPage({ params }: { params: any }) {
  let resolved = params;
  if (resolved && typeof (resolved as any).then === "function") {
    try { resolved = await resolved; } catch { resolved = params; }
  }

  const carteraId = resolved?.id ?? resolved?.params?.id ?? null;
  const strategyId = resolved?.strategyId ?? resolved?.params?.strategyId ?? null;

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Refinanciamientos</h1>
          <p className="text-sm text-slate-600 mt-1">Cartera: <span className="font-mono">{carteraId}</span> — Estrategia: <span className="font-mono">{strategyId}</span></p>
        </div>
        <Link href={`/modules/strategies/${carteraId}/complete/${strategyId}`} className="px-3 py-2 rounded border text-sm">Volver</Link>
      </div>

      <RefinanciamientosConfig strategyId={Number(strategyId)} />
    </div>
  );
}
