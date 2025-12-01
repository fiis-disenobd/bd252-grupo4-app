"use client";
import React, { useEffect, useState } from 'react';

export default function AuditoriaPage(){
  const [rows, setRows] = useState<any[]>([]);

  async function fetchRows(){
    const r = await fetch('/api/seguridad/auditoria'); const j = await r.json();
    if (j.success) setRows(j.auditoria || []);
  }

  useEffect(()=>{ fetchRows(); }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Registro de Auditoría</h2>
      <div className="bg-white p-4 rounded">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-gray-500"><tr><th>Fecha</th><th>Usuario</th><th>Tabla</th><th>Operación</th><th>Antes</th><th>Después</th><th>IP</th></tr></thead>
          <tbody>
            {rows.map(a=> (
              <tr key={a.id_auditoria} className="border-t align-top">
                <td className="align-top">{new Date(a.fecha).toLocaleString()}</td>
                <td className="align-top">{a.nombre_usuario ?? '-'}</td>
                <td className="align-top">{a.tabla_afectada}</td>
                <td className="align-top">{a.operacion}</td>
                <td className="align-top"><pre className="text-xs">{a.valor_antiguo}</pre></td>
                <td className="align-top"><pre className="text-xs">{a.valor_nuevo}</pre></td>
                <td className="align-top">{a.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <button onClick={fetchRows} className="px-4 py-2 bg-indigo-600 text-white rounded">Refrescar</button>
      </div>
    </div>
  );
}
