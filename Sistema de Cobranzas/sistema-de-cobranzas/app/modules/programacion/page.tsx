'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'



interface TicketProgramado {
  codigo_ticket: number
  estado_ticket: string
  fecha_programada: string
  cliente: string
  cartera: string
  monto_deuda: number
  diasmora: number
  recurso_asignado: string | null
  nombre_equipo: string | null
}

export default function ModuloProgramacion() {
  const [tickets, setTickets] = useState<TicketProgramado[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Todos')
  const [mensaje, setMensaje] = useState<{tipo: 'error' | 'success', texto: string} | null>(null)


  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)


  useEffect(() => {
    if (supabase) {
      cargarDatos()
    } else {
        setLoading(false)
    }
  }, [])

  // --- CÁLCULO DE KPIs ---
  const kpis = useMemo(() => {
    const totalTickets = tickets.length
    const totalDeuda = tickets.reduce((acc, t) => acc + t.monto_deuda, 0)
    const asignados = tickets.filter(t => t.recurso_asignado).length
    const sinAsignar = totalTickets - asignados
    const criticosSinAsignar = tickets.filter(t => t.cartera === 'Tardia' && !t.recurso_asignado).length
    const cobertura = totalTickets > 0 ? Math.round((asignados / totalTickets) * 100) : 0

    return { totalTickets, totalDeuda, sinAsignar, criticosSinAsignar, cobertura }
  }, [tickets])

  // Lógica de Filtros
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter(t => {
      const busquedaLower = busqueda.toLowerCase()
      const clienteTexto = t.cliente ? t.cliente.toLowerCase() : ''
      const idTexto = t.codigo_ticket.toString()
      const coincideTexto = clienteTexto.includes(busquedaLower) || idTexto.includes(busquedaLower)
      const coincideEstado = filtroEstado === 'Todos' || t.estado_ticket === filtroEstado
      return coincideTexto && coincideEstado
    })
  }, [tickets, busqueda, filtroEstado])

  async function cargarDatos() {
    try {
      setLoading(true)
      const client = supabase as any
      const { data, error } = await client
        .schema('programacion') 
        .from('vista_programacion_consolidada')
        .select('*')
        .order('codigo_ticket', { ascending: true })
      
      if (error) throw error
      setTickets((data as any[]) || [])
    } catch (err: any) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'Error cargando datos: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  const getEstadoColor = (estado: string) => {
    const s = estado?.toLowerCase() || ''
    if (s === 'pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (s === 'en ejecucion') return 'bg-blue-100 text-blue-800 border-blue-200'
    if (s === 'finalizado') return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative text-slate-900 pb-24">
      
      {/* TÍTULO Y ACCIONES */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tablero de Programación</h1>
          <p className="text-gray-500 text-sm mt-1">Gestión y asignación de cartera</p>
        </div>
        <div className="flex gap-3">
            {/* BOTÓN DE REASIGNAR (NUEVO) */}
            <Link 
                href="/modules/programacion/reasignacion"
                className="px-4 py-2 bg-amber-100 border border-amber-300 text-amber-800 rounded-md hover:bg-amber-200 shadow-sm transition-all text-sm font-bold flex items-center gap-2"
            >
                🚑 Reasignar
            </Link>

            <button onClick={cargarDatos} className="px-4 py-2 bg-white border border-gray-300 text-slate-700 rounded-md hover:bg-gray-50 shadow-sm transition-all text-sm font-medium">
                ↻ Actualizar
            </button>
        </div>
      </div>

      {/* --- SECCIÓN DE KPIs --- */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Card 1: Deuda Total */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Deuda Total en Cartera</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">S/ {kpis.totalDeuda.toLocaleString('es-PE', { maximumFractionDigits: 0 })}</p>
              <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-full"></div>
              </div>
          </div>

          {/* Card 2: Cobertura */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cobertura de Asignación</p>
              <div className="flex items-end gap-2 mt-1">
                  <p className="text-3xl font-bold text-slate-900">{kpis.cobertura}%</p>
                  <span className="text-xs text-gray-500 mb-1">de tickets asignados</span>
              </div>
              <div className="mt-2 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${kpis.cobertura > 80 ? 'bg-green-500' : 'bg-yellow-500'} transition-all duration-500`} style={{ width: `${kpis.cobertura}%` }}></div>
              </div>
          </div>

          {/* Card 3: Pendientes */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tickets Pendientes</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.sinAsignar}</p>
              <p className="text-xs text-gray-500">Requieren atención inmediata</p>
          </div>

          {/* Card 4: Críticos */}
          <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between ${kpis.criticosSinAsignar > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${kpis.criticosSinAsignar > 0 ? 'text-red-600' : 'text-green-700'}`}>
                  Críticos Sin Asignar
              </p>
              <div className="flex items-center gap-2 mt-1">
                  {kpis.criticosSinAsignar > 0 && <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>}
                  <p className={`text-3xl font-bold ${kpis.criticosSinAsignar > 0 ? 'text-red-700' : 'text-green-800'}`}>
                      {kpis.criticosSinAsignar}
                  </p>
              </div>
              <p className={`text-xs ${kpis.criticosSinAsignar > 0 ? 'text-red-600' : 'text-green-700'}`}>
                  {kpis.criticosSinAsignar > 0 ? '⚠️ Prioridad Alta (Cartera Tardía)' : '✅ Todo bajo control'}
              </p>
          </div>
      </div>

      {/* FILTROS */}
      <div className="max-w-7xl mx-auto mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm text-slate-900"
            placeholder="Buscar por cliente o ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-sm text-gray-500 font-medium text-slate-700">Estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 sm:text-sm rounded-md bg-white text-slate-900"
          >
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Ejecucion">En Ejecución</option>
            <option value="Finalizado">Finalizado</option>
          </select>
        </div>
      </div>

      {mensaje && (
        <div className="max-w-7xl mx-auto mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
          {mensaje.texto}
        </div>
      )}

      {/* TABLA */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Deuda</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Analista / Equipo</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                 <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">Cargando datos...</td></tr>
              ) : ticketsFiltrados.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">{supabase ? "No hay tickets." : "⚠️ Descomenta Supabase."}</td></tr>
              ) : ticketsFiltrados.map((t) => (
                <tr key={t.codigo_ticket} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">#{t.codigo_ticket}</span>
                    <div className="text-xs text-gray-500">{t.fecha_programada}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{t.cliente}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full 
                        ${t.cartera === 'Tardia' ? 'bg-red-100 text-red-800' : 
                          t.cartera === 'Temprana' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {t.cartera}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-slate-900 font-semibold">S/ {t.monto_deuda}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold border 
                        ${t.estado_ticket === 'Pendiente' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 
                          t.estado_ticket === 'En Ejecucion' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                      {t.estado_ticket}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {t.recurso_asignado ? (
                        <div>
                            <span className="text-indigo-600 font-medium block">{t.recurso_asignado}</span>
                            {t.nombre_equipo && (
                                <span className="text-[10px] uppercase tracking-wide text-gray-400 block">
                                    {t.nombre_equipo}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="text-gray-400 italic">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                        href={`/modules/programacion/${t.codigo_ticket}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium text-sm flex items-center justify-end gap-1"
                    >
                        Ver Detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}