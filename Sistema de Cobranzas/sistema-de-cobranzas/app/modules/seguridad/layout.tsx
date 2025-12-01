import React from 'react';
import Link from 'next/link';

export default function SeguridadLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-6 bg-gray-50 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Módulo de Seguridad</h1>
          <nav className="flex gap-3">
            <Link href="/modules/seguridad">Usuarios</Link>
            <Link href="/modules/seguridad/permissions">Permisos</Link>
            <Link href="/modules/seguridad/sessions">Sesiones</Link>
            <Link href="/modules/seguridad/auditoria">Auditoría</Link>
          </nav>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}
