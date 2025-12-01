"use client";
import React, { useEffect, useState } from 'react';

export default function PermissionsPage() {
  const [permisos, setPermisos] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [sel, setSel] = useState({ id_rol: 0, id_permiso: 0 });

  async function fetchAll(){
    const [pRes, rRes] = await Promise.all([fetch('/api/seguridad/permissions'), fetch('/api/seguridad/roles')]);
    const pj = await pRes.json(); const rj = await rRes.json();
    if (pj.success) setPermisos(pj.permisos || []);
    if (rj.success) setRoles(rj.roles || []);
  }

  useEffect(()=>{ fetchAll(); }, []);

  async function assign(){
    await fetch('/api/seguridad/permissions', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(sel) });
    fetchAll();
  }

  async function revoke(){
    await fetch('/api/seguridad/permissions', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify(sel) });
    fetchAll();
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Catálogo de Permisos</h2>
      <div className="bg-white p-4 rounded mb-6">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-gray-500"><tr><th>Permiso</th><th>Acción</th><th>Módulo</th></tr></thead>
          <tbody>
            {permisos.map(p=> (
              <tr key={p.id_permiso} className="border-t"><td>{p.permiso}</td><td>{p.accion}</td><td>{p.modulo}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-4 rounded">
        <h3 className="font-medium mb-2">Asignar / Revocar permiso</h3>
        <div className="flex gap-2 items-center">
          <select onChange={e=>setSel({...sel, id_rol: Number(e.target.value)})} className="p-2 border rounded">
            <option value={0}>Seleccionar rol</option>
            {roles.map(r=> <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>)}
          </select>
          <select onChange={e=>setSel({...sel, id_permiso: Number(e.target.value)})} className="p-2 border rounded">
            <option value={0}>Seleccionar permiso</option>
            {permisos.map(p=> <option key={p.id_permiso} value={p.id_permiso}>{p.permiso} — {p.modulo}</option>)}
          </select>
          <button onClick={assign} className="px-3 py-1 bg-green-600 text-white rounded">Asignar</button>
          <button onClick={revoke} className="px-3 py-1 bg-red-600 text-white rounded">Revocar</button>
        </div>
      </div>
    </div>
  );
}
