'use client'

import { useEffect, useState } from 'react'

interface RegistroAuditoria {
  id_auditoria: number
  fecha: string
  usuario_nombre: string | null
  tabla_afectada: string
  operacion: string
  valor_antiguo: string | null
  valor_nuevo: string | null
  ip: string
  esBatch: boolean
}

export default function AuditoriaPage() {
  const [registros, setRegistros] = useState<RegistroAuditoria[]>([])
  const [filtroOperacion, setFiltroOperacion] = useState<string>('TODOS')
  const [filtroTabla, setFiltroTabla] = useState<string>('TODOS')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarAuditoria()
  }, [])

  async function cargarAuditoria() {
    try {
      setLoading(true)
      const res = await fetch('/api/seguridad/auditoria')
      const data = await res.json()

      if (res.ok && data.success) {
        const registrosFormateados = (data.auditoria || []).map((a: any) => ({
          id_auditoria: a.id_auditoria,
          fecha: a.fecha,
          usuario_nombre: a.usuario_nombre || null,
          tabla_afectada: a.tabla_afectada,
          operacion: a.operacion,
          valor_antiguo: a.valor_antiguo,
          valor_nuevo: a.valor_nuevo,
          ip: a.ip,
          esBatch: a.operacion === 'BATCH_UPDATE'
        }))

        setRegistros(registrosFormateados)
      }
    } catch (err) {
      console.error('Error cargando auditoría:', err)
    } finally {
      setLoading(false)
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

  const registrosFiltrados = registros.filter((r) => {
    const matchOperacion = filtroOperacion === 'TODOS' || r.operacion === filtroOperacion
    const matchTabla = filtroTabla === 'TODOS' || r.tabla_afectada === filtroTabla
    return matchOperacion && matchTabla
  })

  // Obtener listas únicas para filtros
  const operacionesUnicas = Array.from(new Set(registros.map((r) => r.operacion)))
  const tablasUnicas = Array.from(new Set(registros.map((r) => r.tabla_afectada)))

  // Contar registros de batch
  const totalBatch = registros.filter((r) => r.esBatch).length

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Auditoría del Sistema</h1>
            <p className="text-gray-600 mt-1">
              Historial completo de cambios • Acciones humanas y batch automático
            </p>
          </div>
          <button
            onClick={cargarAuditoria}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-sm font-semibold"
          >
            ↻ Actualizar
          </button>
        </div>

        {/* Estadística de Batch */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center gap-3">
            <div className="text-3xl">⚡</div>
            <div>
              <span className="text-lg font-bold text-amber-900">
                {totalBatch} operacion{totalBatch !== 1 ? 'es' : ''} de batch automático
              </span>
              <p className="text-sm text-amber-700">
                Suspensiones automáticas por inactividad registradas
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Por Operación:
              </label>
              <select
                value={filtroOperacion}
                onChange={(e) => setFiltroOperacion(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TODOS">Todas las Operaciones</option>
                {operacionesUnicas.map((op) => (
                  <option key={op} value={op}>
                    {op}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Por Tabla:
              </label>
              <select
                value={filtroTabla}
                onChange={(e) => setFiltroTabla(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TODOS">Todas las Tablas</option>
                {tablasUnicas.map((tabla) => (
                  <option key={tabla} value={tabla}>
                    {tabla}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabla de Auditoría */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              Cargando registros de auditoría...
            </div>
          ) : registrosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No hay registros que coincidan con los filtros
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Fecha</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Usuario</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Operación</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Tabla</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Valor Antiguo</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">Valor Nuevo</th>
                    <th className="text-left p-4 text-sm font-semibold text-gray-700">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.map((registro) => (
                    <tr
                      key={registro.id_auditoria}
                      className={`border-b border-gray-100 ${
                        registro.esBatch
                          ? 'bg-amber-50 hover:bg-amber-100'
                          : 'bg-white hover:bg-blue-50'
                      }`}
                    >
                      <td className="p-4 text-gray-700">
                        {formatearFecha(registro.fecha)}
                      </td>
                      <td className="p-4">
                        {registro.esBatch ? (
                          <span className="px-3 py-1 bg-orange-500 text-white rounded-full text-xs font-bold">
                            🤖 SISTEMA BATCH
                          </span>
                        ) : (
                          <span className="font-medium text-blue-900">
                            {registro.usuario_nombre || 'Sistema'}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            registro.operacion === 'INSERT'
                              ? 'bg-green-100 text-green-700'
                              : registro.operacion === 'UPDATE'
                              ? 'bg-yellow-100 text-yellow-700'
                              : registro.operacion === 'DELETE'
                              ? 'bg-red-100 text-red-700'
                              : registro.operacion === 'BATCH_UPDATE'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {registro.operacion}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-gray-700">
                        {registro.tabla_afectada}
                      </td>
                      <td className="p-4">
                        {registro.valor_antiguo ? (
                          <pre className="text-xs bg-gray-100 p-2 rounded max-w-xs overflow-auto">
                            {registro.valor_antiguo}
                          </pre>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        {registro.valor_nuevo ? (
                          <pre className="text-xs bg-gray-100 p-2 rounded max-w-xs overflow-auto">
                            {registro.valor_nuevo}
                          </pre>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-600">
                        {registro.ip || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Leyenda */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">Leyenda de Colores:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
              <span className="text-blue-900">Acciones Humanas (usuarios del sistema)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-50 border border-amber-200 rounded"></div>
              <span className="text-amber-900">Operaciones Batch (automáticas por el sistema)</span>
            </div>
          </div>
        </div>

        {/* Info adicional */}
        <div className="mt-4 text-center text-sm text-gray-600">
          Mostrando {registrosFiltrados.length} de {registros.length} registros totales (últimos 200)
        </div>
      </div>
    </div>
  )
}

