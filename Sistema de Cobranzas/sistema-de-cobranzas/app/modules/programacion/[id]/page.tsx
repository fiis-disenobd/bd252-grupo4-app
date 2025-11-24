'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'



interface DetalleTicket {
  codigo_ticket: number
  fecha_programada: string
  estado_ticket: string
  cliente: string
  codigo_cliente: string
  cartera: string
  monto_deuda: number
  diasmora: number
  recurso_asignado: string | null
  // Nuevos campos JSON de la vista
  lista_contactos: Contacto[]
  lista_productos: Producto[]
}

interface Contacto {
  tipo_contacto: string
  valor_contacto: string
}

interface Producto {
  descripcion: string
  tipo_producto: string
  moneda: string
  valor: number
}

export default function DetalleTicketPage() {
  const params = useParams()
  const ticketId = params?.id as string

  const [ticket, setTicket] = useState<DetalleTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)


  useEffect(() => {
    if (ticketId && supabase) {
      cargarDetalleOptimizado()
    } else {
        setLoading(false)
    }
  }, [ticketId])

  async function cargarDetalleOptimizado() {
    try {
      setLoading(true)
      const client = supabase as any

      // ¡MAGIA! Ahora traemos TODO (Ticket + Contactos + Productos) en una sola consulta
      const { data, error } = await client
        .schema('programacion')
        .from('vista_detalle_ticket_completo') // <--- Usamos la nueva vista
        .select('*')
        .eq('codigo_ticket', parseInt(ticketId))
        .single()

      if (error) throw error
      
      setTicket(data)

    } catch (err: any) {
      console.error(err)
      setError("Error: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-slate-600">Cargando información completa...</div>
  
  if (!ticket) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-slate-600 gap-4">
      <p>{supabase ? "No se encontró el ticket." : "⚠️ Recuerda descomentar la conexión a Supabase."}</p>
      <Link href="/modules/programacion" className="text-indigo-600 hover:underline">Volver al tablero</Link>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-slate-900">
      
      {/* NAVEGACIÓN */}
      <div className="max-w-6xl mx-auto mb-6">
        <Link href="/modules/programacion" className="text-gray-500 hover:text-indigo-600 text-sm font-medium flex items-center gap-1 transition-colors">
          ← Volver al Tablero
        </Link>
      </div>

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
        
        {/* HEADER */}
        <div className="bg-slate-900 p-8 flex justify-between items-center text-white shadow-md">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Ticket #{ticket.codigo_ticket}</h1>
            <p className="text-slate-400 text-sm mt-1">Fecha Programada: {ticket.fecha_programada}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-xs uppercase tracking-wider text-slate-400 mb-1 font-semibold">Estado Actual</span>
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm 
                ${ticket.estado_ticket === 'Pendiente' ? 'bg-yellow-400 text-yellow-900' : 
                  ticket.estado_ticket === 'En Ejecucion' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
              {ticket.estado_ticket}
            </span>
          </div>
        </div>

        {/* CUERPO PRINCIPAL */}
        <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COLUMNA 1: CLIENTE Y CONTACTOS */}
          <div className="lg:col-span-1 space-y-8">
            <div>
                <h2 className="text-lg font-bold text-slate-900 border-b-2 border-gray-100 pb-2 mb-4">Cliente</h2>
                <p className="text-xl font-medium text-slate-900">{ticket.cliente}</p>
                <p className="text-sm text-gray-500 mt-1">ID: {ticket.codigo_cliente}</p>
                <div className="mt-3">
                    <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider border
                        ${ticket.cartera === 'Tardia' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-slate-700 border-gray-200'}`}>
                        Cartera {ticket.cartera}
                    </span>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-bold text-slate-900 border-b-2 border-gray-100 pb-2 mb-4">Medios de Contacto</h2>
                {ticket.lista_contactos && ticket.lista_contactos.length > 0 ? (
                    <ul className="space-y-3">
                        {ticket.lista_contactos.map((c, idx) => (
                            <li key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <span className="text-lg">{c.tipo_contacto === 'Celular' ? '📱' : c.tipo_contacto === 'Email' ? '📧' : '📞'}</span>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">{c.tipo_contacto}</p>
                                    <p className="text-sm text-slate-600 break-all">{c.valor_contacto}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-gray-400 italic">No hay contactos registrados.</p>
                )}
            </div>
          </div>

          {/* COLUMNA 2: PRODUCTOS Y DEUDA */}
          <div className="lg:col-span-2 space-y-8">
             
             {/* Resumen Financiero */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                    <label className="text-xs font-bold text-indigo-500 uppercase block mb-1">Deuda Total</label>
                    <p className="text-4xl font-bold text-indigo-900 tracking-tight">
                        S/ {ticket.monto_deuda.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                    <label className="text-xs font-bold text-red-500 uppercase block mb-1">Días de Atraso</label>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-extrabold text-red-700">{ticket.diasmora}</span>
                        <span className="text-sm font-bold text-red-800">días</span>
                    </div>
                </div>
             </div>

             {/* Lista de Productos */}
             <div>
                <h2 className="text-lg font-bold text-slate-900 border-b-2 border-gray-200 pb-2 mb-4">Productos Contratados</h2>
                {ticket.lista_productos && ticket.lista_productos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ticket.lista_productos.map((prod, idx) => (
                            <div key={idx} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 text-xs rounded font-bold uppercase 
                                        ${prod.tipo_producto.includes('Tarjeta') ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                        {prod.tipo_producto}
                                    </span>
                                    <span className="text-xs text-gray-400">{prod.moneda}</span>
                                </div>
                                <p className="font-bold text-slate-800">{prod.descripcion}</p>
                                <p className="text-sm text-gray-500 mt-1">Línea/Monto: <span className="text-slate-900 font-medium">{prod.valor.toLocaleString()}</span></p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">No se encontraron productos asociados.</p>
                )}
             </div>

             {/* Asignación Actual */}
             <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Estado de Asignación</h3>
                {ticket.recurso_asignado ? (
                   <div className="flex items-center gap-4 bg-white p-4 rounded-lg border border-indigo-100 shadow-sm">
                      <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {ticket.recurso_asignado.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-bold text-indigo-900">{ticket.recurso_asignado}</p>
                        <p className="text-sm text-indigo-500 font-medium">Analista Responsable</p>
                      </div>
                   </div>
                ) : (
                    <div className="flex items-center gap-2 bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-yellow-800">
                        <span>⚠️</span>
                        <p className="text-sm font-medium">Este cliente aún no tiene un analista asignado para la gestión.</p>
                    </div>
                )}
            </div>

          </div>
        </div>

        {/* PIE DE PÁGINA: ACCIONES */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200 flex justify-end items-center gap-4">
            {ticket.estado_ticket !== 'Finalizado' && (
                <Link
                    href={`/modules/programacion/${ticket.codigo_ticket}/asignar`}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                    {ticket.recurso_asignado ? '✏️ Re-asignar Analista / Horario' : '🔍 Buscar Disponibilidad y Asignar'}
                </Link>
            )}
        </div>

      </div>
    </div>
  )
}