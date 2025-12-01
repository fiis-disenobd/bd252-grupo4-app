"use client";
import React from "react";
import Link from "next/link";

const titles: Record<string, string> = {
  security: "Módulo de Seguridad",
  scheduling: "Módulo de Programación de Recursos",
  operations: "Módulo de Operaciones",
  strategies: "Módulo de Estrategias",
  reports: "Módulo de Metas y Reportes",
};

type Props = {
  children: React.ReactNode;
  params: { id: string };
};

export default function ModuleLayout({ children, params }: Props) {
  const id = params.id;
  const title = titles[id] || "Módulo";

  return (
    <div className="flex-1">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Panel principal del módulo</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/modules/${id}`} className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-sm">
              Vista principal
            </Link>
            <Link href={`/modules/${id}`} className="px-3 py-1 rounded border text-sm">
              Requerimientos
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-card p-4 rounded border">{children}</section>
    </div>
  );
}
