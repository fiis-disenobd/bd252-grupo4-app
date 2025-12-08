'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface UserInfo {
  id: string
  email: string
  id_usuario: number
  nombres: string
  apellidos: string
  nombre_usuario: string
  rol: string | null
  isAdmin: boolean
}

export default function VerifyUserPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  async function fetchUser() {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()

      if (res.ok && data.success) {
        setUser(data.user)
      } else {
        setError(data.message || 'No autenticado')
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Error al obtener usuario')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="text-gray-500">Verificando usuario...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-600 text-lg font-semibold mb-4">❌ {error}</div>
          <p className="text-gray-600 mb-6">Debes iniciar sesión primero</p>
          <Link href="/auth/login" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Ir a Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Información del Usuario</h1>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 font-semibold">ID Usuario Supabase</p>
              <p className="text-lg font-mono bg-gray-100 p-2 rounded mt-1">{user?.id}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">ID Usuario BD</p>
              <p className="text-lg font-mono bg-gray-100 p-2 rounded mt-1">{user?.id_usuario}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">Email</p>
              <p className="text-lg bg-gray-100 p-2 rounded mt-1">{user?.email}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">Nombre Usuario</p>
              <p className="text-lg bg-gray-100 p-2 rounded mt-1">{user?.nombre_usuario}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">Nombres</p>
              <p className="text-lg bg-gray-100 p-2 rounded mt-1">{user?.nombres}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600 font-semibold">Apellidos</p>
              <p className="text-lg bg-gray-100 p-2 rounded mt-1">{user?.apellidos}</p>
            </div>

            <div className="col-span-2">
              <p className="text-sm text-gray-600 font-semibold">Rol</p>
              <div className="mt-1">
                {user?.rol ? (
                  <div className={`inline-block px-4 py-2 rounded font-semibold ${
                    user.isAdmin ? 'bg-green-200 text-green-900' : 'bg-blue-200 text-blue-900'
                  }`}>
                    {user.rol} {user.isAdmin ? '👑' : ''}
                  </div>
                ) : (
                  <div className="inline-block px-4 py-2 rounded font-semibold bg-gray-200 text-gray-900">
                    Sin rol asignado ⚠️
                  </div>
                )}
              </div>
            </div>

            <div className="col-span-2">
              <p className="text-sm text-gray-600 font-semibold mb-2">Admin?</p>
              <div className={`text-lg font-bold ${user?.isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                {user?.isAdmin ? '✅ SÍ - Puede acceder a seguridad' : '❌ NO - No puede acceder a seguridad'}
              </div>
            </div>
          </div>

          <hr className="my-8" />

          <div className="flex gap-4">
            <Link href="/modules/seguridad" className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-semibold">
              Ir a Seguridad
            </Link>
            <Link href="/auth/logout" className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-semibold">
              Cerrar Sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
