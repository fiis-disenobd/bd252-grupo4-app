'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface DashboardStats {
  totalUsuarios: number
  usuariosActivos: number
  usuariosInactivos: number
  sesionesActivas: number
  totalRoles: number
  totalPermisos: number
}

export default function SeguridadDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsuarios: 0,
    usuariosActivos: 0,
    usuariosInactivos: 0,
    sesionesActivas: 0,
    totalRoles: 0,
    totalPermisos: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarEstadisticas()
  }, [])

  async function cargarEstadisticas() {
    try {
      setLoading(true)
      const res = await fetch('/api/seguridad/stats')
      const payload = await res.json()
      
      if (!payload.success) throw new Error(payload.error || 'Error al obtener estadísticas')
      
      setStats(payload.stats)
    } catch (err) {
      console.error('Error cargando estadísticas:', err)
    } finally {
      setLoading(false)
    }
  }

  function calcularTiempoDesde(fecha: string | null): string {
    if (!fecha) return 'Nunca'
    const ahora = new Date()
    const entonces = new Date(fecha)
    const diffMs = ahora.getTime() - entonces.getTime()
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
    
    if (diffHoras < 1) return 'Hace menos de 1 hora'
    if (diffHoras === 1) return 'Hace 1 hora'
    if (diffHoras < 24) return `Hace ${diffHoras} horas`
    const diffDias = Math.floor(diffHoras / 24)
    return `Hace ${diffDias} día${diffDias > 1 ? 's' : ''}`
  }

  const secciones = [
    {
      titulo: 'Administración de Usuarios',
      icono: '👤',
      descripcion: 'Ver, crear y gestionar usuarios del sistema',
      ruta: '/modules/seguridad/usuarios',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      titulo: 'Roles y Permisos',
      icono: '🎫',
      descripcion: 'Gestionar permisos y roles de acceso',
      ruta: '/modules/seguridad/permissions',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      titulo: 'Sesiones Activas',
      icono: '🛑',
      descripcion: 'Monitorear y revocar sesiones abiertas',
      ruta: '/modules/seguridad/sessions',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      titulo: 'Auditoría del Sistema',
      icono: '📜',
      descripcion: 'Ver historial de cambios y batch automático',
      ruta: '/modules/seguridad/auditoria',
      color: 'bg-amber-50 border-amber-200 hover:bg-amber-100'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-500">Cargando estadísticas...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Módulo de Seguridad</h1>
          <p className="text-gray-600 mt-2">Panel centralizado de control de acceso y usuarios</p>
        </div>

        {/* KPIs - Tarjetas de Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-3xl font-bold text-slate-900">{stats.totalUsuarios}</div>
            <div className="text-sm text-gray-600 mt-1">Usuarios Totales</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-3xl font-bold text-green-600">{stats.usuariosActivos}</div>
            <div className="text-sm text-gray-600 mt-1">Activos</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-2">🔴</div>
            <div className="text-3xl font-bold text-red-600">{stats.usuariosInactivos}</div>
            <div className="text-sm text-gray-600 mt-1">Inactivos</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-2">🛑</div>
            <div className="text-3xl font-bold text-indigo-600">{stats.sesionesActivas}</div>
            <div className="text-sm text-gray-600 mt-1">Sesiones Activas</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-2">🎫</div>
            <div className="text-3xl font-bold text-purple-600">{stats.totalRoles}</div>
            <div className="text-sm text-gray-600 mt-1">Roles Definidos</div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-3xl mb-2">🔐</div>
            <div className="text-3xl font-bold text-blue-600">{stats.totalPermisos}</div>
            <div className="text-sm text-gray-600 mt-1">Permisos Totales</div>
          </div>
        </div>

        {/* Información del Batch - Destacada */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-6 rounded-lg shadow-sm mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">⏰</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-amber-900 mb-2">
                Proceso Batch - Suspensión Automática por Inactividad
              </h3>
              <p className="text-sm text-amber-700 mt-3">
                💡 El sistema verifica automáticamente usuarios sin actividad mayor a 60 días y los suspende por seguridad. 
                Se ejecuta diariamente a las 00:00 (medianoche).
              </p>
              <p className="text-xs text-amber-600 mt-2">
                Para ver el historial de suspensiones, consulta la sección de Auditoría.
              </p>
            </div>
          </div>
        </div>

        {/* Secciones Principales - Navegables */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Secciones del Módulo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {secciones.map((seccion, idx) => (
              <Link
                key={idx}
                href={seccion.ruta}
                className={`block p-6 rounded-lg border-2 shadow-sm transition-all hover:shadow-md hover:scale-[1.02] ${seccion.color}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-5xl">{seccion.icono}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{seccion.titulo}</h3>
                    <p className="text-sm text-gray-700">{seccion.descripcion}</p>
                    <div className="mt-3 text-sm font-semibold text-indigo-600 flex items-center gap-1">
                      Acceder →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Botón de Actualizar */}
        <div className="mt-8 text-center">
          <button
            onClick={cargarEstadisticas}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-semibold"
          >
            ↻ Actualizar Estadísticas
          </button>
        </div>
      </div>
    </div>
  )
}
