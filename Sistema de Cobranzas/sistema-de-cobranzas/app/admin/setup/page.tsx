'use client'

import { useState } from 'react'

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  async function setupAdmin() {
    try {
      setLoading(true)
      setResult(null)

      // Asignar el rol a todos los usuarios
      const assignRoleRes = await fetch('/api/admin/assign-admin-role', {
        method: 'POST'
      })

      const assignRoleData = await assignRoleRes.json()

      if (!assignRoleRes.ok) {
        setResult({ success: false, error: assignRoleData.error || 'Error asignando roles' })
      } else {
        setResult({
          success: true,
          message: '✅ ¡Configuración completada! Todos los usuarios tienen rol administrador.'
        })
      }
    } catch (err: any) {
      console.error('Error:', err)
      setResult({ success: false, error: err.message || 'Error desconocido' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">⚙️ Configurar Sistema de Seguridad</h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-gray-700 mb-6">
            Este proceso configurará el sistema de seguridad para que todos los usuarios tengan permisos de administrador.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <p className="text-blue-900 text-sm">
              <strong>Pasos que se ejecutarán:</strong><br/>
              1. Crear el rol "administrador" si no existe<br/>
              2. Crear los permisos del sistema<br/>
              3. Asignar roles a todos los usuarios autenticados
            </p>
          </div>

          <button
            onClick={setupAdmin}
            disabled={loading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 w-full"
          >
            {loading ? '⏳ Configurando...' : '▶️ Configurar Sistema'}
          </button>

          {result && (
            <div className={`mt-8 p-6 rounded-lg ${result.success ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
              <h2 className={`text-xl font-bold mb-4 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                {result.success ? '✅ Éxito' : '❌ Error'}
              </h2>

              <p className={result.success ? 'text-green-900' : 'text-red-900'}>
                {result.message || result.error}
              </p>

              {result.success && (
                <button
                  onClick={() => window.location.href = '/modules/seguridad'}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Ir a Seguridad →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
