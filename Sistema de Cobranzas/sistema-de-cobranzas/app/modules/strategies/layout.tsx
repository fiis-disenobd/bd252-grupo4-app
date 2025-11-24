import React from "react";

export const metadata = {
  title: "Estrategias - Modo Claro",
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
