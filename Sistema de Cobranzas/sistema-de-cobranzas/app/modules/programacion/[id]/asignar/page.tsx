'use client'

import { useEffect, useState } from 'react'

import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'



interface Recurso {
  codigo_recurso: string
  descripcion: string
  nivelexperiencia: string
  disponibilidad: string
}

export default function PaginaAsignacion() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params?.id as string

  // Estados
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [ticketInfo, setTicketInfo] = useState<any>(null)
  
  // Formulario
  const [recursoSeleccionado, setRecursoSeleccionado] = useState('')
  const [horaProgramada, setHoraProgramada] = useState('') 
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mensaje, setMensaje] = useState<{tipo: 'error' | 'success', texto: string} | null>(null)

  // ⚠️ PASO 2: DESCOMENTA SUPABASE REAL Y BORRA LA LÍNEA MOCK
  
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

      // 2. Info de Recursos (Solo Asesores)
      const { data: listadoRecursos, error: errRecursos } = await client
        .schema('programacion')
        .from('recurso')
        .select('*')
        .eq('tipo_recurso', 'Asesor')
      
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
        alert("⚠️ Descomenta Supabase en el código (page.tsx) para guardar.");
        setSaving(false);
        return;
    }

    try {
      if (!recursoSeleccionado) throw new Error("Debes seleccionar un analista.")
      if (!horaProgramada) throw new Error("Debes definir un horario para la gestión.")

      const client = supabase as any

      // 1. Actualizar Horario y Estado en Ticket
      const { error: updateError } = await client
        .schema('programacion')
        .from('ticket')
        .update({ 
            horaprogramada: horaProgramada, // Guardamos la hora
            estado: 'En Ejecucion'          
        })
        .eq('codigo_ticket', parseInt(ticketId))

      if (updateError) throw updateError

      // 2. Guardar Asignación (Upsert por si editamos)
      const { error: assignError } = await client
        .schema('programacion')
        .from('asignacion_recurso_ticket')
        .upsert({
            codigo_ticket: parseInt(ticketId),
            codigo_recurso: recursoSeleccionado
        }, { onConflict: 'codigo_ticket' })

      if (assignError) throw assignError

      setMensaje({ tipo: 'success', texto: 'Asignación y horario guardados correctamente.' })
      
      setTimeout(() => {
  // Navegamos a la sub-ruta de confirmación
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

  if (loading) return <div className="p-8 text-center text-slate-700">Cargando formulario...</div>
  if (!ticketInfo) return <div className="p-8 text-center text-gray-500">{supabase ? "No se pudo cargar la información." : "⚠️ Falta descomentar Supabase en el código."}</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-slate-900 flex justify-center">
      
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Nueva Asignación</h1>
            <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-indigo-600">Cancelar</button>
        </div>

        {mensaje && (
            <div className={`mb-6 p-4 rounded-lg border ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
            {mensaje.tipo === 'error' ? '⚠️ ' : '✅ '} {mensaje.texto}
            </div>
        )}

        <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-100">
            {/* Resumen Ticket */}
            <div className="bg-slate-50 p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Ticket #{ticketInfo.codigo_ticket}</p>
                        <h2 className="text-xl font-bold text-slate-900 mt-1">{ticketInfo.cliente}</h2>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${ticketInfo.cartera === 'Tardia' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-700'}`}>
                        {ticketInfo.cartera}
                    </span>
                </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleGuardar} className="p-8 space-y-8">
                
                {/* 1. SELECCIÓN DE RECURSO */}
                <div>
                    <label className="block text-sm font-bold text-slate-900 mb-3">1. Seleccionar Analista</label>
                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
                        {recursos.map((r) => (
                            <label 
                                key={r.codigo_recurso} 
                                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all hover:bg-indigo-50 ${
                                    recursoSeleccionado === r.codigo_recurso ? 'border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600' : 'border-gray-200'
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
                                <div className="ml-3 flex-1">
                                    <span className="block text-sm font-medium text-slate-900">{r.descripcion}</span>
                                    <span className="block text-xs text-gray-500">Nivel: {r.nivelexperiencia} • Disp: {r.disponibilidad}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* 2. SELECCIÓN DE HORARIO (NUEVO) */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <label className="block text-sm font-bold text-slate-900 mb-2">2. Horario de Gestión</label>
                    <div className="flex gap-4 items-center">
                        <input 
                            type="time" 
                            required
                            value={horaProgramada}
                            onChange={(e) => setHoraProgramada(e.target.value)}
                            className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-slate-900"
                        />
                        <span className="text-xs text-gray-500">
                            Define la hora exacta para contactar al cliente.
                        </span>
                    </div>
                </div>

                {/* Botón */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full flex justify-center py-4 px-4 border border-transparent rounded-lg shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-all disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Confirmar Asignación y Horario'}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  )
}