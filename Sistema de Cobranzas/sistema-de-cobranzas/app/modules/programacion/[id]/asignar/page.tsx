'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'



interface RecursoConCarga {
  codigo_recurso: string
  descripcion: string
  nivelexperiencia: string
  nombre_equipo: string
  carga_actual: number
  horario_dia: string
}

export default function PaginaAsignacion() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params?.id as string

  const [recursos, setRecursos] = useState<RecursoConCarga[]>([])
  const [ticketInfo, setTicketInfo] = useState<any>(null)
  
  const [recursoSeleccionado, setRecursoSeleccionado] = useState('')
  const [fechaProgramada, setFechaProgramada] = useState('')
  const [horaProgramada, setHoraProgramada] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [loadingRecursos, setLoadingRecursos] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{tipo: 'error' | 'success', texto: string} | null>(null)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)


  useEffect(() => {
    if (ticketId && supabase) {
      cargarTicket()
    } else {
        setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
      if (fechaProgramada && supabase) {
          cargarDisponibilidad(fechaProgramada)
      }
  }, [fechaProgramada])

  async function cargarTicket() {
    try {
      setLoading(true)
      const client = supabase as any
      const { data: ticket, error } = await client
        .schema('programacion')
        .from('vista_programacion_consolidada')
        .select('*')
        .eq('codigo_ticket', parseInt(ticketId))
        .single()
      
      if (error) throw error
      setTicketInfo(ticket)

      if (ticket.codigo_recurso) setRecursoSeleccionado(ticket.codigo_recurso)
      if (ticket.horaprogramada) setHoraProgramada(ticket.horaprogramada)
      
      const fechaBase = ticket.fecha_programada || new Date().toISOString().split('T')[0]
      setFechaProgramada(fechaBase)

    } catch (err: any) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'Error cargando ticket: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  async function cargarDisponibilidad(fecha: string) {
      try {
          setLoadingRecursos(true)
          setMensaje(null) // Limpiar errores previos
          const client = supabase as any
          
          const { data, error } = await client.rpc('consultar_disponibilidad', { p_fecha: fecha })

          if (error) throw error
          setRecursos(data || [])

      } catch (err: any) {
          console.error(err)
          // CAMBIO: Ahora mostramos el mensaje real del error para saber qué pasa
          setMensaje({ tipo: 'error', texto: 'Error al consultar disponibilidad: ' + (err.message || JSON.stringify(err)) })
      } finally {
          setLoadingRecursos(false)
      }
  }

  async function handleGuardar(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMensaje(null)

    if (!supabase) { alert("⚠️ Descomenta Supabase."); setSaving(false); return; }

    try {
      if (!recursoSeleccionado) throw new Error("Debes seleccionar un analista.")
      if (!fechaProgramada || !horaProgramada) throw new Error("Define fecha y hora.")

      const client = supabase as any

      // Actualizar Ticket
      await client.schema('programacion').from('ticket')
        .update({ fecha_programada: fechaProgramada, horaprogramada: horaProgramada, estado: 'En Ejecucion' })
        .eq('codigo_ticket', parseInt(ticketId))

      // Upsert Asignación
      const { error: assignError } = await client.schema('programacion').from('asignacion_recurso_ticket')
        .upsert({ codigo_ticket: parseInt(ticketId), codigo_recurso: recursoSeleccionado }, { onConflict: 'codigo_ticket' })

      if (assignError) throw assignError

      setMensaje({ tipo: 'success', texto: 'Asignación guardada correctamente.' })
      setTimeout(() => router.push(`/modules/programacion/${ticketId}/asignar/confirmacion`), 1000)

    } catch (err: any) {
      setMensaje({ 
        tipo: 'error', 
        texto: err.message.includes('RF203') ? '⛔ BLOQUEO: Cartera Tardía requiere Experto.' : 'Error: ' + err.message 
      })
    } finally {
      setSaving(false)
    }
  }

  const getCargaColor = (carga: number) => {
      if (carga < 3) return 'bg-green-500'
      if (carga < 6) return 'bg-yellow-500'
      return 'bg-red-500'
  }

  if (loading) return <div className="p-8 text-center text-slate-700">Cargando...</div>
  if (!ticketInfo) return <div className="p-8 text-center text-gray-500">Error al cargar.</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-slate-900 flex justify-center">
      <div className="w-full max-w-4xl">
        
        <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-800">Asignación de Turnos</h1>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-indigo-600">Cancelar</button>
        </div>

        {mensaje && (
            <div className={`mb-6 p-4 rounded-lg border ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                {mensaje.texto}
            </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
                <div>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Ticket #{ticketInfo.codigo_ticket}</span>
                    <h2 className="text-lg font-bold">{ticketInfo.cliente}</h2>
                </div>
                <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold bg-white text-slate-900`}>{ticketInfo.cartera}</span>
                </div>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-8">
                
                {/* 1. FECHA */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <label className="block text-sm font-bold text-indigo-900 mb-2">📅 1. Fecha de Gestión</label>
                    <input 
                        type="date" 
                        required
                        value={fechaProgramada}
                        onChange={(e) => setFechaProgramada(e.target.value)}
                        className="block w-full px-4 py-2 border border-indigo-200 rounded-lg text-slate-900 bg-white font-bold"
                    />
                </div>

                {/* 2. LISTA DE ASESORES */}
                <div className={`transition-opacity duration-300 ${loadingRecursos ? 'opacity-50' : 'opacity-100'}`}>
                    <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">
                        2. Seleccionar Analista ({loadingRecursos ? 'Consultando turnos...' : 'Disponibilidad'})
                    </label>
                    
                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {recursos.map((r) => {
                            const esDescanso = r.horario_dia === 'DESCANSO'
                            const deshabilitado = esDescanso

                            return (
                                <label 
                                    key={r.codigo_recurso} 
                                    className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all duration-200 group
                                        ${recursoSeleccionado === r.codigo_recurso ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500 shadow-md' : 'border-gray-200 bg-white hover:border-indigo-300'}
                                        ${deshabilitado ? 'bg-gray-100 border-gray-200 opacity-60 cursor-not-allowed grayscale' : ''}
                                    `}
                                >
                                    <input 
                                        type="radio" 
                                        name="recurso" 
                                        value={r.codigo_recurso}
                                        checked={recursoSeleccionado === r.codigo_recurso}
                                        onChange={(e) => setRecursoSeleccionado(e.target.value)}
                                        disabled={deshabilitado}
                                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 mr-4"
                                    />
                                    
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="block text-sm font-bold text-slate-800">{r.descripcion}</span>
                                                <span className="text-xs text-gray-500 block">{r.nivelexperiencia} • {r.nombre_equipo}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] uppercase text-slate-400 font-bold block">Turno</span>
                                                <span className={`text-xs font-bold ${esDescanso ? 'text-red-500' : 'text-slate-800'}`}>
                                                    {r.horario_dia}
                                                </span>
                                            </div>
                                        </div>

                                        {!esDescanso && (
                                            <div className="mt-3">
                                                <div className="flex justify-between text-[10px] mb-1">
                                                    <span className="text-gray-500 font-medium">Carga: {r.carga_actual} casos</span>
                                                </div>
                                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${getCargaColor(r.carga_actual)}`} 
                                                        style={{ width: `${Math.min((r.carga_actual / 10) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {esDescanso && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-xl">
                                            <span className="px-3 py-1 bg-gray-800 text-white text-xs font-bold rounded shadow uppercase">No Laborable</span>
                                        </div>
                                    )}
                                </label>
                            )
                        })}
                    </div>
                </div>

                {/* 3. HORA */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">3. Hora de Gestión</label>
                    <input 
                        type="time" 
                        required
                        value={horaProgramada}
                        onChange={(e) => setHoraProgramada(e.target.value)}
                        className="block w-full md:w-40 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900 bg-white font-bold"
                    />
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-lg text-base font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all disabled:opacity-50"
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