'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'

type Caso = {
  id: number
  ticket_id: number
  cliente: string
  cartera: string | null
  monto_pendiente: number | null
  estado: string | null
  asignado_a: string | null
  created_at: string
}

type CasoConContadores = Caso & {
  negociaciones: number
  gestiones: number
  ultimo_seguimiento: string | null
  fecha_ultimo_seguimiento: string | null
}

export default function OperationsPage() {
  const router = useRouter()
  const [casos, setCasos] = useState<CasoConContadores[]>([])
  const [operadores, setOperadores] = useState<string[]>([])
  const [operadorSeleccionado, setOperadorSeleccionado] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroCartera, setFiltroCartera] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState<string>('')
  const [carteras, setCarteras] = useState<string[]>([])
  const [verTodos, setVerTodos] = useState<boolean>(false)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )

  // CARGAR OPERADORES Y CASOS
  useEffect(() => {
    loadOperadores()
  }, [])

  // CARGAR CASOS CUANDO CAMBIA OPERADOR O VISTA
  useEffect(() => {
    if (operadorSeleccionado) {
      loadCasosConContadores()
    }
  }, [operadorSeleccionado, verTodos])

  async function loadOperadores() {
    setLoading(true)
    try {
      const client = supabase as any

      // ✅ OBTENER OPERADORES ÚNICOS (REC-XXX)
      const { data: casosData, error } = await client
        .schema('modulo_operaciones')
        .from('caso_cobranza')
        .select('asignado_a')
        .like('asignado_a', 'REC-%')
        .neq('asignado_a', null)

      if (error) throw error

      // Extraer operadores únicos y ordenar
      const operadoresUnicos = [...new Set(casosData?.map(c => c.asignado_a).filter(Boolean))] as string[]
      operadoresUnicos.sort()

      setOperadores(operadoresUnicos)
      
      // Seleccionar el primer operador por defecto
      if (operadoresUnicos.length > 0) {
        setOperadorSeleccionado(operadoresUnicos[0])
      }
    } catch (err) {
      console.error('Error al cargar operadores:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadCasosConContadores() {
    setLoading(true)
    try {
      const client = supabase as any

      let query = client
        .schema('modulo_operaciones')
        .from('caso_cobranza')
        .select('*')

      // ✅ FILTRAR POR OPERADOR O TODOS LOS OPERADORES
      if (!verTodos) {
        query = query.eq('asignado_a', operadorSeleccionado)
      } else {
        query = query.like('asignado_a', 'REC-%')
      }

      const { data: casosData, error: casosError } = await query.order('created_at', { ascending: false })

      if (casosError) throw casosError

      const titulo = verTodos ? 'todos los operadores' : operadorSeleccionado
      console.log(`✅ Casos cargados para ${titulo}:`, casosData?.length)

      // Cargar carteras únicas
      const carterasUnicas = [...new Set(casosData?.map(c => c.cartera).filter(Boolean))] as string[]
      setCarteras(carterasUnicas)

      // Agregar contadores a cada caso
      const casosConContadores = await Promise.all(
        (casosData || []).map(async (caso) => {
          // Contar negociaciones
          const { count: negCount } = await client
            .schema('modulo_operaciones')
            .from('negociacion')
            .select('*', { count: 'exact', head: true })
            .eq('caso_id', caso.id)

          // Contar gestiones
          const { count: gesCount } = await client
            .schema('modulo_operaciones')
            .from('gestion_cobranza')
            .select('*', { count: 'exact', head: true })
            .eq('caso_id', caso.id)

          // ✅ OBTENER ÚLTIMO SEGUIMIENTO
          const { data: ultimoSegData } = await client
            .schema('modulo_operaciones')
            .from('seguimiento_notificacion')
            .select('resultado, created_at')
            .eq('caso_id', caso.id)
            .order('created_at', { ascending: false })
            .limit(1)

          const ultimoSeguimiento = ultimoSegData?.[0]?.resultado || null
          const fechaUltimoSeguimiento = ultimoSegData?.[0]?.created_at || null

          return {
            ...caso,
            negociaciones: negCount || 0,
            gestiones: gesCount || 0,
            ultimo_seguimiento: ultimoSeguimiento,
            fecha_ultimo_seguimiento: fechaUltimoSeguimiento
          }
        })
      )

      setCasos(casosConContadores)
    } catch (err) {
      console.error('Error al cargar casos:', err)
    } finally {
      setLoading(false)
    }
  }

  // FILTRAR CASOS
  const casosFiltrados = casos.filter(caso => {
    const cumpleEstado = filtroEstado === 'todos' || caso.estado === filtroEstado
    const cumpleCartera = filtroCartera === 'todos' || caso.cartera === filtroCartera
    const cumpleBusqueda =
      busqueda === '' ||
      caso.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
      caso.ticket_id.toString().includes(busqueda)

    return cumpleEstado && cumpleCartera && cumpleBusqueda
  })

  // HELPERS
  const getEstadoColor = (estado: string | null) => {
    const colores: Record<string, { bg: string; text: string; badge: string }> = {
      'activo': { bg: 'bg-blue-50', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-700' },
      'en_negociacion': { bg: 'bg-purple-50', text: 'text-purple-900', badge: 'bg-purple-100 text-purple-700' },
      'derivado_protesto': { bg: 'bg-red-50', text: 'text-red-900', badge: 'bg-red-100 text-red-700' },
      'pagado': { bg: 'bg-green-50', text: 'text-green-900', badge: 'bg-green-100 text-green-700' },
      'cerrado': { bg: 'bg-slate-50', text: 'text-slate-900', badge: 'bg-slate-100 text-slate-700' }
    }
    return colores[estado || 'activo'] || colores['activo']
  }

  const getCarteraColor = (cartera: string | null) => {
    const colores: Record<string, string> = {
      'normal': 'bg-emerald-100 text-emerald-700',
      'riesgo': 'bg-orange-100 text-orange-700',
      'alto_riesgo': 'bg-red-100 text-red-700',
      'vencido': 'bg-pink-100 text-pink-700'
    }
    return colores[cartera || 'normal'] || 'bg-gray-100 text-gray-700'
  }

  // HELPER PARA SEGUIMIENTO
  const getSeguimientoColor = (resultado: string | null) => {
    const colores: Record<string, { bg: string; text: string; icon: string }> = {
      'contactado_pago_total': { bg: 'bg-green-100', text: 'text-green-700', icon: '✅' },
      'promesa_pago': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '📅' },
      'no_contactado': { bg: 'bg-red-100', text: 'text-red-700', icon: '❌' },
      'buzon': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '📞' },
      'rechazo_pago': { bg: 'bg-orange-100', text: 'text-orange-700', icon: '🚫' },
      'domicilio_incorrecto': { bg: 'bg-pink-100', text: 'text-pink-700', icon: '🏠' }
    }
    return colores[resultado || 'no_contactado'] || { bg: 'bg-gray-100', text: 'text-gray-700', icon: '❓' }
  }

  const getSeguimientoLabel = (resultado: string | null) => {
    const labels: Record<string, string> = {
      'contactado_pago_total': 'Contactado - Pago Total',
      'promesa_pago': 'Promesa de Pago',
      'no_contactado': 'No Contactado',
      'buzon': 'Buzón de Voz',
      'rechazo_pago': 'Rechazo de Pago',
      'domicilio_incorrecto': 'Domicilio Incorrecto'
    }
    return labels[resultado || 'no_contactado'] || 'Sin Seguimiento'
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-slate-600 font-semibold">Cargando operadores y casos...</p>
        </div>
      </div>
    )
  }

  // RENDER
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">📋 Casos de Cobranza</h1>
          <p className="text-slate-600 mb-6">Gestiona los casos por operador</p>

          {/* ✅ SELECTOR DE OPERADOR - COLORES MEJORADOS */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-xl border border-slate-700 p-6 mb-6">
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-sm font-semibold text-white whitespace-nowrap">👤 Seleccionar Operador:</label>
              <select
                value={operadorSeleccionado}
                onChange={(e) => {
                  setOperadorSeleccionado(e.target.value)
                  setVerTodos(false)
                }}
                disabled={verTodos}
                className="flex-1 min-w-[200px] px-4 py-3 border-2 border-amber-400 rounded-lg font-semibold text-lg text-slate-900 focus:ring-2 focus:ring-amber-300 bg-white disabled:bg-slate-200 disabled:border-slate-400 disabled:text-slate-600 transition-all"
              >
                {operadores.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
              
              {/* ✅ BOTÓN VER TODOS */}
              <button
                onClick={() => setVerTodos(!verTodos)}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-all whitespace-nowrap ${
                  verTodos
                    ? 'bg-amber-500 hover:bg-amber-600 ring-2 ring-amber-300'
                    : 'bg-slate-600 hover:bg-slate-700'
                }`}
              >
                {verTodos ? '✅ Ver Todos' : '👁️ Ver Todos'}
              </button>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-lg border-l-4 border-blue-600 p-4">
              <div className="text-slate-600 text-sm font-semibold mb-1">Total de Casos</div>
              <div className="text-3xl font-bold text-blue-600">{casos.length}</div>
              <div className="text-xs text-slate-500 mt-1">{verTodos ? 'Todos los operadores' : operadorSeleccionado}</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border-l-4 border-purple-600 p-4">
              <div className="text-slate-600 text-sm font-semibold mb-1">En Negociación</div>
              <div className="text-3xl font-bold text-purple-600">
                {casos.filter(c => c.estado === 'en_negociacion').length}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border-l-4 border-red-600 p-4">
              <div className="text-slate-600 text-sm font-semibold mb-1">Derivados a Protesto</div>
              <div className="text-3xl font-bold text-red-600">
                {casos.filter(c => c.estado === 'derivado_protesto').length}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg border-l-4 border-green-600 p-4">
              <div className="text-slate-600 text-sm font-semibold mb-1">Pagados</div>
              <div className="text-3xl font-bold text-green-600">
                {casos.filter(c => c.estado === 'pagado').length}
              </div>
            </div>
          </div>
        </div>

        {/* FILTROS Y BÚSQUEDA */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* BÚSQUEDA */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">🔍 Buscar por Cliente o Ticket</label>
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Ej: Juan Pérez, #12345"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* FILTRO ESTADO */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">📊 Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">-- Todos --</option>
                <option value="activo">🔵 Activo</option>
                <option value="en_negociacion">💜 En Negociación</option>
                <option value="derivado_protesto">⚖️ Protesto</option>
                <option value="pagado">✅ Pagado</option>
                <option value="cerrado">🔒 Cerrado</option>
              </select>
            </div>

            {/* FILTRO CARTERA */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">🏦 Cartera</label>
              <select
                value={filtroCartera}
                onChange={(e) => setFiltroCartera(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">-- Todas --</option>
                {carteras.map(cartera => (
                  <option key={cartera} value={cartera}>{cartera}</option>
                ))}
              </select>
            </div>

            {/* BOTÓN LIMPIAR */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setBusqueda('')
                  setFiltroEstado('todos')
                  setFiltroCartera('todos')
                }}
                className="w-full px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg font-semibold transition-all"
              >
                🔄 Limpiar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* RESULTADOS */}
        <div className="space-y-4">
          {casosFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-2xl font-bold text-slate-700 mb-2">Sin resultados</p>
              <p className="text-slate-600">No hay casos que coincidan con los filtros seleccionados</p>
            </div>
          ) : (
            casosFiltrados.map((caso) => {
              const colores = getEstadoColor(caso.estado)
              const seguimientoColor = getSeguimientoColor(caso.ultimo_seguimiento)
              return (
                <div
                  key={caso.id}
                  onClick={() => router.push(`/modules/operations/${caso.id}`)}
                  className={`${colores.bg} rounded-2xl shadow-lg border-l-4 p-6 cursor-pointer hover:shadow-2xl transition-all transform hover:scale-[1.01]`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                    
                    {/* CLIENTE Y TICKET */}
                    <div>
                      <div className="text-xs text-slate-600 mb-1">CLIENTE</div>
                      <h3 className="text-lg font-bold text-slate-800 mb-2">{caso.cliente}</h3>
                      <div className="text-sm text-slate-600">Ticket: <span className="font-semibold">#{caso.ticket_id}</span></div>
                    </div>

                    {/* DEUDA */}
                    <div>
                      <div className="text-xs text-slate-600 mb-1">DEUDA PENDIENTE</div>
                      <div className="text-2xl font-bold text-red-600">S/ {caso.monto_pendiente?.toFixed(2) || '0.00'}</div>
                      <div className="text-xs text-slate-600 mt-1">
                        {caso.cartera && (
                          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getCarteraColor(caso.cartera)}`}>
                            {caso.cartera.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* CONTADORES */}
                    <div>
                      <div className="text-xs text-slate-600 mb-1">GESTIÓN</div>
                      <div className="flex gap-3">
                        <div className="bg-white/70 px-3 py-2 rounded-lg text-center">
                          <div className="text-2xl font-bold text-purple-600">{caso.negociaciones}</div>
                          <div className="text-xs text-slate-600">Negociaciones</div>
                        </div>
                        <div className="bg-white/70 px-3 py-2 rounded-lg text-center">
                          <div className="text-2xl font-bold text-blue-600">{caso.gestiones}</div>
                          <div className="text-xs text-slate-600">Gestiones</div>
                        </div>
                      </div>
                    </div>

                    {/* ✅ ÚLTIMO SEGUIMIENTO */}
                    <div>
                      <div className="text-xs text-slate-600 mb-1">ÚLTIMO SEGUIMIENTO</div>
                      {caso.ultimo_seguimiento ? (
                        <div>
                          <div className={`inline-block px-3 py-2 rounded-full font-semibold text-sm ${seguimientoColor.bg} ${seguimientoColor.text}`}>
                            {seguimientoColor.icon} {getSeguimientoLabel(caso.ultimo_seguimiento)}
                          </div>
                          <div className="text-xs text-slate-600 mt-2">
                            {caso.fecha_ultimo_seguimiento && new Date(caso.fecha_ultimo_seguimiento).toLocaleDateString('es-PE')}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic">Sin seguimiento</div>
                      )}
                    </div>

                    {/* BOTÓN */}
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/modules/operations/${caso.id}`)
                        }}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all text-sm"
                      >
                        Detalles →
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}