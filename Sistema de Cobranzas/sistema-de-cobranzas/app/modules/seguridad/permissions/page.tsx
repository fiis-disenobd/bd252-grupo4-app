'use client'

import { useEffect, useState } from 'react'

interface Permiso {
  id_permiso: number
  nombre: string
  descripcion: string
  id_accion: number
  accion_nombre: string
  id_modulo: number
  modulo_nombre: string
}

interface Rol {
  id_rol: number
  nombre: string
  descripcion?: string
  permisos?: any[]
  usuariosCount?: number
}

interface PermisoAsignado {
  id_permiso: number
  nombre: string
}

export default function PermissionsPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [rolSeleccionado, setRolSeleccionado] = useState<number | null>(null)
  const [permisosActuales, setPermisosActuales] = useState<PermisoAsignado[]>([])
  const [permisosDisponibles, setPermisosDisponibles] = useState<Permiso[]>([])
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)

  useEffect(() => {
    cargarRoles()
    cargarPermisos()
  }, [])

  async function cargarRoles() {
    try {
      const res = await fetch('/api/seguridad/roles')
      const data = await res.json()
      if (res.ok && data.success) {
        setRoles(data.roles || [])
      }
    } catch (err) {
      console.error('Error cargando roles:', err)
    }
  }

  async function cargarPermisos() {
    try {
      const res = await fetch('/api/seguridad/permissions')
      const data = await res.json()
      if (res.ok && data.success) {
        setPermisosDisponibles(data.permisos || [])
      }
    } catch (err) {
      console.error('Error cargando permisos:', err)
    } finally {
      setLoading(false)
    }
  }

  async function cargarPermisosDelRol() {
    if (!rolSeleccionado) return

    try {
      setProcesando(true)
      
      // Cargar roles completos para obtener permisos del rol
      const resRoles = await fetch('/api/seguridad/roles')
      const dataRoles = await resRoles.json()
      
      // Cargar todos los permisos disponibles
      const resPermisos = await fetch('/api/seguridad/permissions')
      const dataPermisos = await resPermisos.json()
      
      if (resRoles.ok && dataRoles.success && resPermisos.ok && dataPermisos.success) {
        const rolActual = (dataRoles.roles || []).find((r: Rol) => r.id_rol === rolSeleccionado)
        const todosPermisos = dataPermisos.permisos || []
        
        // Obtener IDs de permisos asignados al rol
        const idsAsignados = new Set((rolActual?.permisos || []).map((p: any) => p.id_permiso))
        
        // Separar permisos asignados y disponibles
        const asignados = todosPermisos.filter((p: Permiso) => idsAsignados.has(p.id_permiso))
        const disponibles = todosPermisos.filter((p: Permiso) => !idsAsignados.has(p.id_permiso))
        
        setPermisosActuales(asignados)
        setPermisosDisponibles(disponibles)
      }
    } catch (err) {
      console.error('Error cargando permisos del rol:', err)
    } finally {
      setProcesando(false)
    }
  }

  async function asignarPermiso(idPermiso: number) {
    if (!rolSeleccionado) {
      alert('Seleccione un rol primero')
      return
    }

    try {
      setProcesando(true)
      const res = await fetch('/api/seguridad/permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_rol: rolSeleccionado, id_permiso: idPermiso })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        alert('Permiso asignado exitosamente')
        await cargarPermisosDelRol()
      } else {
        alert(data.error || 'Error al asignar permiso')
      }
    } catch (err) {
      console.error('Error asignando permiso:', err)
      alert('Error al asignar permiso')
    } finally {
      setProcesando(false)
    }
  }

  async function revocarPermiso(idPermiso: number) {
    if (!rolSeleccionado) return
    if (!confirm('¿Está seguro de revocar este permiso?')) return

    try {
      setProcesando(true)
      const res = await fetch('/api/seguridad/permissions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_rol: rolSeleccionado, id_permiso: idPermiso })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        alert('Permiso revocado exitosamente')
        await cargarPermisosDelRol()
      } else {
        alert(data.error || 'Error al revocar permiso')
      }
    } catch (err) {
      console.error('Error revocando permiso:', err)
      alert('Error al revocar permiso')
    } finally {
      setProcesando(false)
    }
  }

  useEffect(() => {
    if (rolSeleccionado) {
      cargarPermisosDelRol()
    }
  }, [rolSeleccionado])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-500">Cargando roles...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Gestión de Roles y Permisos</h1>
          <p className="text-gray-600 mt-1">Asigne o revoque permisos por rol del sistema</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Seleccione un Rol para gestionar sus permisos:
          </label>
          <select
            value={rolSeleccionado || ''}
            onChange={(e) => setRolSeleccionado(parseInt(e.target.value))}
            className="w-full md:w-1/2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-lg"
          >
            <option value="">-- Seleccione un Rol --</option>
            {roles.map((rol) => (
              <option key={rol.id_rol} value={rol.id_rol}>
                {rol.nombre}
              </option>
            ))}
          </select>
        </div>

        {rolSeleccionado && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border-2 border-purple-300 p-6">
              <h2 className="text-xl font-bold text-purple-900 mb-4">
                ✅ Permisos Actuales ({permisosActuales.length})
              </h2>
              
              {procesando ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : permisosActuales.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Este rol no tiene permisos asignados
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {permisosActuales.map((permiso) => (
                    <div
                      key={permiso.id_permiso}
                      className="flex items-center justify-between bg-purple-50 p-3 rounded border border-purple-200"
                    >
                      <div>
                        <span className="font-medium text-slate-900">{permiso.nombre}</span>
                        <p className="text-xs text-gray-600">
                          {(permiso as any).modulo_nombre || (permiso as any).descripcion}
                        </p>
                      </div>
                      <button
                        onClick={() => revocarPermiso(permiso.id_permiso)}
                        disabled={procesando}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm font-semibold disabled:bg-gray-400"
                      >
                        🗑️ Revocar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm border-2 border-green-300 p-6">
              <h2 className="text-xl font-bold text-green-900 mb-4">
                ➕ Permisos Disponibles ({permisosDisponibles.length})
              </h2>

              {procesando ? (
                <div className="text-center py-8 text-gray-500">Cargando...</div>
              ) : permisosDisponibles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay permisos disponibles para asignar
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {permisosDisponibles.map((permiso) => (
                    <div
                      key={permiso.id_permiso}
                      className="flex items-center justify-between bg-green-50 p-3 rounded border border-green-200"
                    >
                      <div className="flex-1">
                        <span className="font-medium text-slate-900">{permiso.nombre}</span>
                        <p className="text-xs text-gray-600">
                          {permiso.modulo_nombre} - {permiso.accion_nombre}
                        </p>
                      </div>
                      <button
                        onClick={() => asignarPermiso(permiso.id_permiso)}
                        disabled={procesando}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm font-semibold disabled:bg-gray-400"
                      >
                        ➕ Asignar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

