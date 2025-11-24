import Link from "next/link";

export default async function RefinanciamientosPage({ params }: { params: any }) {
  let resolved = params;
  if (resolved && typeof (resolved as any).then === "function") {
    try { resolved = await resolved; } catch { resolved = params; }
  }

  const carteraId = resolved?.id ?? resolved?.params?.id ?? null;
  const strategyId = resolved?.strategyId ?? resolved?.params?.strategyId ?? null;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Refinanciamientos</h1>
      <p className="text-sm text-slate-600 mt-2">Cartera: <span className="font-mono">{carteraId}</span> — Estrategia: <span className="font-mono">{strategyId}</span></p>
      <div className="mt-4">Página placeholder para gestionar configuraciones de refinanciamiento.</div>
      <div className="mt-4">
        <Link href={`/modules/strategies/${carteraId}/complete/${strategyId}`} className="text-sm underline">Volver</Link>
      </div>
    </div>
  );
}
