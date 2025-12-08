'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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

type Seguimiento = {
  id: number
  caso_id: number
  notificacion_id: number
  tipo_contacto: string
  resultado: string
  monto_promesa: number | null
  fecha_promesa: string | null
  nota: string | null
  creado_por: string
  created_at: string
}

type Negociacion = {
  id: number
  caso_id: number
  ticket_id: number
  promo_aplicada: string
  monto_original: number | null
  monto_oferta: number | null
  cuotas: number | null
  fecha_vencimiento: string | null
  tipo_refinanciamiento: string | null
  notas: string | null
  created_at: string
}

type Incentivo = {
  id: number
  nombre: string
  descripcion: string
  tipo: string
  valor: number | null
  porcentaje: number | null
  activo: boolean
}

type Refinanciamiento = {
  id: number
  nombre: string
  descripcion: string
  plazo_minimo: number
  plazo_maximo: number
  tasa_interes: number
  monto_minimo: number
  monto_maximo: number
  activo: boolean
}

type PlantillaMensaje = {
  id: number
  nombre: string
  codigo: string
  contenido: string
  canal: string
  estrategia: string
  activo: boolean
}

type Estrategia = {
  id: number
  caso_id: number
  tipo_estrategia: string
  criterios: any
  plantilla_id: number | null
  incentivo_id: number | null
  refinanciamiento_id: number | null
  estado: string
  fecha_inicio: string
  fecha_fin: string
}

type Notificacion = {
  id: number
  caso_id: number
  tipo: string
  titulo: string
  mensaje: string
  canal: string
  estado: string
  created_at: string
}

type NotificacionConSeguimientos = Notificacion & { seguimientos: Seguimiento[] }

