'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Usuario {
  id_usuario: number
  nombres: string
  apellidos: string
  nombre_usuario: string
  email: string
  telefono: string
  rol_nombre: string | null
  estado_nombre: string
  ultima_conexion: string | null
}

interface FormData {
  nombres: string
  apellidos: string
  telefono: string
  nombre_usuario: string
  email: string
  password: string
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    nombres: '',
    apellidos: '',
    telefono: '',
    nombre_usuario: '',
    email: '',
    password: ''
  })

  useEffect(() => {
    cargarUsuarios()
  }, [])

  async function cargarUsuarios() {
    try {
      setLoading(true)
      setErrorMsg(null)

      const res = await fetch('/api/seguridad/users')
      const payload = await res.json()
      
      console.log('Respuesta de usuarios:', { status: res.status, payload })
      
      if (!res.ok || !payload.success) {
        const errorMsg = payload.error || `Error ${res.status}`
        throw new Error(errorMsg)
      }

      setUsuarios(payload.users || [])
    } catch (err: any) {
      const msg = err?.message || String(err) || 'Error desconocido'
      console.error('Error cargando usuarios:', msg)
      setErrorMsg(`Error: ${msg}`)
    } finally {
      setLoading(false)
    }
  }

  async function crearUsuario(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.nombres || !formData.apellidos || !formData.email || !formData.password) {
      alert('Por favor complete todos los campos obligatorios')
      return
    }

    try {
      setGuardando(true)
      const resp = await fetch('/api/seguridad/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const payload = await resp.json()
      if (!payload.success) throw new Error(payload.error || 'Error al crear usuario')

      alert('Usuario creado exitosamente')
      setModalAbierto(false)
      setFormData({
        nombres: '',
        apellidos: '',
        telefono: '',
        nombre_usuario: '',
        email: '',
        password: ''
      })
      cargarUsuarios()
    } catch (err: any) {
      console.error('Error creando usuario:', err)
      alert('Error al crear usuario: ' + (err.message || 'Error desconocido'))
    } finally {
      setGuardando(false)
    }
  }

  function formatearFecha(fecha: string | null): string {
    if (!fecha) return 'Nunca'
    const d = new Date(fecha)
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Administración de Usuarios</h1>
            <p className="text-gray-600 mt-1">Gestiona los usuarios del sistema de seguridad</p>
          </div>
          <button
            onClick={() => setModalAbierto(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-semibold flex items-center gap-2"
          >
            <span>➕</span> Nuevo Usuario
          </button>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Cargando usuarios...
            </div>
          ) : errorMsg ? (
            <div className="p-8 text-center text-red-600 font-semibold">
              {errorMsg}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Nombres</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Email</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Rol</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Estado</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Última Conexión</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id_usuario} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">
                          {usuario.nombres} {usuario.apellidos}
                        </div>
                        <div className="text-sm text-gray-500">@{usuario.nombre_usuario}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{usuario.email}</td>
                      <td className="p-4">
                        {usuario.rol_nombre ? (
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                            {usuario.rol_nombre}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm">Sin rol</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            usuario.estado_nombre === 'Activo'
                              ? 'bg-green-100 text-green-700'
                              : usuario.estado_nombre === 'Inactivo'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {usuario.estado_nombre}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">
                        {formatearFecha(usuario.ultima_conexion)}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/modules/seguridad/usuarios/${usuario.id_usuario}`}
                          className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm"
                        >
                          Ver Detalle →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para Crear Usuario */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-slate-900">Crear Nuevo Usuario</h2>
              <p className="text-sm text-gray-600 mt-1">Complete la información del usuario</p>
            </div>

            <form onSubmit={crearUsuario} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombres}
                    onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Juan Carlos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.apellidos}
                    onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Ej: Pérez García"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="usuario@ejemplo.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="999888777"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombre de Usuario
                  </label>
                  <input
                    type="text"
                    value={formData.nombre_usuario}
                    onChange={(e) => setFormData({ ...formData, nombre_usuario: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Se genera automáticamente si está vacío"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Mínimo 8 caracteres"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setModalAbierto(false)
                    setFormData({
                      nombres: '',
                      apellidos: '',
                      telefono: '',
                      nombre_usuario: '',
                      email: '',
                      password: ''
                    })
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 font-semibold"
                >
                  {guardando ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
