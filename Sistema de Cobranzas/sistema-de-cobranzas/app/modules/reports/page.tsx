'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
  Legend,
  ComposedChart,
} from 'recharts'

/* ----------------------------------- */
/* TIPOS DE DATOS PARA LAS VISTAS */
/* ----------------------------------- */

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

interface DeudaTotalEnProceso {
  Periodo: string
  'Deuda En Proceso': number
  'Monto Maximo Deuda': number
}

interface DeudaPorEstado {
  Estado: string
  Deuda: number
}

interface DeudaPorCartera {
  Cartera: string
  'Deuda En Proceso': number
}

interface DeudaPorProducto {
  Categoria: string
  Producto: string
  'Deuda En Proceso': number
}

interface DeudaAsignadaPorEquipo {
  Equipo: string
  'Deuda Asignada': number
}

interface MoraPromedioPorEquipo {
  Equipo: string
  'Dias de Mora Promedio': number
}

/* ----------------------------------- */
/* CONSTANTES Y CONFIGURACIÓN */
/* ----------------------------------- */

const PIE_COLORS = ['#3b82f6', '#f97316', '#22c55e']

function getCarteraPieColor(carteraOEstado: string) {
  switch (carteraOEstado) {
    case 'En Ejecucion':
    case 'Intermedia':
      return PIE_COLORS[0]
    case 'Pendiente':
    case 'Tardia':
      return PIE_COLORS[1]
    case 'Finalizado':
    case 'Temprana':
      return PIE_COLORS[2]
    default:
      return '#9ca3af'
  }
}

/* ----------------------------------- */
/* COMPONENTE PRINCIPAL */
/* ----------------------------------- */

