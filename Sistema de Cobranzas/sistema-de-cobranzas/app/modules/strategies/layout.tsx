import React from "react";

export const metadata = {
  title: "Sistema de Cobranzas - Estrategias",
};

export default function StrategiesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="not-dark">
      <div className="min-h-screen bg-white text-slate-900">
        {children}
      </div>
    </div>
  );
}
