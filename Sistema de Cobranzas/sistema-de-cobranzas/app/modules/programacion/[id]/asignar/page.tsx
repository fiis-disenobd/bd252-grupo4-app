'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'



interface RecursoConCarga {
  codigo_recurso: string
  descripcion: string
  nivelexperiencia: string
  horario_entrada: string
  nombre_equipo: string
  carga_actual: number
}

export default function PaginaAsignacion() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params?.id as string

  const [recursos, setRecursos] = useState<RecursoConCarga[]>([])
  const [ticketInfo, setTicketInfo] = useState<any>(null)
  
  const [recursoSeleccionado, setRecursoSeleccionado] = useState('')
  const [horaProgramada, setHoraProgramada] = useState('') 
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{tipo: 'error' | 'success', texto: string} | null>(null)

  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)
  

  useEffect(() => {
    if (ticketId && supabase) {
      cargarDatosIniciales()
    } else {
        setLoading(false)
    }
  }, [ticketId])

  async function cargarDatosIniciales() {
    try {
      setLoading(true)
      const client = supabase as any

      // 1. Info del Ticket
      const { data: ticket, error: errTicket } = await client
        .schema('programacion')
        .from('vista_programacion_consolidada')
        .select('*')
        .eq('codigo_ticket', parseInt(ticketId))
        .single()
      
      if (errTicket) throw errTicket
      setTicketInfo(ticket)

      if (ticket.codigo_recurso) {
          setRecursoSeleccionado(ticket.codigo_recurso)
      }
      
      if (ticket.horaprogramada) {
          setHoraProgramada(ticket.horaprogramada)
      }

      // 2. Cargar recursos CON CARGA DE TRABAJO (Nueva Vista)
      // Ordenamos por menor carga primero para sugerir a los más libres
      const { data: listadoRecursos, error: errRecursos } = await client
        .schema('programacion')
        .from('vista_carga_asesores')
        .select('*')
        .order('carga_actual', { ascending: true }) 
      
      if (errRecursos) throw errRecursos
      setRecursos(listadoRecursos || [])

    } catch (err: any) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'Error cargando datos: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMensaje(null)

    if (!supabase) {
        alert("⚠️ Descomenta Supabase.")
        setSaving(false)
        return
    }

    try {
      if (!recursoSeleccionado) throw new Error("Debes seleccionar un analista.")
      if (!horaProgramada) throw new Error("Debes definir un horario.")

      const client = supabase as any

      // 1. Actualizar Ticket
      await client
        .schema('programacion')
        .from('ticket')
        .update({ horaprogramada: horaProgramada, estado: 'En Ejecucion' })
        .eq('codigo_ticket', parseInt(ticketId))

      // 2. Upsert Asignación
      const { error: assignError } = await client
        .schema('programacion')
        .from('asignacion_recurso_ticket')
        .upsert({
            codigo_ticket: parseInt(ticketId),
            codigo_recurso: recursoSeleccionado
        }, { onConflict: 'codigo_ticket' })

      if (assignError) throw assignError

      setMensaje({ tipo: 'success', texto: 'Asignación guardada correctamente.' })
      setTimeout(() => {
        router.push(`/modules/programacion/${ticketId}/asignar/confirmacion`)
      }, 1000)

    } catch (err: any) {
      console.error(err)
      setMensaje({ 
        tipo: 'error', 
        texto: err.message.includes('RF203') 
          ? '⛔ BLOQUEO: Clientes de Cartera Tardía solo pueden ser atendidos por Expertos.' 
          : 'Error: ' + err.message 
      })
    } finally {
      setSaving(false)
    }
  }

  // Función para determinar el color del semáforo según la carga
  const getCargaColor = (carga: number) => {
      if (carga < 3) return 'bg-green-100 text-green-800 border-green-200' // Libre
      if (carga < 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200' // Normal
      return 'bg-red-100 text-red-800 border-red-200' // Saturado
  }

  const getCargaLabel = (carga: number) => {
      if (carga < 3) return '🟢 Disponible'
      if (carga < 6) return '🟡 Ocupado'
      return '🔴 Saturado'
  }

  if (loading) return <div className="p-8 text-center text-slate-700">Cargando formulario...</div>
  if (!ticketInfo) return <div className="p-8 text-center text-gray-500">No se pudo cargar la información.</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-slate-900 flex justify-center">
      <div className="w-full max-w-3xl">
        
        <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Asignación Inteligente</h1>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-indigo-600">Cancelar</button>
        </div>

        {mensaje && (
            <div className={`mb-6 p-4 rounded-lg border ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {mensaje.tipo === 'error' ? '⚠️ ' : '✅ '} {mensaje.texto}
            </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            {/* Resumen Ticket */}
            <div className="bg-slate-900 p-6 text-white">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Ticket #{ticketInfo.codigo_ticket}</p>
                        <h2 className="text-xl font-bold mt-1">{ticketInfo.cliente}</h2>
                        <p className="text-sm text-gray-300 mt-1">Deuda: S/ {ticketInfo.monto_deuda}</p>
                    </div>
                    <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-900`}>
                            {ticketInfo.cartera}
                        </span>
                        <p className="text-xs text-gray-400 mt-2">Mora: {ticketInfo.diasmora} días</p>
                    </div>
                </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardar} className="p-8 space-y-8">
                
                {/* 1. LISTA DE ASESORES CON INDICADORES DE CARGA */}
                <div>
                    <label className="block text-sm font-bold text-slate-900 mb-3">1. Seleccionar Analista (Ordenado por disponibilidad)</label>
                    <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto pr-2 border border-gray-100 rounded-lg p-2 bg-gray-50">
                        {recursos.map((r) => (
                            <label 
                                key={r.codigo_recurso} 
                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all bg-white hover:shadow-md ${
                                    recursoSeleccionado === r.codigo_recurso ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200'
                                }`}
                            >
                                <input 
                                    type="radio" 
                                    name="recurso" 
                                    value={r.codigo_recurso}
                                    checked={recursoSeleccionado === r.codigo_recurso}
                                    onChange={(e) => setRecursoSeleccionado(e.target.value)}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                                />
                                <div className="ml-3 flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 items-center">
                                    {/* Info Asesor */}
                                    <div>
                                        <span className="block text-sm font-bold text-slate-900">{r.descripcion}</span>
                                        <span className="block text-xs text-gray-500">{r.nivelexperiencia} • {r.nombre_equipo}</span>
                                    </div>
                                    
                                    {/* Indicador de Carga */}
                                    <div className="flex justify-end">
                                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${getCargaColor(r.carga_actual)}`}>
                                            <span className="text-xs font-bold">{getCargaLabel(r.carga_actual)}</span>
                                            <span className="text-xs">({r.carga_actual} casos)</span>
                                        </div>
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 2. Selección Horario */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <label className="block text-sm font-bold text-indigo-900">2. Horario de Gestión</label>
                        <p className="text-xs text-indigo-700 mt-1">Hora aproximada para la llamada.</p>
                    </div>
                    <input 
                        type="time" 
                        required
                        value={horaProgramada}
                        onChange={(e) => setHoraProgramada(e.target.value)}
                        className="block w-40 px-3 py-2 border border-indigo-200 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white font-bold"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-lg text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all disabled:opacity-50 transform hover:-translate-y-0.5"
                    >
                        {saving ? 'Guardando...' : 'Confirmar Asignación'}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  )
}