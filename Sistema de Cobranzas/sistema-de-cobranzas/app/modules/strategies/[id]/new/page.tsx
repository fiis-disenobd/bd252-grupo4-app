import React from "react";
import NewStrategyForm from "./NewStrategyForm";
import ClientCarteraId from "./ClientCarteraId";

export default function NewStrategyPage({ params }: { params: any }) {
  // Do not await `params` here to avoid uncached data access outside Suspense.
  // Next provides `params` synchronously for route components in normal cases.
  const id = params?.id ?? (params?.params && params.params.id) ?? null;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Crear nueva estrategia</h1>
      <p className="text-sm text-slate-600 mt-1">Cartera id: <span className="font-mono">{id ?? ""}</span></p>
      <div className="mt-2 text-xs text-slate-500">
        <div>Debug params (server render):</div>
        <pre className="bg-slate-100 dark:bg-slate-900 p-2 rounded mt-1">{JSON.stringify(params)}</pre>
      </div>
      {/* Client-side fallback to show id when server params are proxied */}
      <ClientCarteraId />
      <div className="mt-6">
        {/* Client-side form component */}
        {/* @ts-expect-error passing server value to client component */}
        <NewStrategyForm carteraId={id} />
      </div>
    </div>
  );
}
