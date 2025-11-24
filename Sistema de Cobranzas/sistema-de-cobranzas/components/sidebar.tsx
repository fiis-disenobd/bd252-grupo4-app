"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const modules = [
  { id: "security", label: "Módulo de Seguridad" },
  { id: "programacion", label: "Módulo de Programación" },
  { id: "operations", label: "Módulo de Operaciones" },
  { id: "strategies", label: "Módulo de Estrategias" },
  { id: "reports", label: "Módulo de Metas y Reportes" },
];

export function Sidebar() {
  const pathname = usePathname() || "";

  return (
    <aside className="w-64 min-h-screen bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-6 text-slate-900 dark:text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Interbank_logo.svg/2560px-Interbank_logo.svg.png"
          alt="Interbank"
          className="w-32 h-auto"
        />
        <div className="text-sm font-semibold">Área de Cobranzas</div>
      </div>

      <nav className="flex-1">
        <ul className="flex flex-col gap-2">
          {modules.map((m) => {
            const href = `/modules/${m.id}`;
            const active = pathname === href;
            return (
              <li key={m.id}>
                <Link
                  href={href}
                  className={`block w-full text-left px-3 py-2 rounded transition-colors text-sm font-medium ${
                    active
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      : "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {m.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="text-xs text-slate-500 dark:text-slate-400">v0.1 · Borrador</div>
    </aside>
  );
}
