'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  Legend,
  ComposedChart,
} from 'recharts'

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

/* Sample chart colors and data */
const COLORS = ['#4f46e5', '#22c55e', '#f97316', '#ef4444']

// Deuda total por cartera
const deudaPorCarteraData = [
  { name: 'Temprana', value: 420_000 },
  { name: 'Normal', value: 680_000 },
  { name: 'Tardía', value: 310_000 },
]

// Cobertura mensual
const coberturaMensualData = [
  { mes: 'Ene', cobertura: 65, meta: 75 },
  { mes: 'Feb', cobertura: 72, meta: 78 },
  { mes: 'Mar', cobertura: 78, meta: 80 },
  { mes: 'Abr', cobertura: 82, meta: 82 },
  { mes: 'May', cobertura: 88, meta: 85 },
  { mes: 'Jun', cobertura: 90, meta: 88 },
]

// Tickets pendientes por estado / prioridad
const pendientesPorEstadoData = [
  { estado: 'Pendiente', cantidad: 120, meta: 100 },
  { estado: 'En Ejecución', cantidad: 80, meta: 90 },
  { estado: 'Finalizado', cantidad: 300, meta: 280 },
]

export default function ModuloReportes() {
  const [tickets, setTickets] = useState<TicketProgramado[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Activos')
  const [filtroCartera, setFiltroCartera] = useState('Todas')
  const [paginaActual, setPaginaActual] = useState(1)
  const ITEMS_POR_PAGINA = 20
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null)

  // 🔹 ESTOS hooks debían estar DENTRO del componente
  const [deudaEnProceso, setDeudaEnProceso] = useState<number | null>(null)
  const [montoMaxDeuda, setMontoMaxDeuda] = useState<number | null>(null)
  const [periodoDeuda, setPeriodoDeuda] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    cargarProgramacion()
    cargarTotalDeudaEnProceso()
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

      const coincideEstado =
        filtroEstado === 'Todos' ? true :
          filtroEstado === 'Activos' ? (t.estado_ticket === 'Pendiente' || t.estado_ticket === 'En Ejecucion') :
            t.estado_ticket === filtroEstado

      const coincideCartera = filtroCartera === 'Todas' || t.cartera === filtroCartera

      return coincideTexto && coincideEstado && coincideCartera
    })
  }, [tickets, busqueda, filtroEstado, filtroCartera])

  // Lógica de Paginación
  const { ticketsPaginados, totalPaginas } = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA
    const fin = inicio + ITEMS_POR_PAGINA
    return {
      ticketsPaginados: ticketsFiltrados.slice(inicio, fin),
      totalPaginas: Math.ceil(ticketsFiltrados.length / ITEMS_POR_PAGINA)
    }
  }, [ticketsFiltrados, paginaActual])

  // Resetear página al filtrar
  useEffect(() => {
    setPaginaActual(1)
  }, [busqueda, filtroEstado, filtroCartera])

  async function cargarProgramacion() {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_programacion')

      if (error) throw error
      setTickets((data as any[]) || [])
    } catch (err: any) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'Error cargando datos: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  async function cargarTotalDeudaEnProceso() {
    try {
      const { data, error } = await supabase
        .schema('modulo_reportes')                   // 👈 schema explícito
        .from('vw_total_deuda_en_proceso')
        .select('Periodo, "Deuda En Proceso", "Monto Maximo Deuda"')
        .single()

      if (error) throw error
      if (data) {
        setPeriodoDeuda(data.Periodo)
        setDeudaEnProceso(Number(data['Deuda En Proceso']))
        setMontoMaxDeuda(Number(data['Monto Maximo Deuda']))
      }
    } catch (err: any) {
      console.error(err)
      setMensaje(prev => prev ?? {
        tipo: 'error',
        texto: 'Error cargando total de deuda en proceso: ' + err.message,
      })
    }
  }

  const deudaActualProceso = deudaEnProceso ?? 0
  const deudaMaxReferencia = montoMaxDeuda ?? 5_000_000

  const deudaGaugeData = [
    { name: 'En proceso', value: deudaActualProceso },
    { name: 'Disponible', value: Math.max(deudaMaxReferencia - deudaActualProceso, 0) },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative text-slate-900 pb-24">

      {/* TÍTULO Y ACCIONES */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Metas y reportes</h1>
          <p className="text-gray-500 text-sm mt-1">Dashboard de metas y reportes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={cargarProgramacion}
            className="px-4 py-2 bg-white border border-gray-300 text-slate-700 rounded-md hover:bg-gray-50 shadow-sm transition-all text-sm font-medium"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* --- SECCIÓN DE KPIs --- */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Card: Total deuda en proceso (Gauge con data real) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total deuda en proceso
          </p>

          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-bold text-slate-900">
              {(deudaActualProceso / 1_000_000).toFixed(2)} mill.
            </p>
            <span className="text-xs text-gray-500 mb-1">
              de S/ {(deudaMaxReferencia / 1_000_000).toFixed(0)} mill.
            </span>
          </div>

          <p className="text-[11px] text-gray-500">
            {periodoDeuda ? `Periodo: ${periodoDeuda}` : 'Periodo actual de cobranza'}
          </p>

          <div className="mt-4 h-32 relative">
            <ResponsiveContainer width="100%" height="110%">
              <PieChart>
                <Pie
                  data={deudaGaugeData}
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={50}
                  outerRadius={70}
                  stroke="none"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-xl font-semibold text-slate-900">
                {(deudaActualProceso / 1_000_000).toFixed(2)} mill.
              </p>
              <p className="text-[10px] text-gray-500">
                Deuda en proceso
              </p>
            </div>

            <span className="absolute left-0 bottom-0 text-[10px] text-gray-500">
              0,00 mill.
            </span>
            <span className="absolute right-0 bottom-0 text-[10px] text-gray-500">
              {(deudaMaxReferencia / 1_000_000).toFixed(0)} mill.
            </span>
          </div>
        </div>

        {/* Card: Estado de la deuda total */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Estado de la deuda total
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            S/ {kpis.totalDeuda.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Distribución por tipo de cartera (data de prueba)
          </p>
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deudaPorCarteraData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={24}
                  outerRadius={45}
                  paddingAngle={2}
                >
                  {deudaPorCarteraData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `S/ ${Number(value).toLocaleString('es-PE')}`} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Deuda en proceso por cartera */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Deuda en proceso por cartera
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            S/ {kpis.totalDeuda.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Distribución por tipo de cartera (data de prueba)
          </p>
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={deudaPorCarteraData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={24}
                  outerRadius={45}
                  paddingAngle={2}
                >
                  {deudaPorCarteraData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => `S/ ${Number(value).toLocaleString('es-PE')}`} />
                <Legend
                  verticalAlign="bottom"
                  align="center"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Deuda en proceso por producto */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Deuda en proceso por producto
          </p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{kpis.sinAsignar}</p>
          <p className="text-xs text-gray-500">Requieren atención inmediata</p>
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={pendientesPorEstadoData}
                layout="vertical"
                margin={{ left: 20, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={10} />
                <YAxis dataKey="estado" type="category" fontSize={10} width={80} />
                <Tooltip />
                <Legend />

                <Bar
                  dataKey="cantidad"
                  barSize={18}
                  fill="#f97316"
                  radius={[0, 6, 6, 0]}
                />

                <Line
                  type="monotone"
                  dataKey="meta"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Deuda asignada por equipo */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Deuda asignada por equipo
          </p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-bold text-slate-900">{kpis.cobertura}%</p>
            <span className="text-xs text-gray-500 mb-1">de tickets asignados</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Evolución mensual de la cobertura (data de prueba)
          </p>
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={coberturaMensualData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" fontSize={10} />
                <YAxis fontSize={10} domain={[0, 100]} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
                <Bar
                  dataKey="cobertura"
                  barSize={18}
                  radius={[4, 4, 0, 0]}
                  fill="#4f46e5"
                />
                <Line
                  type="monotone"
                  dataKey="meta"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Deuda promedio de la deuda asignada por equipo */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Deuda promedio de la deuda asignada por equipo
          </p>
          <div className="flex items-end gap-2 mt-1">
            <p className="text-3xl font-bold text-slate-900">{kpis.cobertura}%</p>
            <span className="text-xs text-gray-500 mb-1">de tickets asignados</span>
          </div>
          <p className="text-[11px] text-gray-500">
            Evolución mensual de la cobertura (data de prueba)
          </p>
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={coberturaMensualData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" fontSize={10} />
                <YAxis fontSize={10} domain={[0, 100]} />
                <Tooltip formatter={(v: any) => `${v}%`} />
                <Legend />
                <Bar
                  dataKey="cobertura"
                  barSize={18}
                  radius={[4, 4, 0, 0]}
                  fill="#4f46e5"
                />
                <Line
                  type="monotone"
                  dataKey="meta"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
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
          {/* Filtro Estado */}
          <span className="text-sm text-gray-500 font-medium text-slate-700">Estado:</span>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 sm:text-sm rounded-md bg-white text-slate-900"
          >
            <option value="Activos">Activos (Pend + Ejec)</option>
            <option value="Todos">Todos</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Ejecucion">En Ejecución</option>
            <option value="Finalizado">Finalizado</option>
          </select>

          {/* Filtro Cartera */}
          <span className="text-sm text-gray-500 font-medium text-slate-700 ml-4">Cartera:</span>
          <select
            value={filtroCartera}
            onChange={(e) => setFiltroCartera(e.target.value)}
            className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 sm:text-sm rounded-md bg-white text-slate-900"
          >
            <option value="Todas">Todas</option>
            <option value="Temprana">Temprana</option>
            <option value="Tardia">Tardía</option>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">ID</th>
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
              ) : ticketsPaginados.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">{supabase ? "No hay tickets." : "⚠️ Descomenta Supabase."}</td></tr>
              ) : ticketsPaginados.map((t) => (
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
                      href={`/modules/reports/${t.codigo_ticket}`}
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

        {/* PAGINACIÓN */}
        {totalPaginas > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Mostrando página <span className="font-medium">{paginaActual}</span> de <span className="font-medium">{totalPaginas}</span>
            </div>
            <div className="flex gap-2">
              {/* Botón Anterior */}
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className={`px-3 py-1 rounded-md text-sm font-medium border ${paginaActual === 1
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                &lt;
              </button>

              {/* Números de Página */}
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                // Lógica para mostrar ventana de páginas cercana a la actual
                let pageNum = paginaActual - 2 + i
                if (paginaActual < 3) pageNum = i + 1
                if (paginaActual > totalPaginas - 2) pageNum = totalPaginas - 4 + i

                // Asegurar límites
                if (pageNum < 1) pageNum = i + 1
                if (pageNum > totalPaginas) return null

                return (
                  <button
                    key={pageNum}
                    onClick={() => setPaginaActual(pageNum)}
                    className={`px-3 py-1 rounded-md text-sm font-medium border ${paginaActual === pageNum
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    {pageNum}
                  </button>
                )
              })}

              {/* Botón Siguiente */}
              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className={`px-3 py-1 rounded-md text-sm font-medium border ${paginaActual === totalPaginas
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-gray-300 hover:bg-gray-50'
                  }`}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}