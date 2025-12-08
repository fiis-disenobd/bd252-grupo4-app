'use client'

import { useState } from 'react'

interface Summary {
  usuariosCreados: number
  rolesAsignados: number
  yaExistentes: number
  totalProcesados: number
  detalles: string[]
}

export default function AssignAdminRolePage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; summary?: Summary; error?: string } | null>(null)

  async function assignRoles() {
    try {
      setLoading(true)
      setResult(null)

      const res = await fetch('/api/admin/assign-admin-role', {
        method: 'POST'
      })

      const data = await res.json()
      setResult(data)
    } catch (err) {
      console.error('Error:', err)
      setResult({ success: false, error: 'Error al asignar roles' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Asignar Rol Administrador</h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-gray-700 mb-6">
            Este proceso asignará el rol de <strong>administrador</strong> a todos los usuarios del sistema auth que no lo tengan.
          </p>

          <button
            onClick={assignRoles}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400"
          >
            {loading ? '⏳ Procesando...' : '▶️ Ejecutar Asignación'}
          </button>

          {result && (
            <div className={`mt-8 p-6 rounded-lg ${result.success ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
              <h2 className={`text-xl font-bold mb-4 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                {result.success ? '✅ Éxito' : '❌ Error'}
              </h2>

              {result.success && result.summary && (
                <>
                  <p className="text-green-900 mb-4">{result.success}</p>

                  <div className="bg-white rounded p-4 mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Usuarios Creados</p>
                        <p className="text-2xl font-bold text-green-600">{result.summary.usuariosCreados}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Roles Asignados</p>
                        <p className="text-2xl font-bold text-green-600">{result.summary.rolesAsignados}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Ya Existentes</p>
                        <p className="text-2xl font-bold text-blue-600">{result.summary.yaExistentes}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Procesados</p>
                        <p className="text-2xl font-bold text-slate-600">{result.summary.totalProcesados}</p>
                      </div>
                    </div>
                  </div>

                  {result.summary.detalles.length > 0 && (
                    <div className="bg-white rounded p-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Detalles:</p>
                      <ul className="text-sm text-gray-700 space-y-1 max-h-40 overflow-y-auto">
                        {result.summary.detalles.map((detalle, idx) => (
                          <li key={idx}>{detalle}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              {result.error && (
                <p className="text-red-900">{result.error}</p>
              )}

              <button
                onClick={() => window.location.href = '/modules/seguridad'}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Ir a Seguridad
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
