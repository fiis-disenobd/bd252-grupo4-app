'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

interface Usuario {
  id_usuario: number
  nombres: string
  apellidos: string
  nombre_usuario: string
  email: string
  telefono: string
  id_estado: number
  estado_nombre: string
  rol_nombre: string | null
}

interface Rol {
  id_rol: number
  nombre: string
  descripcion: string
}

export default function DetalleUsuarioPage() {
  const router = useRouter()
  const params = useParams()
  const usuarioId = useMemo(() => {
    const raw = Array.isArray(params?.id) ? params.id[0] : params?.id
    const num = raw ? Number(raw) : NaN
    return num
  }, [params])

  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([])
  const [rolesAsignados, setRolesAsignados] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [asignando, setAsignando] = useState(false)

  useEffect(() => {
    if (!Number.isFinite(usuarioId)) {
      setError('ID de usuario inválido')
      setLoading(false)
      return
    }
    cargarDatos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuarioId])

  async function cargarDatos() {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/seguridad/users/${usuarioId}`)
      const payload = await res.json()

      if (!res.ok || !payload.success) {
        throw new Error(payload.error || 'Error al cargar usuario')
      }

      setUsuario(payload.usuario)
      setRolesDisponibles(payload.rolesDisponibles || [])

      // Si tiene rol, buscar su ID en rolesDisponibles
      if (payload.usuario.rol_nombre) {
        const rolEncontrado = payload.rolesDisponibles?.find(
          (r: Rol) => r.nombre === payload.usuario.rol_nombre
        )
        if (rolEncontrado) {
          setRolesAsignados([rolEncontrado.id_rol])
        }
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  async function asignarRol(idRol: number) {
    if (rolesAsignados.includes(idRol)) {
      // Si ya está asignado, remover
      return removerRol(idRol)
    }

    try {
      setAsignando(true)
      const res = await fetch(`/api/seguridad/users/${usuarioId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idRol })
      })

      const payload = await res.json()
      if (!res.ok || !payload.success) {
        const mensaje = payload.error || payload.mensaje || 'Error al asignar rol'
        throw new Error(mensaje)
      }

      setRolesAsignados([...rolesAsignados, idRol])
      alert('Rol asignado exitosamente')
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error desconocido'))
    } finally {
      setAsignando(false)
    }
  }

  async function removerRol(idRol: number) {
    if (!confirm('¿Está seguro de revocar este rol?')) return

    try {
      setAsignando(true)
      const res = await fetch(`/api/seguridad/users/${usuarioId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idRol })
      })

      const payload = await res.json()
      if (!res.ok || !payload.success) {
        const mensaje = payload.error || payload.mensaje || 'Error al remover rol'
        throw new Error(mensaje)
      }

      setRolesAsignados(rolesAsignados.filter(id => id !== idRol))
      alert('Rol removido exitosamente')
    } catch (err: any) {
      alert('Error: ' + (err.message || 'Error desconocido'))
    } finally {
      setAsignando(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-600 text-lg">Cargando usuario...</div>
      </div>
    )
  }

  if (error || !usuario) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <h2 className="text-red-800 font-bold text-lg">{error || 'Usuario no encontrado'}</h2>
            <Link
              href="/modules/seguridad/usuarios"
              className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Volver a Usuarios
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/modules/seguridad/usuarios"
            className="text-indigo-600 hover:text-indigo-800 font-semibold mb-4 inline-block"
          >
            ← Volver a Usuarios
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-2">
            {usuario.nombres} {usuario.apellidos}
          </h1>
          <p className="text-gray-600 mt-1">@{usuario.nombre_usuario}</p>
        </div>

        {/* Información del Usuario */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Información del Usuario</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nombres</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900">
                {usuario.nombres}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Apellidos</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900">
                {usuario.apellidos}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900">
                {usuario.email}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900">
                {usuario.telefono || 'No especificado'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
              <div className="px-4 py-2 rounded-lg border border-gray-200 text-gray-900">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    usuario.estado_nombre === 'ACTIVO'
                      ? 'bg-green-100 text-green-700'
                      : usuario.estado_nombre === 'INACTIVO'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {usuario.estado_nombre}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol Actual</label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-gray-900">
                {usuario.rol_nombre ? (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                    {usuario.rol_nombre}
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">Sin rol asignado</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Asignación de Roles */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Asignar Roles</h2>
          
          {rolesDisponibles.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No hay roles disponibles
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rolesDisponibles.map((rol) => (
                <div
                  key={rol.id_rol}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    rolesAsignados.includes(rol.id_rol)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                  onClick={() => asignarRol(rol.id_rol)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={rolesAsignados.includes(rol.id_rol)}
                      onChange={() => {}}
                      disabled={asignando}
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{rol.nombre}</h3>
                      {rol.descripcion && (
                        <p className="text-sm text-gray-600 mt-1">{rol.descripcion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