export default function ModuloReportes() {
  const supabase = useMemo(() => createClient(), [])

  const [tickets, setTickets] = useState<TicketProgramado[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('Activos')
  const [filtroCartera, setFiltroCartera] = useState('Todas')
  const [paginaActual, setPaginaActual] = useState(1)
  const ITEMS_POR_PAGINA = 20
  const [mensaje, setMensaje] = useState<{ tipo: 'error' | 'success'; texto: string } | null>(null)

  const [totalDeudaData, setTotalDeudaData] = useState<DeudaTotalEnProceso | null>(null)
  const [deudaPorEstadoData, setDeudaPorEstadoData] = useState<DeudaPorEstado[]>([])
  const [deudaPorCarteraProcesoData, setDeudaPorCarteraProcesoData] = useState<DeudaPorCartera[]>([])
  const [deudaPorProductoData, setDeudaPorProductoData] = useState<DeudaPorProducto[]>([])
  const [deudaAsignadaEquipoData, setDeudaAsignadaEquipoData] = useState<DeudaAsignadaPorEquipo[]>([])
  const [moraPromedioEquipoData, setMoraPromedioEquipoData] = useState<MoraPromedioPorEquipo[]>([])

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    cargarProgramacion()
    cargarDatosReportes()
  }, [])

  /* ----------------------------------- */
  /* FUNCIONES DE CARGA DE DATOS */
  /* ----------------------------------- */

  async function cargarProgramacion() {
    try {
      const { data, error } = await supabase.rpc('get_programacion')

      if (error) throw error
      setTickets((data as any[]) || [])
    } catch (err: any) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'Error cargando tickets: ' + err.message })
    }
  }

  async function cargarTotalDeudaEnProceso() {
    const { data, error } = await supabase
      .schema('modulo_reportes')
      .from('vw_total_deuda_en_proceso')
      .select('Periodo, "Deuda En Proceso", "Monto Maximo Deuda"')
      .maybeSingle()

    if (error) throw error
    setTotalDeudaData(data as DeudaTotalEnProceso)
  }

  async function cargarEstadoDeudaTotal() {
    const { data, error } = await supabase
      .schema('modulo_reportes')
      .from('vw_estado_de_la_deuda_total')
      .select('Estado, Deuda')
      .order('Deuda', { ascending: false })

    if (error) throw error
    setDeudaPorEstadoData(data as DeudaPorEstado[])
  }

  async function cargarDeudaEnProcesoPorCartera() {
    const { data, error } = await supabase
      .schema('modulo_reportes')
      .from('vw_deuda_en_proceso_por_cartera')
      .select('Cartera, "Deuda En Proceso"')
      .order('Deuda En Proceso', { ascending: false })

    if (error) throw error
    setDeudaPorCarteraProcesoData(data as DeudaPorCartera[])
  }

  async function cargarDeudaEnProcesoPorProducto() {
    const { data, error } = await supabase
      .schema('modulo_reportes')
      .from('vw_deuda_en_proceso_por_producto')
      .select('Categoria, Producto, "Deuda En Proceso"')
      .order('Deuda En Proceso', { ascending: false })
      .limit(5)

    if (error) throw error
    setDeudaPorProductoData(data as DeudaPorProducto[])
  }

  async function cargarDeudaAsignadaPorEquipo() {
    const { data, error } = await supabase
      .schema('modulo_reportes')
      .from('vw_deuda_asignada_por_equipo')
      .select('Equipo, "Deuda Asignada"')
      .order('Deuda Asignada', { ascending: false })

    if (error) throw error
    setDeudaAsignadaEquipoData(data as DeudaAsignadaPorEquipo[])
  }

  async function cargarMoraPromedioDeudaAsignadaPorEquipo() {
    const { data, error } = await supabase
      .schema('modulo_reportes')
      .from('vw_mora_promedio_de_la_deuda_asignada_por_equipo')
      .select('Equipo, "Dias de Mora Promedio"')
      .order('Dias de Mora Promedio', { ascending: false })

    if (error) throw error
    setMoraPromedioEquipoData(data as MoraPromedioPorEquipo[])
  }

  async function cargarDatosReportes() {
    setLoading(true)
    try {
      await Promise.all([
        cargarTotalDeudaEnProceso(),
        cargarEstadoDeudaTotal(),
        cargarDeudaEnProcesoPorCartera(),
        cargarDeudaEnProcesoPorProducto(),
        cargarDeudaAsignadaPorEquipo(),
        cargarMoraPromedioDeudaAsignadaPorEquipo(),
      ])
    } catch (err: any) {
      console.error('Error cargando reportes:', err)
      setMensaje(prev => prev ?? {
        tipo: 'error',
        texto: 'Error general cargando reportes: ' + err.message,
      })
    } finally {
      setLoading(false)
    }
  }

  /* ----------------------------------- */
  /* DATOS CALCULADOS */
  /* ----------------------------------- */

  const kpis = useMemo(() => {
    const totalDeuda = deudaPorEstadoData.reduce((acc, t) => acc + t.Deuda, 0)
    return { totalDeuda }
  }, [deudaPorEstadoData])

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

  const { ticketsPaginados, totalPaginas } = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA
    const fin = inicio + ITEMS_POR_PAGINA
    return {
      ticketsPaginados: ticketsFiltrados.slice(inicio, fin),
      totalPaginas: Math.ceil(ticketsFiltrados.length / ITEMS_POR_PAGINA)
    }
  }, [ticketsFiltrados, paginaActual])

  const deudaActualProceso = totalDeudaData ? Number(totalDeudaData['Deuda En Proceso']) : 0
  const deudaMaxReferencia = totalDeudaData ? Number(totalDeudaData['Monto Maximo Deuda']) : 5_000_000
  const porcentajeDeuda = (deudaActualProceso / deudaMaxReferencia) * 100

  const deudaGaugeData = useMemo(() => ([
    { name: 'En proceso', value: deudaActualProceso },
    { name: 'Disponible', value: Math.max(deudaMaxReferencia - deudaActualProceso, 0) },
  ]), [deudaActualProceso, deudaMaxReferencia])

  const estadoDeudaPieData = useMemo(() => (
    deudaPorEstadoData.map(d => ({
      name: d.Estado,
      value: d.Deuda,
    }))
  ), [deudaPorEstadoData])

  const carteraProcesoPieData = useMemo(() => (
    deudaPorCarteraProcesoData.map(d => ({
      name: d.Cartera,
      value: d['Deuda En Proceso'],
    }))
  ), [deudaPorCarteraProcesoData])

  const productoBarLineData = useMemo(() => {
    return deudaPorProductoData.map(d => ({
      producto: d.Producto,
      deuda: d['Deuda En Proceso'],
    }))
    .sort((a, b) => b.deuda - a.deuda)
  }, [deudaPorProductoData])

  const deudaEquipoBarData = useMemo(() => {
    return deudaAsignadaEquipoData.map(d => ({
      equipo: d.Equipo.replace('Equipo ', ''),
      'Deuda Asignada': d['Deuda Asignada'],
    }))
  }, [deudaAsignadaEquipoData])

  const moraPromedioBarData = useMemo(() => {
    return moraPromedioEquipoData.map(d => ({
      equipo: d.Equipo.replace('Equipo ', ''),
      'Días de Mora Promedio': d['Dias de Mora Promedio'],
    }))
  }, [moraPromedioEquipoData])

  return (
    <div className="min-h-screen bg-gray-50 p-8 relative text-slate-900 pb-24">

      {/* TÍTULO Y ACCIONES */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Módulo de Reportes</h1>
          <p className="text-gray-500 text-sm mt-1">Dashboard de metas y reportes</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              cargarProgramacion()
              cargarDatosReportes()
            }}
            className="px-4 py-2 bg-white border border-gray-300 text-slate-700 rounded-md hover:bg-gray-50 shadow-sm transition-all text-sm font-medium"
          >
            ↻ Actualizar
          </button>
        </div>
      </div>

      {/* --- SECCIÓN DE GRÁFICOS SUPERIORES --- */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Card 1: Total deuda en proceso (Gauge) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Total deuda en proceso
          </p>

          <div className="mt-4 h-32 relative">
            <ResponsiveContainer width="100%" height="170%">
              <PieChart>
                <Pie
                  data={deudaGaugeData}
                  dataKey="value"
                  startAngle={180}
                  endAngle={0}
                  innerRadius={60}
                  outerRadius={80}
                  stroke="none"
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#e5e7eb" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-10">
              <p className="text-lg font-bold text-slate-900">
                {(deudaActualProceso / 1_000_000).toFixed(2)} mill.
              </p>
              <p className="text-[10px] text-gray-500">
                ({porcentajeDeuda.toFixed(2)}%)
              </p>
            </div>

            <span className="absolute left-10 bottom-0 text-[10px] text-gray-500">
              0,00 mill.
            </span>
            <span className="absolute right-10 bottom-0 text-[10px] text-gray-500">
              {(deudaMaxReferencia / 1_000_000).toFixed(0)} mill.
            </span>
          </div>
        </div>

        {/* Card 2: Estado de la deuda total (PieChart) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Estado de la deuda total
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            S/ {kpis.totalDeuda.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Distribución por estado
          </p>
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={estadoDeudaPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={24}
                  outerRadius={45}
                  paddingAngle={2}
                >
                  {estadoDeudaPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={getCarteraPieColor(entry.name)}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name, entry) => [
                    `S/ ${Number(value).toLocaleString('es-PE', { maximumFractionDigits: 0 })} (${((value / kpis.totalDeuda) * 100).toFixed(2)}%)`,
                    entry.name,
                  ]}
                />
                <Legend
                  verticalAlign="bottom"
                  align="left"
                  iconSize={8}
                  layout="vertical"
                  wrapperStyle={{ fontSize: 10, paddingLeft: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 3: Deuda en proceso por cartera (PieChart) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Deuda en proceso por cartera
          </p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            S/ {carteraProcesoPieData.reduce((acc, d) => acc + d.value, 0).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            Distribución por tipo de cartera
          </p>
          <div className="mt-3 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={carteraProcesoPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={24}
                  outerRadius={45}
                  paddingAngle={2}
                >
                  {carteraProcesoPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCarteraPieColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name, entry) => {
                    const total = carteraProcesoPieData.reduce((acc, d) => acc + d.value, 0);
                    return [
                      `S/ ${Number(value).toLocaleString('es-PE', { maximumFractionDigits: 0 })} (${((value / total) * 100).toFixed(2)}%)`,
                      entry.name,
                    ];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  align="left"
                  iconSize={8}
                  layout="vertical"
                  wrapperStyle={{ fontSize: 10, paddingLeft: 10 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN DE GRÁFICOS INFERIORES --- */}
      <div className="max-w-7xl mx-auto mb-8 grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Card 4: Deuda en proceso por producto (Bar/Line Chart) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Deuda en proceso por producto
          </p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={productoBarLineData}
                layout="vertical"
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  fontSize={10}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <YAxis dataKey="producto" type="category" fontSize={10} width={100} />
                <Tooltip formatter={(value: any) => `S/ ${Number(value).toLocaleString('es-PE', { maximumFractionDigits: 0 })}`} />
                <Bar
                  dataKey="deuda"
                  name="Deuda"
                  barSize={18}
                  fill="#3b82f6"
                  radius={[0, 6, 6, 0]}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 5: Deuda asignada por equipo (Bar Chart) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Deuda asignada por equipo
          </p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={deudaEquipoBarData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="equipo" fontSize={10} angle={-25} textAnchor="end" height={40} />
                <YAxis fontSize={10} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: any) => `S/ ${Number(value).toLocaleString('es-PE', { maximumFractionDigits: 0 })}`} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 30}} />
                <Bar
                  dataKey="Deuda Asignada"
                  barSize={18}
                  radius={[4, 4, 0, 0]}
                  fill="#3b82f6"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 6: Mora promedio de la deuda asignada por equipo (Bar Chart) */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Mora promedio de la deuda asignada por equipo
          </p>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={moraPromedioBarData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="equipo" fontSize={10} angle={-25} textAnchor="end" height={40} />
                <YAxis fontSize={10} />
                <Tooltip formatter={(value: any) => `${Number(value).toFixed(1)} días`} />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 30 }} />
                <Bar
                  dataKey="Días de Mora Promedio"
                  barSize={18}
                  radius={[4, 4, 0, 0]}
                  fill="#3b82f6"
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
            <option value="Intermedia">Intermedia</option>
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
                let pageNum = paginaActual - 2 + i
                if (paginaActual < 3) pageNum = i + 1
                if (paginaActual > totalPaginas - 2) pageNum = totalPaginas - 4 + i

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