export default function CasoDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string

  // ESTADOS - DATOS PRINCIPALES
  const [caso, setCaso] = useState<Caso | null>(null)
  const [negociacion, setNegociacion] = useState<Negociacion | null>(null)
  const [incentivos, setIncentivos] = useState<Incentivo[]>([])
  const [refinanciamientos, setRefinanciamientos] = useState<Refinanciamiento[]>([])
  const [plantillas, setPlantillas] = useState<PlantillaMensaje[]>([])
  const [estrategia, setEstrategia] = useState<Estrategia | null>(null)
  const [notificacionesConSeguimientos, setNotificacionesConSeguimientos] = useState<NotificacionConSeguimientos[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // ESTADOS - MODALES
  const [showNegociacionForm, setShowNegociacionForm] = useState(false)
  const [showEstrategiaModal, setShowEstrategiaModal] = useState(false)
  const [showCrearNotificacionForm, setShowCrearNotificacionForm] = useState(false)
  const [showProtestoModal, setShowProtestoModal] = useState(false)
  const [expandedNotification, setExpandedNotification] = useState<number | null>(null)
  const [editandoSeguimientoId, setEditandoSeguimientoId] = useState<number | null>(null)
  const [respondiendo, setRespondiendo] = useState<number | null>(null)

  // ESTADOS - FORMULARIO NEGOCIACIÓN
  const [nuevaPromo, setNuevaPromo] = useState('')
  const [nuevoMontoOferta, setNuevoMontoOferta] = useState('')
  const [nuevasCuotas, setNuevasCuotas] = useState('')
  const [nuevaFechaVencimiento, setNuevaFechaVencimiento] = useState('')
  const [nuevasNotas, setNuevasNotas] = useState('')
  const [nuevoRefinanciamiento, setNuevoRefinanciamiento] = useState<string>('')

  // ESTADOS - FORMULARIO NOTIFICACIÓN
  const [selectedPlantilla, setSelectedPlantilla] = useState<number | null>(null)
  const [canalNotificacion, setCanalNotificacion] = useState('email')

  // ESTADOS - FORMULARIO SEGUIMIENTO
  const [nuevoResultado, setNuevoResultado] = useState('contactado_pago_total')
  const [nuevoMontoPromesa, setNuevoMontoPromesa] = useState('')
  const [nuevaFechaPromesa, setNuevaFechaPromesa] = useState('')
  const [nuevaNota, setNuevaNota] = useState('')

  // ESTADOS - MODAL PROTESTO
  const [motivoProtesto, setMotivoProtesto] = useState('')
  const [observacionesProtesto, setObservacionesProtesto] = useState('')

  // CLIENTE SUPABASE
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

  // EFFECT: Cargar datos cuando cambia el ID
  useEffect(() => {
    if (id) {
      loadAll()
    }
  }, [id])

  // CARGAR TODOS LOS DATOS EN PARALELO
  async function loadAll() {
    setLoading(true)
    await Promise.all([
      loadCaso(),
      loadNegociacion(),
      loadIncentivos(),
      loadRefinanciamientos(),
      loadPlantillas(),
      loadEstrategia(),
      loadNotificacionesConSeguimientos()
    ])
    setLoading(false)
  }

  // CARGAR CASO
  async function loadCaso() {
    try {
      const client = supabase as any
      const { data, error } = await client
        .schema('modulo_operaciones')
        .from('caso_cobranza')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      setCaso(data)
    } catch (err) {
      console.error('Error al cargar caso:', err)
    }
  }

  // CARGAR NEGOCIACIÓN
  async function loadNegociacion() {
    try {
      const client = supabase as any
      const { data, error } = await client
        .schema('modulo_operaciones')
        .from('negociacion')
        .select('*')
        .eq('caso_id', id)
        .maybeSingle()
      if (error && error.code !== 'PGRST116') throw error
      setNegociacion(data)
    } catch (err) {
      console.error('Error al cargar negociación:', err)
    }
  }

  // CARGAR INCENTIVOS
  async function loadIncentivos() {
    try {
      const client = supabase as any
      const { data, error } = await client
        .schema('modulo_operaciones')
        .from('catalogo_incentivos')
        .select('*')
        .eq('activo', true)
        .order('nombre', { ascending: true })
      if (error) throw error
      setIncentivos(data || [])
    } catch (err) {
      console.error('Error al cargar incentivos:', err)
    }
  }

  // CARGAR REFINANCIAMIENTOS
  async function loadRefinanciamientos() {
    try {
      const client = supabase as any
      const { data, error } = await client
        .schema('modulo_estrategias')
        .from('refinanciamiento')
        .select('*')
        .order('nombre', { ascending: true })
      
      if (error) throw error
      
      const refinancTransformados = (data || []).map((r: any) => ({
        id: r.id_refinanciamiento,
        nombre: r.nombre,
        descripcion: r.descripcion || '',
        plazo_minimo: r.plazo_minimo || 0,
        plazo_maximo: r.plazo_maximo || 0,
        tasa_interes: r.tasa_interes || 0,
        monto_minimo: r.monto_minimo || 0,
        monto_maximo: r.monto_maximo || 0,
        activo: true
      }))
      
      setRefinanciamientos(refinancTransformados)
    } catch (err: any) {
      console.error('❌ Error al cargar refinanciamientos:', err)
      setRefinanciamientos([])
    }
  }

  // CARGAR PLANTILLAS
  async function loadPlantillas() {
    try {
      const client = supabase as any
      
      const { data: rpcData, error: rpcError } = await client.rpc('obtener_todas_plantillas_operaciones')
      
      if (!rpcError && rpcData) {
        setPlantillas(rpcData)
        return
      }
      
      const { data: plantillasData, error: directError } = await client
        .schema('modulo_estrategias')
        .from('plantilla')
        .select('id_plantilla, nombre, descripcion, contenido, id_canal, id_cartera')
        .order('nombre', { ascending: true })
      
      if (directError) throw directError
      
      const { data: canalesData } = await client
        .schema('modulo_estrategias')
        .from('canal_cobranza')
        .select('id_canal, nombre')
      
      const canalesMap = new Map(canalesData?.map((c: any) => [c.id_canal, c.nombre]) || [])
      
      const plantillasTransformadas = (plantillasData || []).map((p: any) => ({
        id: p.id_plantilla,
        nombre: p.nombre,
        codigo: `PLANT-${p.id_plantilla}`,
        contenido: p.contenido,
        canal: canalesMap.get(p.id_canal) || 'email',
        estrategia: p.descripcion || 'Sin descripción',
        activo: true
      }))
      
      setPlantillas(plantillasTransformadas)
    } catch (err: any) {
      console.error('❌ Error al cargar plantillas:', err)
      setPlantillas([])
    }
  }

  // CARGAR ESTRATEGIA
  async function loadEstrategia() {
    try {
      const client = supabase as any
      const { data, error } = await client
        .schema('modulo_operaciones')
        .from('estrategia_cobranza')
        .select('*')
        .eq('caso_id', id)
        .eq('estado', 'activa')
        .maybeSingle()
      if (error && error.code !== 'PGRST116') throw error
      setEstrategia(data)
    } catch (err) {
      console.error('Error al cargar estrategia:', err)
    }
  }

  // CARGAR NOTIFICACIONES CON SEGUIMIENTOS
  async function loadNotificacionesConSeguimientos() {
    try {
      const client = supabase as any
      const { data: notifs, error } = await client
        .schema('modulo_operaciones')
        .from('notificaciones')
        .select('*')
        .eq('caso_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const notifConSegs = await Promise.all(
        (notifs || []).map(async (notif) => {
          const { data: segs } = await client
            .schema('modulo_operaciones')
            .from('gestion_cobranza')
            .select('*')
            .eq('notificacion_id', notif.id)
            .order('created_at', { ascending: false })
          
          return {
            ...notif,
            seguimientos: segs || []
          }
        })
      )

      setNotificacionesConSeguimientos(notifConSegs)
    } catch (err) {
      console.error('Error al cargar notificaciones:', err)
    }
  }

  // INICIAR EDICIÓN NEGOCIACIÓN
  function iniciarEdicionNegociacion() {
    if (!negociacion) return
    setNuevaPromo(negociacion.promo_aplicada || '')
    setNuevoMontoOferta(negociacion.monto_oferta?.toString() || '')
    setNuevasCuotas(negociacion.cuotas?.toString() || '')
    setNuevaFechaVencimiento(negociacion.fecha_vencimiento || '')
    setNuevasNotas(negociacion.notas || '')
    setNuevoRefinanciamiento(negociacion.tipo_refinanciamiento || '')
    setShowNegociacionForm(true)
  }

  // INICIAR EDICIÓN SEGUIMIENTO
  function iniciarEdicionSeguimiento(seguimiento: Seguimiento) {
    setEditandoSeguimientoId(seguimiento.id)
    setNuevoResultado(seguimiento.resultado)
    setNuevoMontoPromesa(seguimiento.monto_promesa?.toString() || '')
    setNuevaFechaPromesa(seguimiento.fecha_promesa || '')
    setNuevaNota(seguimiento.nota || '')
    setRespondiendo(seguimiento.notificacion_id)
  }

  // CANCELAR EDICIÓN SEGUIMIENTO
  function cancelarEdicionSeguimiento() {
    setEditandoSeguimientoId(null)
    setRespondiendo(null)
    setNuevoResultado('contactado_pago_total')
    setNuevoMontoPromesa('')
    setNuevaFechaPromesa('')
    setNuevaNota('')
  }

  // CREAR NOTIFICACIÓN
  async function handleCrearNotificacion() {
    if (!selectedPlantilla) {
      alert('⚠️ Debes seleccionar una plantilla')
      return
    }
    setSaving(true)
    try {
      const client = supabase as any
      const plantilla = plantillas.find(p => p.id === selectedPlantilla)

      const { error } = await client
        .schema('modulo_operaciones')
        .from('notificaciones')
        .insert({
          caso_id: parseInt(id),
          tipo: 'notificacion_cobranza',
          titulo: plantilla?.nombre || 'Notificación',
          mensaje: plantilla?.contenido || '',
          canal: canalNotificacion,
          estado: 'enviada',
          created_at: new Date().toISOString()
        })

      if (error) throw new Error(error.message || JSON.stringify(error))
      alert('✅ Notificación creada y enviada correctamente')
      setSelectedPlantilla(null)
      setCanalNotificacion('email')
      setShowCrearNotificacionForm(false)
      loadNotificacionesConSeguimientos()
    } catch (err: any) {
      alert('❌ Error: ' + (err.message || 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  // GUARDAR SEGUIMIENTO
  async function handleGuardarSeguimiento(notificacionId: number) {
    if (!nuevoResultado) {
      alert('⚠️ Debes seleccionar un resultado')
      return
    }
    setSaving(true)
    try {
      const client = supabase as any
      const notif = notificacionesConSeguimientos.find(n => n.id === notificacionId)

      const canalToTipoContacto: Record<string, string> = {
        'email': 'email',
        'llamada': 'telefono',
        'whatsapp': 'whatsapp',
        'sms': 'sms',
        'visita': 'presencial'
      }

      const payload = {
        caso_id: parseInt(id),
        notificacion_id: notificacionId,
        tipo_contacto: canalToTipoContacto[notif?.canal || 'email'] || 'email',
        resultado: nuevoResultado,
        monto_promesa: nuevoMontoPromesa ? parseFloat(nuevoMontoPromesa) : null,
        fecha_promesa: nuevaFechaPromesa || null,
        nota: nuevaNota || null,
        creado_por: 'usuario_demo'
      }

      if (editandoSeguimientoId) {
        const { error } = await client
          .schema('modulo_operaciones')
          .from('gestion_cobranza')
          .update(payload)
          .eq('id', editandoSeguimientoId)
        
        if (error) throw new Error(error.message || JSON.stringify(error))
        alert('✅ Seguimiento actualizado correctamente')
      } else {
        const { error } = await client
          .schema('modulo_operaciones')
          .from('gestion_cobranza')
          .insert(payload)
        
        if (error) throw new Error(error.message || JSON.stringify(error))
        alert('✅ Seguimiento registrado correctamente')
      }

      cancelarEdicionSeguimiento()
      loadNotificacionesConSeguimientos()
    } catch (err: any) {
      console.error('❌ Error:', err)
      alert('❌ Error: ' + (err.message || 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  // ELIMINAR NOTIFICACIÓN
  async function handleEliminarNotificacion(notificacionId: number) {
    if (!confirm('⚠️ ¿Estás seguro de eliminar esta notificación?')) return
    setSaving(true)
    try {
      const client = supabase as any
      const { error } = await client
        .schema('modulo_operaciones')
        .from('notificaciones')
        .delete()
        .eq('id', notificacionId)
      
      if (error) throw new Error(error.message || JSON.stringify(error))
      alert('✅ Notificación eliminada correctamente')
      loadNotificacionesConSeguimientos()
    } catch (err: any) {
      alert('❌ Error: ' + (err.message || 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  // ELIMINAR SEGUIMIENTO
  async function handleEliminarSeguimiento(seguimientoId: number) {
    if (!confirm('⚠️ ¿Estás seguro de eliminar este seguimiento?')) return
    setSaving(true)
    try {
      const client = supabase as any
      const { error } = await client
        .schema('modulo_operaciones')
        .from('gestion_cobranza')
        .delete()
        .eq('id', seguimientoId)
      
      if (error) throw new Error(error.message || JSON.stringify(error))
      alert('✅ Seguimiento eliminado correctamente')
      loadNotificacionesConSeguimientos()
    } catch (err: any) {
      alert('❌ Error: ' + (err.message || 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  // GUARDAR NEGOCIACIÓN
  async function handleGuardarNegociacion() {
    if (!nuevaPromo || !nuevoMontoOferta) {
      alert('⚠️ Debes completar Promo y Monto de Oferta')
      return
    }
    setSaving(true)
    try {
      const client = supabase as any
      const payload = {
        caso_id: parseInt(id),
        ticket_id: caso?.ticket_id || 0,
        promo_aplicada: nuevaPromo,
        monto_original: caso?.monto_pendiente || null,
        monto_oferta: parseFloat(nuevoMontoOferta),
        cuotas: nuevasCuotas ? parseInt(nuevasCuotas) : null,
        fecha_vencimiento: nuevaFechaVencimiento || null,
        tipo_refinanciamiento: nuevoRefinanciamiento || null,
        notas: nuevasNotas || null,
        created_at: new Date().toISOString()
      }

      if (negociacion) {
        const { error } = await client
          .schema('modulo_operaciones')
          .from('negociacion')
          .update(payload)
          .eq('id', negociacion.id)
        if (error) throw error
        alert('✅ Negociación actualizada correctamente')
      } else {
        const { error } = await client
          .schema('modulo_operaciones')
          .from('negociacion')
          .insert(payload)
        if (error) throw error
        alert('✅ Negociación creada correctamente')
      }

      setShowNegociacionForm(false)
      loadNegociacion()
    } catch (err: any) {
      alert('❌ Error: ' + (err.message || 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  // ELIMINAR NEGOCIACIÓN
  async function handleEliminarNegociacion() {
    if (!negociacion || !confirm('⚠️ ¿Estás seguro de eliminar?')) return
    setSaving(true)
    try {
      const client = supabase as any
      const { error } = await client
        .schema('modulo_operaciones')
        .from('negociacion')
        .delete()
        .eq('id', negociacion.id)
      
      if (error) throw error
      alert('✅ Negociación eliminada correctamente')
      setNegociacion(null)
      setShowNegociacionForm(false)
    } catch (err: any) {
      alert('❌ Error: ' + (err.message || 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  // DERIVACIÓN A PROTESTO
  async function handleDerivacionProtesto() {
    if (!motivoProtesto) {
      alert('⚠️ Ingresa un motivo')
      return
    }
    setSaving(true)
    try {
      const client = supabase as any
      const criteriosInterbank = {
        dias_atraso: caso?.created_at ? Math.floor((Date.now() - new Date(caso.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        monto: caso?.monto_pendiente || 0,
        intentos_contacto: notificacionesConSeguimientos.reduce((sum, n) => sum + n.seguimientos.length, 0),
        cartera: caso?.cartera || 'normal'
      }

      const { error } = await client
        .schema('modulo_operaciones')
        .from('derivacion_protesto')
        .insert({
          caso_id: parseInt(id),
          ticket_id: caso?.ticket_id || 0,
          motivo: motivoProtesto,
          criterios_interbank: criteriosInterbank,
          observaciones: observacionesProtesto,
          created_at: new Date().toISOString()
        })

      if (error) throw error

      const { error: updateError } = await client
        .schema('modulo_operaciones')
        .from('caso_cobranza')
        .update({ estado: 'derivado_protesto' })
        .eq('id', id)

      if (updateError) throw updateError

      alert('✅ Caso derivado a Protesto Legal')
      setShowProtestoModal(false)
      loadCaso()
    } catch (err: any) {
      alert('❌ Error: ' + (err.message || 'Error desconocido'))
    } finally {
      setSaving(false)
    }
  }

  // HELPERS
  const getCanalIcon = (canal: string) => {
    const icons: Record<string, string> = {
      'email': '📧',
      'llamada': '📞',
      'whatsapp': '💬',
      'sms': '📱',
      'visita': '🚶'
    }
    return icons[canal] || '📬'
  }

  const getResultadoColor = (resultado: string) => {
    const colores: Record<string, string> = {
      'contactado_pago_total': 'bg-green-100 text-green-700 border-green-300',
      'promesa_pago': 'bg-blue-100 text-blue-700 border-blue-300',
      'no_contactado': 'bg-gray-100 text-gray-700 border-gray-300',
      'buzon': 'bg-yellow-100 text-yellow-700 border-yellow-300',
      'rechazo_pago': 'bg-red-100 text-red-700 border-red-300',
      'domicilio_incorrecto': 'bg-orange-100 text-orange-700 border-orange-300'
    }
    return colores[resultado] || 'bg-gray-100 text-gray-700 border-gray-300'
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-slate-600 font-semibold">Cargando...</p>
        </div>
      </div>
    )
  }

  // ERROR STATE - CASO NO ENCONTRADO
  if (!caso) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-2xl font-bold text-slate-700 mb-6">Caso no encontrado</p>
          <button
            onClick={() => router.push('/modules/operations')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-lg"
          >
            ← Volver al listado
          </button>
        </div>
      </div>
    )
  }
    // RENDER PRINCIPAL
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        
        {/* HEADER */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/modules/operations')}
            className="mb-4 flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-semibold shadow-md transition-all border border-slate-200"
          >
            ← Volver al listado
          </button>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                  📋 Caso #{caso.ticket_id} - {caso.cliente}
                </h1>
                <div className="flex gap-4 text-sm text-slate-600">
                  <span>🏦 Cartera: <span className="font-semibold">{caso.cartera || 'N/A'}</span></span>
                  <span>💰 Deuda: <span className="font-bold text-red-600">S/ {caso.monto_pendiente?.toFixed(2) || '0.00'}</span></span>
                  <span>📅 Creado: <span className="font-semibold">{new Date(caso.created_at).toLocaleDateString('es-PE')}</span></span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowEstrategiaModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all shadow-md"
                >
                  🎯 Ver Estrategia
                </button>
                <button
                  onClick={() => setShowProtestoModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all shadow-md"
                >
                  ⚖️ Derivar a Protesto
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* GRID 1+2 COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA 1: NEGOCIACIÓN */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">💼 Negociación</h2>
                {!negociacion ? (
                  <button
                    onClick={() => setShowNegociacionForm(true)}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all shadow-md"
                  >
                    ➕ Crear
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={iniciarEdicionNegociacion}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={handleEliminarNegociacion}
                      disabled={saving}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-all shadow-md disabled:opacity-50"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>

              {showNegociacionForm ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Promo Aplicada *</label>
                    <input
                      type="text"
                      value={nuevaPromo}
                      onChange={(e) => setNuevaPromo(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      placeholder="Ej: Descuento 20%"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Monto Original</label>
                      <input
                        type="number"
                        value={caso?.monto_pendiente || 0}
                        disabled
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Monto Oferta *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={nuevoMontoOferta}
                        onChange={(e) => setNuevoMontoOferta(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Cuotas</label>
                      <input
                        type="number"
                        value={nuevasCuotas}
                        onChange={(e) => setNuevasCuotas(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha Vencimiento</label>
                      <input
                        type="date"
                        value={nuevaFechaVencimiento}
                        onChange={(e) => setNuevaFechaVencimiento(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tipo Refinanciamiento</label>
                    <select
                      value={nuevoRefinanciamiento}
                      onChange={(e) => setNuevoRefinanciamiento(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">-- Selecciona --</option>
                      {refinanciamientos.map((ref) => (
                        <option key={ref.id} value={ref.nombre}>
                          {ref.nombre} ({ref.plazo_minimo}-{ref.plazo_maximo} meses)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Notas</label>
                    <textarea
                      value={nuevasNotas}
                      onChange={(e) => setNuevasNotas(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleGuardarNegociacion}
                      disabled={saving}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : '💾 Guardar'}
                    </button>
                    <button
                      onClick={() => setShowNegociacionForm(false)}
                      className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg font-semibold transition-all"
                    >
                      ❌
                    </button>
                  </div>
                </div>
              ) : negociacion ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-xs text-blue-600 mb-1">Promo</div>
                    <div className="font-bold text-blue-900">{negociacion.promo_aplicada}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-lg">
                      <div className="text-xs text-slate-600 mb-1">Monto Original</div>
                      <div className="font-bold text-slate-800">S/ {negociacion.monto_original?.toFixed(2)}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="text-xs text-green-600 mb-1">Monto Oferta</div>
                      <div className="font-bold text-green-700">S/ {negociacion.monto_oferta?.toFixed(2)}</div>
                    </div>
                  </div>
                  {negociacion.cuotas && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="text-xs text-purple-600 mb-1">Cuotas</div>
                      <div className="font-bold text-purple-900">{negociacion.cuotas} cuotas</div>
                    </div>
                  )}
                  {negociacion.fecha_vencimiento && (
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                      <div className="text-xs text-orange-600 mb-1">Vencimiento</div>
                      <div className="font-bold text-orange-900">{new Date(negociacion.fecha_vencimiento).toLocaleDateString('es-PE')}</div>
                    </div>
                  )}
                  {negociacion.tipo_refinanciamiento && (
                    <div className="bg-cyan-50 p-3 rounded-lg border border-cyan-200">
                      <div className="text-xs text-cyan-600 mb-1">Refinanciamiento</div>
                      <div className="font-bold text-cyan-900">{negociacion.tipo_refinanciamiento}</div>
                    </div>
                  )}
                  {negociacion.notas && (
                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="text-xs text-yellow-600 mb-1">Notas</div>
                      <div className="text-sm text-yellow-900">{negociacion.notas}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500">
                  <div className="text-6xl mb-3">💼</div>
                  <p className="text-lg">Sin negociación registrada</p>
                  <p className="text-sm mt-2">Haz clic en "Crear" para comenzar</p>
                </div>
              )}
            </div>
          </div>

          {/* COLUMNA 2+3: NOTIFICACIONES Y SEGUIMIENTOS */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* CREAR NUEVA NOTIFICACIÓN */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">📧 Crear Notificación</h2>
                <button
                  onClick={() => setShowCrearNotificacionForm(!showCrearNotificacionForm)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all shadow-md"
                >
                  {showCrearNotificacionForm ? '❌' : '➕ Nueva'}
                </button>
              </div>

              {showCrearNotificacionForm && (
                <div className="p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Selecciona Plantilla *</label>
                      <select
                        value={selectedPlantilla || ''}
                        onChange={(e) => setSelectedPlantilla(e.target.value ? parseInt(e.target.value) : null)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="">-- Selecciona una plantilla --</option>
                        {plantillas.map((plant) => (
                          <option key={plant.id} value={plant.id}>
                            {plant.nombre} - {plant.estrategia}
                          </option>
                        ))}
                      </select>
                    </div>

                    {selectedPlantilla && plantillas.find(p => p.id === selectedPlantilla) && (
                      <div className="bg-white p-4 rounded-lg border border-orange-300">
                        <div className="font-semibold text-orange-900 mb-2">📋 Vista Previa</div>
                        <div className="bg-orange-50 p-3 rounded text-sm text-slate-700 border border-orange-200 max-h-32 overflow-y-auto">
                          {plantillas.find(p => p.id === selectedPlantilla)?.contenido}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Canal de Envío *</label>
                      <select
                        value={canalNotificacion}
                        onChange={(e) => setCanalNotificacion(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="email">📧 Email</option>
                        <option value="llamada">📞 Llamada</option>
                        <option value="whatsapp">💬 WhatsApp</option>
                        <option value="sms">📱 SMS</option>
                        <option value="visita">🚶 Visita Presencial</option>
                      </select>
                    </div>

                    <div className="bg-slate-100 p-3 rounded-lg text-sm text-slate-600">
                      📅 Fecha: <span className="font-bold">{new Date().toLocaleDateString('es-PE')}</span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleCrearNotificacion}
                        disabled={saving || !selectedPlantilla}
                        className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition-all disabled:opacity-50"
                      >
                        {saving ? 'Enviando...' : '✅ Enviar Notificación'}
                      </button>
                      <button
                        onClick={() => {
                          setShowCrearNotificacionForm(false)
                          setSelectedPlantilla(null)
                          setCanalNotificacion('email')
                        }}
                        className="px-4 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg font-semibold transition-all"
                      >
                        ❌
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* LISTADO DE NOTIFICACIONES */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">📬 Notificaciones Enviadas</h2>
                <div className="bg-indigo-100 px-4 py-2 rounded-full">
                  <span className="text-sm font-semibold text-indigo-700">Total: {notificacionesConSeguimientos.length}</span>
                </div>
              </div>

              <div className="space-y-4 max-h-[800px] overflow-y-auto">
                {notificacionesConSeguimientos.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-6xl mb-3">📭</div>
                    <p className="text-lg">Sin notificaciones enviadas</p>
                  </div>
                ) : (
                  notificacionesConSeguimientos.map((notif) => (
                    <div key={notif.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 overflow-hidden shadow-md">
                      
                      {/* HEADER NOTIFICACIÓN */}
                      <div
                        onClick={() => setExpandedNotification(expandedNotification === notif.id ? null : notif.id)}
                        className="p-4 bg-blue-100 cursor-pointer hover:bg-blue-200 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-bold text-blue-900 flex items-center gap-2">
                              <span className="text-xl">{getCanalIcon(notif.canal)}</span>
                              {notif.titulo}
                            </div>
                            <div className="text-xs text-blue-700 mt-1">
                              📅 {new Date(notif.created_at).toLocaleDateString('es-PE')} - {new Date(notif.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-blue-600 mt-1">
                              📤 Canal: <span className="font-semibold">{notif.canal}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="bg-white px-3 py-1 rounded-full text-center">
                              <div className="text-xs text-slate-600">Seguimientos</div>
                              <div className="text-lg font-bold text-blue-600">{notif.seguimientos.length}</div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEliminarNotificacion(notif.id)
                              }}
                              disabled={saving}
                              className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                            >
                              🗑️
                            </button>
                            <span className="text-2xl text-blue-600">
                              {expandedNotification === notif.id ? '▼' : '▶'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* CONTENIDO EXPANDIBLE */}
                      {expandedNotification === notif.id && (
                        <div className="p-4 space-y-4">
                          
                          {/* MENSAJE */}
                          <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                            <div className="text-sm font-semibold text-slate-700 mb-2">📝 Mensaje</div>
                            <div className="text-sm text-slate-800 max-h-32 overflow-y-auto">{notif.mensaje}</div>
                          </div>

                          {/* SEGUIMIENTOS */}
                          <div className="bg-white p-4 rounded-lg border border-slate-200">
                            <div className="font-semibold text-slate-800 mb-3 flex items-center justify-between">
                              <span>📊 Seguimientos</span>
                              <button
                                onClick={() => setRespondiendo(respondiendo === notif.id ? null : notif.id)}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all"
                              >
                                ➕ Registrar
                              </button>
                            </div>

                            {/* FORMULARIO SEGUIMIENTO */}
                            {respondiendo === notif.id && (
                              <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <h4 className="text-sm font-bold text-slate-800 mb-3">{editandoSeguimientoId ? '✏️ Editar' : '➕ Nuevo'} Seguimiento</h4>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Resultado *</label>
                                    <select
                                      value={nuevoResultado}
                                      onChange={(e) => setNuevoResultado(e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                                    >
                                      <option value="contactado_pago_total">✅ Contactado - Pago Total</option>
                                      <option value="promesa_pago">📅 Promesa de Pago</option>
                                      <option value="no_contactado">❌ No Contactado</option>
                                      <option value="buzon">📞 Buzón de Voz</option>
                                      <option value="rechazo_pago">🚫 Rechazo de Pago</option>
                                      <option value="domicilio_incorrecto">🏠 Domicilio Incorrecto</option>
                                    </select>
                                  </div>

                                  {nuevoResultado === 'promesa_pago' && (
                                    <div className="grid grid-cols-2 gap-3">
                                      <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Monto Promesa</label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={nuevoMontoPromesa}
                                          onChange={(e) => setNuevoMontoPromesa(e.target.value)}
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha Promesa</label>
                                        <input
                                          type="date"
                                          value={nuevaFechaPromesa}
                                          onChange={(e) => setNuevaFechaPromesa(e.target.value)}
                                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                                        />
                                      </div>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-xs font-semibold text-slate-700 mb-1">Notas / Observaciones</label>
                                    <textarea
                                      value={nuevaNota}
                                      onChange={(e) => setNuevaNota(e.target.value)}
                                      rows={2}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm"
                                      placeholder="Detalles de la interacción..."
                                    />
                                  </div>

                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleGuardarSeguimiento(notif.id)}
                                      disabled={saving}
                                      className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                                    >
                                      {saving ? 'Guardando...' : '💾 Guardar'}
                                    </button>
                                    <button
                                      onClick={cancelarEdicionSeguimiento}
                                      className="px-3 py-2 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded-lg text-sm font-semibold transition-all"
                                    >
                                      ❌
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* LISTADO SEGUIMIENTOS */}
                            {notif.seguimientos.length === 0 ? (
                              <div className="text-center py-6 text-slate-500">
                                <div className="text-3xl mb-2">📭</div>
                                <p className="text-sm">Sin seguimientos registrados</p>
                              </div>
                            ) : (
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {notif.seguimientos.map((seg) => (
                                  <div key={seg.id} className={`p-3 rounded-lg border-2 ${getResultadoColor(seg.resultado)}`}>
                                    <div className="flex justify-between items-start mb-2">
                                      <div>
                                        <div className="font-bold text-sm">{seg.resultado.replace(/_/g, ' ').toUpperCase()}</div>
                                        <div className="text-xs text-slate-600 mt-1">
                                          👤 {seg.creado_por} • {new Date(seg.created_at).toLocaleDateString('es-PE')} {new Date(seg.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => iniciarEdicionSeguimiento(seg)}
                                          disabled={saving}
                                          className="px-2 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-semibold transition-all disabled:opacity-50"
                                        >
                                          ✏️
                                        </button>
                                        <button
                                          onClick={() => handleEliminarSeguimiento(seg.id)}
                                          disabled={saving}
                                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-semibold transition-all disabled:opacity-50"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                    {seg.monto_promesa && (
                                      <div className="text-xs bg-white/60 p-2 rounded mb-1">
                                        💰 Monto Promesa: S/ {seg.monto_promesa.toFixed(2)}
                                      </div>
                                    )}
                                    {seg.fecha_promesa && (
                                      <div className="text-xs bg-white/60 p-2 rounded mb-1">
                                        📅 Fecha Promesa: {new Date(seg.fecha_promesa).toLocaleDateString('es-PE')}
                                      </div>
                                    )}
                                    {seg.nota && (
                                      <div className="text-xs mt-2 p-2 bg-white/70 rounded border-l-2 border-slate-400">
                                        📝 {seg.nota}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* MODAL ESTRATEGIA */}
        {showEstrategiaModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">🎯 Estrategia de Cobranza</h2>
                <button onClick={() => setShowEstrategiaModal(false)} className="text-2xl hover:opacity-80">✕</button>
              </div>
              <div className="p-6 space-y-6">
                {estrategia ? (
                  <>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="font-semibold text-purple-900 mb-2">📋 Tipo</div>
                      <div className="text-lg text-purple-700">{estrategia.tipo_estrategia}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <div className="font-semibold text-slate-900 mb-2">🔵 Estado</div>
                      <div className="text-lg text-slate-700">{estrategia.estado}</div>
                    </div>
                    {estrategia.criterios && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="font-semibold text-blue-900 mb-3">📊 Criterios</div>
                        <div className="space-y-2 text-sm text-blue-700">
                          {Object.entries(estrategia.criterios).map(([key, value]: [string, any]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                              <span className="font-semibold bg-blue-100 px-3 py-1 rounded">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {estrategia.plantilla_id && plantillas.find(p => p.id === estrategia.plantilla_id) && (
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="font-semibold text-orange-900 mb-2">📧 Plantilla</div>
                        <div className="font-bold text-orange-700">{plantillas.find(p => p.id === estrategia.plantilla_id)?.nombre}</div>
                        <div className="bg-white p-3 rounded mt-2 text-sm text-slate-700 border border-orange-300">{plantillas.find(p => p.id === estrategia.plantilla_id)?.contenido}</div>
                      </div>
                    )}
                    {estrategia.incentivo_id && incentivos.find(i => i.id === estrategia.incentivo_id) && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="font-semibold text-green-900 mb-2">🎁 Incentivo</div>
                        <div className="font-bold">{incentivos.find(i => i.id === estrategia.incentivo_id)?.nombre}</div>
                        <div className="text-sm text-green-700 mt-1">{incentivos.find(i => i.id === estrategia.incentivo_id)?.descripcion}</div>
                      </div>
                    )}
                    {estrategia.refinanciamiento_id && refinanciamientos.find(r => r.id === estrategia.refinanciamiento_id) && (
                      <div className="bg-cyan-50 p-4 rounded-lg border border-cyan-200">
                        <div className="font-semibold text-cyan-900 mb-2">💰 Refinanciamiento</div>
                        <div className="font-bold">{refinanciamientos.find(r => r.id === estrategia.refinanciamiento_id)?.nombre}</div>
                        <div className="text-sm text-cyan-700 mt-2">Plazo: {refinanciamientos.find(r => r.id === estrategia.refinanciamiento_id)?.plazo_minimo}-{refinanciamientos.find(r => r.id === estrategia.refinanciamiento_id)?.plazo_maximo} meses</div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <div className="text-6xl mb-4">📋</div>
                    <p>No hay estrategia definida</p>
                  </div>
                )}
              </div>
              <div className="bg-slate-100 p-4 flex justify-end">
                <button onClick={() => setShowEstrategiaModal(false)} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold">Cerrar</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL PROTESTO */}
        {showProtestoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold">⚖️ Derivación a Protesto Legal</h2>
                <button onClick={() => setShowProtestoModal(false)} className="text-2xl hover:opacity-80">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="font-semibold text-red-900 mb-3">Criterios Interbank</h3>
                  <div className="space-y-2 text-sm text-red-800">
                    <div>✓ Días de atraso: <span className="font-bold">{caso?.created_at ? Math.floor((Date.now() - new Date(caso.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0}</span></div>
                    <div>✓ Monto: <span className="font-bold">S/ {caso?.monto_pendiente?.toFixed(2)}</span></div>
                    <div>✓ Intentos: <span className="font-bold">{notificacionesConSeguimientos.reduce((sum, n) => sum + n.seguimientos.length, 0)}</span></div>
                    <div>✓ Cartera: <span className="font-bold">{caso?.cartera}</span></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Motivo de Derivación *</label>
                  <textarea value={motivoProtesto} onChange={(e) => setMotivoProtesto(e.target.value)} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500" placeholder="Ej: Incumplimiento después de múltiples contactos..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Observaciones</label>
                  <textarea value={observacionesProtesto} onChange={(e) => setObservacionesProtesto(e.target.value)} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div className="bg-slate-100 p-4 flex justify-end gap-2">
                <button onClick={() => setShowProtestoModal(false)} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold">Cancelar</button>
                <button onClick={handleDerivacionProtesto} disabled={saving || !motivoProtesto} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold disabled:opacity-50">{saving ? 'Derivando...' : '⚖️ Derivar a Protesto'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}