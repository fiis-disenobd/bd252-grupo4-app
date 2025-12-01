"use client";
import React, { useEffect, useState } from 'react';

export default function SessionsPage(){
  const [sessions, setSessions] = useState<any[]>([]);

  async function fetchSessions(){
    const r = await fetch('/api/seguridad/sessions'); const j = await r.json();
    if (j.success) setSessions(j.sessions || []);
  }

  useEffect(()=>{ fetchSessions(); }, []);

  async function revoke(id: number){
    await fetch('/api/seguridad/sessions', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id_sesion: id }) });
    fetchSessions();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Sesiones activas</h2>
      <div className="bg-white p-4 rounded">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-gray-500"><tr><th>Usuario</th><th>Email</th><th>Inicio</th><th>IP</th><th>User Agent</th><th>Acción</th></tr></thead>
          <tbody>
            {sessions.map(s=> (
              <tr key={s.id_sesion} className="border-t">
                <td>{s.nombre_usuario}</td>
                <td>{s.email}</td>
                <td>{new Date(s.fecha_inicio).toLocaleString()}</td>
                <td>{s.ip}</td>
                <td className="max-w-xl truncate">{s.user_agent}</td>
                <td><button onClick={()=>revoke(s.id_sesion)} className="px-2 py-1 bg-red-600 text-white rounded">Revocar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
