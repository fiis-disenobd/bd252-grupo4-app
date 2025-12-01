"use client";
import React, { useEffect, useState } from 'react';

type User = any;

export default function Page() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nombres: '', apellidos: '', telefono: '', nombre_usuario: '', email: '', password: '' });

  async function fetchUsers() {
    setLoading(true);
    const r = await fetch('/api/seguridad/users');
    const j = await r.json();
    if (j.success) setUsers(j.users);
    else alert('Error: ' + (j.error || '')); 
    setLoading(false);
  }

  useEffect(() => { fetchUsers(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch('/api/seguridad/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const j = await r.json();
    if (j.success) { setForm({ nombres:'', apellidos:'', telefono:'', nombre_usuario:'', email:'', password:'' }); fetchUsers(); }
    else alert('Error: ' + (j.error || ''));
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Usuarios</h2>
        <p className="text-sm text-gray-600">Lista de usuarios y operaciones básicas</p>
      </div>

      <section className="mb-6 bg-white p-4 rounded shadow-sm">
        <h3 className="font-medium mb-3">Registrar usuario</h3>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input placeholder="Nombres" value={form.nombres} onChange={e => setForm({...form, nombres: e.target.value})} className="p-2 border rounded" />
          <input placeholder="Apellidos" value={form.apellidos} onChange={e => setForm({...form, apellidos: e.target.value})} className="p-2 border rounded" />
          <input placeholder="Teléfono" value={form.telefono} onChange={e => setForm({...form, telefono: e.target.value})} className="p-2 border rounded" />
          <input placeholder="Nombre de usuario" value={form.nombre_usuario} onChange={e => setForm({...form, nombre_usuario: e.target.value})} className="p-2 border rounded" />
          <input placeholder="Email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="p-2 border rounded" />
          <input placeholder="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="p-2 border rounded" />
          <div className="md:col-span-3">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded" type="submit">Registrar</button>
          </div>
        </form>
      </section>

      <section className="bg-white p-4 rounded shadow-sm">
        <h3 className="font-medium mb-3">Listado de usuarios</h3>
        {loading ? <div>Cargando...</div> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-gray-500">
              <tr><th>Usuario</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id_usuario} className="border-t">
                  <td className="py-2">{u.nombre_usuario}</td>
                  <td>{u.nombres} {u.apellidos}</td>
                  <td>{u.email}</td>
                  <td>{u.rol ?? '-'}</td>
                  <td>{u.estado ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
