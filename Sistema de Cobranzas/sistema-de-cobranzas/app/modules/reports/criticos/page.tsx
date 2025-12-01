'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'


interface TicketCritico {
  codigo_ticket: number
  cliente: string
  monto_deuda: number
  diasmora: number
  estado_ticket: string
  recurso_asignado: string | null
}

interface Experto {
  codigo_recurso: string
  descripcion: string
  nivelexperiencia: string
  nombre_equipo: string
  carga_actual: number
  horario_dia: string // <--- NUEVO: Para mostrar el turno
}

export default function PaginaCriticos() {
  const router = useRouter()
  
  // Datos
  const [tickets, setTickets] = useState<TicketCritico[]>([])
  const [expertos, setExpertos] = useState<Experto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingExpertos, setLoadingExpertos] = useState(false)
  
  // Estado Modal y Formulario
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null)
  
  const [selectedExperto, setSelectedExperto] = useState('')
  const [fechaProgramada, setFechaProgramada] = useState('') // <--- NUEVO: Fecha
  const [horaProgramada, setHoraProgramada] = useState('09:00')
  
  const [saving, setSaving] = useState(false)


  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)


  useEffect(() => {
    if (supabase) {
      cargarCriticos()
      // Iniciamos con la fecha de hoy
      setFechaProgramada(new Date().toISOString().split('T')[0])
    } else {
        setLoading(false)
    }
  }, [])

  // Cada vez que cambia la fecha, recargamos la disponibilidad de los expertos
  useEffect(() => {
      if (fechaProgramada && supabase) {
          cargarDisponibilidadExpertos(fechaProgramada)
      }
  }, [fechaProgramada])

  async function cargarCriticos() {
    setLoading(true)
    const client = supabase as any
    const { data } = await client
      .schema('programacion')
      .from('vista_programacion_consolidada')
      .select('*')
      .eq('cartera', 'Tardia')
      .order('diasmora', { ascending: false })
    
    setTickets(data || [])
    setLoading(false)
  }

  async function cargarDisponibilidadExpertos(fecha: string) {
    setLoadingExpertos(true)
    const client = supabase as any
    
    // Usamos la función RPC inteligente que ya creamos
    const { data, error } = await client.rpc('consultar_disponibilidad', { p_fecha: fecha })

    if (!error && data) {
        // Filtramos en el frontend para mostrar SOLO EXPERTOS (Regla de Negocio)
        const soloExpertos = data.filter((r: any) => r.nivelexperiencia === 'Experto')
        setExpertos(soloExpertos)
    }
    setLoadingExpertos(false)
  }

  const abrirAsignacion = (id: number) => {
      setSelectedTicket(id)
      // Resetear formulario
      setSelectedExperto('')
      setHoraProgramada('09:00')
      setFechaProgramada(new Date().toISOString().split('T')[0]) // Reset a hoy
      setModalOpen(true)
  }

  async function handleAsignar(e: React.FormEvent) {
      e.preventDefault()
      setSaving(true)
      const client = supabase as any

      if (!supabase) {
          alert("⚠️ Descomenta Supabase para guardar.")
          setSaving(false)
          return
      }

      try {
          // 1. Actualizar Ticket con Fecha y Hora
          await client.schema('programacion').from('ticket')
            .update({ 
                estado: 'En Ejecucion', 
                fecha_programada: fechaProgramada, // Guardamos la fecha elegida
                horaprogramada: horaProgramada 
            })
            .eq('codigo_ticket', selectedTicket)

          // 2. Asignar (Upsert)
          await client.schema('programacion').from('asignacion_recurso_ticket')
            .upsert({ codigo_ticket: selectedTicket, codigo_recurso: selectedExperto }, { onConflict: 'codigo_ticket' })

          await cargarCriticos()
          // Recargar expertos para actualizar sus barras de carga visualmente
          await cargarDisponibilidadExpertos(fechaProgramada)
          
          setModalOpen(false)
      } catch (err) {
          console.error(err)
          alert("Error al asignar")
      } finally {
          setSaving(false)
      }
  }

  // Helpers Visuales (Mismos que en la otra página)
  const getCargaColor = (carga: number) => {
      if (carga < 3) return 'bg-green-500'
      if (carga < 6) return 'bg-yellow-500'
      return 'bg-red-500'
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8 text-slate-100 relative">
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-6">
            <div>
                <h1 className="text-3xl font-black text-red-500 flex items-center gap-3">
                    <span className="text-4xl">🔥</span> GESTIÓN DE CASOS CRÍTICOS
                </h1>
                <p className="text-slate-400 mt-2">
                    Sala de asignación prioritaria para <strong>Cartera Tardía</strong>.
                </p>
            </div>
            <Link href="/modules/programacion" className="text-sm text-slate-400 hover:text-white transition">
                Escapar al Tablero Principal ↗
            </Link>
        </div>

        {/* Resumen */}
        <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Deuda en Riesgo</p>
                <p className="text-3xl font-bold text-white mt-1">
                    S/ {tickets.reduce((acc, t) => acc + t.monto_deuda, 0).toLocaleString()}
                </p>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase">Casos Sin Asignar</p>
                <p className="text-4xl font-bold text-red-500 mt-1">
                    {tickets.filter(t => !t.recurso_asignado).length}
                </p>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <p className="text-xs font-bold text-slate-500 uppercase">Analistas Expertos Disp.</p>
                <p className="text-3xl font-bold text-green-500 mt-1">
                    {expertos.filter(e => e.carga_actual < 5).length} <span className="text-sm text-slate-500 font-normal">/ {expertos.length}</span>
                </p>
            </div>
        </div>

        {/* Tabla Oscura */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-slate-900 text-xs uppercase text-slate-500 font-bold">
                    <tr>
                        <th className="p-4">Ticket</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4 text-right">Deuda</th>
                        <th className="p-4 text-center">Mora</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4">Asignado A</th>
                        <th className="p-4 text-right">Acción</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 text-sm">
                    {loading ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500">Cargando...</td></tr>
                    ) : tickets.length === 0 ? (
                        <tr><td colSpan={7} className="p-8 text-center text-slate-500">
                            {supabase ? "¡Excelente! No hay casos críticos pendientes." : "⚠️ Descomenta Supabase."}
                        </td></tr>
                    ) : tickets.map(t => (
                        <tr key={t.codigo_ticket} className="hover:bg-slate-700/50 transition">
                            <td className="p-4 font-mono text-slate-400">#{t.codigo_ticket}</td>
                            <td className="p-4 font-medium text-white">{t.cliente}</td>
                            <td className="p-4 text-right font-bold text-slate-200">S/ {t.monto_deuda}</td>
                            <td className="p-4 text-center text-red-400 font-bold">{t.diasmora} días</td>
                            <td className="p-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${t.estado_ticket === 'Pendiente' ? 'bg-yellow-900/50 text-yellow-500' : 'bg-blue-900/50 text-blue-400'}`}>
                                    {t.estado_ticket}
                                </span>
                            </td>
                            <td className="p-4 text-slate-300">
                                {t.recurso_asignado || <span className="text-red-500 italic">-- Sin Asignar --</span>}
                            </td>
                            <td className="p-4 text-right">
                                {t.estado_ticket !== 'Finalizado' && (
                                    <button 
                                        onClick={() => abrirAsignacion(t.codigo_ticket)}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold shadow transition"
                                    >
                                        {t.recurso_asignado ? 'Re-asignar' : 'Asignar Experto'}
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- MODAL MEJORADO (ESTILO ASIGNACIÓN COMPLETA) --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl border border-slate-600 w-full max-w-lg p-6 shadow-2xl flex flex-col max-h-[90vh]">
                
                <div className="mb-4">
                    <h3 className="text-xl font-bold text-white">Asignar Caso Crítico #{selectedTicket}</h3>
                    <p className="text-slate-400 text-sm">Selecciona fecha y experto disponible.</p>
                </div>
                
                <form onSubmit={handleAsignar} className="space-y-6 flex-1 overflow-hidden flex flex-col">
                    
                    {/* 1. Fecha y Hora */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Fecha Gestión</label>
                            <input 
                                type="date" 
                                required
                                value={fechaProgramada}
                                onChange={(e) => setFechaProgramada(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Hora</label>
                            <input 
                                type="time" 
                                required
                                value={horaProgramada}
                                onChange={(e) => setHoraProgramada(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>

                    {/* 2. Lista de Expertos (Con Tarjetas Visuales) */}
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">
                            Expertos Disponibles ({loadingExpertos ? 'Consultando...' : expertos.length})
                        </label>
                        
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {expertos.map(e => {
                                const esDescanso = e.horario_dia === 'DESCANSO'
                                const deshabilitado = esDescanso

                                return (
                                    <label 
                                        key={e.codigo_recurso} 
                                        className={`relative flex items-center p-3 rounded border cursor-pointer transition group
                                            ${selectedExperto === e.codigo_recurso ? 'bg-indigo-900/50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}
                                            ${deshabilitado ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                                        `}
                                    >
                                        <input 
                                            type="radio" 
                                            name="experto" 
                                            value={e.codigo_recurso}
                                            checked={selectedExperto === e.codigo_recurso}
                                            onChange={(e) => setSelectedExperto(e.target.value)}
                                            disabled={deshabilitado}
                                            className="text-indigo-500 focus:ring-indigo-500 bg-slate-900 border-slate-500 mr-3"
                                        />
                                        
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="block text-sm font-bold text-slate-200">{e.descripcion}</span>
                                                    <span className="block text-xs text-slate-400">{e.nombre_equipo}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-[10px] font-bold uppercase ${esDescanso ? 'text-red-400' : 'text-green-400'}`}>
                                                        {e.horario_dia}
                                                    </span>
                                                </div>
                                            </div>

                                            {!esDescanso && (
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden">
                                                        <div 
                                                            className={`h-full ${getCargaColor(e.carga_actual)}`} 
                                                            style={{ width: `${Math.min((e.carga_actual / 10) * 100, 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-slate-400">{e.carga_actual} casos</span>
                                                </div>
                                            )}
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3 justify-end border-t border-slate-700 mt-auto">
                        <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-slate-300 hover:text-white">Cancelar</button>
                        <button 
                            type="submit" 
                            disabled={saving || !selectedExperto}
                            className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                        >
                            {saving ? 'Guardando...' : 'Confirmar Asignación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  )
}