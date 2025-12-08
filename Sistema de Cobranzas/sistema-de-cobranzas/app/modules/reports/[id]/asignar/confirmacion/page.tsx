'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'



interface InfoAsignacion {
  cliente: string
  recurso_asignado: string
  horaprogramada: string
  fecha_programada: string
}

export default function PaginaConfirmacion() {
  const params = useParams()
  const ticketId = params?.id as string
  const [info, setInfo] = useState<InfoAsignacion | null>(null)


  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)


  useEffect(() => {
    if (ticketId && supabase) {
      cargarDatosConfirmados()
    }
  }, [ticketId])

  async function cargarDatosConfirmados() {
    const client = supabase as any
    const { data } = await client
      .schema('programacion')
      .from('vista_programacion_consolidada')
      .select('cliente, recurso_asignado, fecha_programada')
      .eq('codigo_ticket', parseInt(ticketId))
      .single()
    
    const { data: ticketData } = await client
        .schema('programacion')
        .from('ticket')
        .select('horaprogramada')
        .eq('codigo_ticket', parseInt(ticketId))
        .single()

    if (data) {
        setInfo({
            ...data,
            horaprogramada: ticketData?.horaprogramada || '--:--'
        })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-slate-900">
      
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full text-center">
        
        {/* ÍCONO DE ÉXITO ANIMADO */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <svg className="h-10 w-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Asignación Exitosa!</h2>
        <p className="text-gray-500 mb-8">El recurso ha sido programado correctamente.</p>

        {/* RESUMEN DE LA ACCIÓN */}
        {info && (
            <div className="bg-slate-50 rounded-lg p-4 mb-8 text-left text-sm border border-gray-200">
                <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Ticket:</span>
                    <span className="font-bold text-slate-900">#{ticketId}</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Cliente:</span>
                    <span className="font-medium text-slate-900">{info.cliente}</span>
                </div>
                <div className="flex justify-between mb-2">
                    <span className="text-gray-500">Analista:</span>
                    <span className="font-bold text-indigo-600">{info.recurso_asignado}</span>
                </div>
                <div className="border-t border-gray-200 my-2 pt-2 flex justify-between">
                    <span className="text-gray-500">Horario:</span>
                    <span className="font-bold text-slate-900">{info.fecha_programada} a las {info.horaprogramada}</span>
                </div>
            </div>
        )}

        {/* BOTONES DE NAVEGACIÓN */}
        <div className="space-y-3">
            <Link 
                href="/modules/programacion" 
                className="block w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
            >
                Volver al Tablero
            </Link>
            
            <Link 
                href={`/modules/programacion/${ticketId}`} 
                className="block w-full py-3 px-4 bg-white text-indigo-600 font-medium rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
                Ver Detalle del Ticket
            </Link>
        </div>

      </div>
    </div>
  )
}