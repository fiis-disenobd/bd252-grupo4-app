'use client'

import { useEffect, useState } from 'react'

interface Sesion {
  id_sesion: number
  id_usuario: number
  nombre_usuario: string
  email: string
  ip_address: string
  user_agent: string
  fecha_inicio: string
  fecha_fin: string | null
  revocada: boolean
}

export default function SessionsPage() {
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [loading, setLoading] = useState(true)
  const [revocando, setRevocando] = useState<number | null>(null)
  const [ejecutandoBatch, setEjecutandoBatch] = useState(false)

  useEffect(() => {
    cargarSesionesActivas()

    // Auto-refresh cada 30 segundos para mostrar sesiones en tiempo real
    const interval = setInterval(cargarSesionesActivas, 30000)
    return () => clearInterval(interval)
  }, [])

  async function cargarSesionesActivas() {
    try {
      setLoading(true)
      const res = await fetch('/api/seguridad/sessions')
      const data = await res.json()

      if (res.ok && data.success) {
        setSesiones(data.sesiones || [])
      }
    } catch (err) {
      console.error('Error cargando sesiones:', err)
    } finally {
      setLoading(false)
    }
  }

  async function revocarSesion(id_sesion: number) {
    if (!confirm('¿Está seguro de revocar esta sesión? El usuario deberá iniciar sesión nuevamente.')) {
      return
    }

    try {
      setRevocando(id_sesion)
      const res = await fetch('/api/seguridad/sessions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_sesion })
      })

      const data = await res.json()
      if (res.ok && data.success) {
        alert('Sesión revocada exitosamente')
        await cargarSesionesActivas()
      } else {
        alert(data.error || 'Error al revocar sesión')
      }
    } catch (err: any) {
      console.error('Error revocando sesión:', err)
      alert('Error al revocar sesión: ' + (err.message || 'Error desconocido'))
    } finally {
      setRevocando(null)
    }
  }

  async function ejecutarBatch() {
    if (!confirm('¿Ejecutar proceso batch de desactivación de usuarios inactivos?\n\nSe desactivarán usuarios sin actividad en los últimos 60 días.')) {
      return
    }

    try {
      setEjecutandoBatch(true)
      const res = await fetch('/api/seguridad/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()
      if (res.ok && data.success) {
        alert('✅ Proceso batch ejecutado exitosamente\n\n' + (data.mensaje || 'Usuarios inactivos desactivados'))
        await cargarSesionesActivas()
      } else {
        alert('❌ ' + (data.error || 'Error al ejecutar batch'))
      }
    } catch (err: any) {
      console.error('Error ejecutando batch:', err)
      alert('Error: ' + (err.message || 'Error desconocido'))
    } finally {
      setEjecutandoBatch(false)
    }
  }

  function formatearFecha(fecha: string): string {
    const d = new Date(fecha)
    return d.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  function extraerNavegador(userAgent: string): string {
    if (userAgent.includes('Chrome')) return '🌐 Chrome'
    if (userAgent.includes('Firefox')) return '🦊 Firefox'
    if (userAgent.includes('Safari')) return '🧭 Safari'
    if (userAgent.includes('Edge')) return '🔷 Edge'
    return '🖥️ Otro'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Sesiones Activas</h1>
            <p className="text-gray-600 mt-1">
              Monitoreo en tiempo real de usuarios conectados • Actualización cada 30s
            </p>
          </div>
          <button
            onClick={cargarSesionesActivas}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-semibold"
          >
            ↻ Actualizar Ahora
          </button>
          <button
            onClick={ejecutarBatch}
            disabled={ejecutandoBatch}
            className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all shadow-sm font-semibold disabled:bg-gray-400 ml-3"
          >
            {ejecutandoBatch ? '⚙️ Procesando...' : '⚡ Ejecutar Batch'}
          </button>
        </div>

        {/* Contador de Sesiones */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🟢</div>
            <div>
              <span className="text-lg font-bold text-green-900">
                {sesiones.length} sesión{sesiones.length !== 1 ? 'es' : ''} activa{sesiones.length !== 1 ? 's' : ''}
              </span>
              <p className="text-sm text-green-700">
                Usuarios conectados en este momento
              </p>
            </div>
          </div>
        </div>

        {/* Tabla de Sesiones */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Cargando sesiones activas...
            </div>
          ) : sesiones.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay sesiones activas en este momento
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Usuario</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Dirección IP</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Navegador</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Hora de Inicio</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {sesiones.map((sesion) => (
                    <tr key={sesion.id_sesion} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-4">
                        <div className="font-medium text-slate-900">
                          @{sesion.nombre_usuario}
                        </div>
                        <div className="text-sm text-gray-500">{sesion.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-sm bg-blue-50 px-3 py-1 rounded text-blue-700">
                          {sesion.ip_address}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm">{extraerNavegador(sesion.user_agent)}</span>
                        <div className="text-xs text-gray-500 truncate max-w-xs" title={sesion.user_agent}>
                          {sesion.user_agent.substring(0, 50)}...
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-700">
                        {formatearFecha(sesion.fecha_inicio)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => revocarSesion(sesion.id_sesion)}
                          disabled={revocando === sesion.id_sesion}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400 text-sm font-semibold transition-all"
                        >
                          {revocando === sesion.id_sesion ? 'Revocando...' : '🚫 Revocar Sesión'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            ℹ️ <strong>Nota:</strong> Revocar una sesión cerrará la sesión del usuario inmediatamente. 
            El usuario deberá volver a iniciar sesión para acceder al sistema.
          </p>
        </div>
      </div>
    </div>
  )
}

