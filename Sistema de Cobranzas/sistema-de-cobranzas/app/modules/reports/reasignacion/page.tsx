'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'



interface Recurso {
  codigo_recurso: string
  descripcion: string
  nombre_equipo: string
  carga_actual: number
}

export default function PaginaReasignacion() {
  const router = useRouter()
  
  // Estados
  const [origen, setOrigen] = useState('')
  const [destino, setDestino] = useState('')
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [cargaOrigen, setCargaOrigen] = useState(0)
  
  const [loading, setLoading] = useState(true)
  const [procesando, setProcesando] = useState(false)
  const [mensaje, setMensaje] = useState<{tipo: 'error' | 'success', texto: string} | null>(null)

  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)


  useEffect(() => {
    if (supabase) cargarRecursos()
  }, [])

  useEffect(() => {
    if (origen) {
        const asesor = recursos.find(r => r.codigo_recurso === origen)
        setCargaOrigen(asesor ? asesor.carga_actual : 0)
    }
  }, [origen, recursos])

  async function cargarRecursos() {
    try {
      setLoading(true)
      const client = supabase as any
      const { data, error } = await client
        .schema('programacion') 
        .from('vista_carga_asesores')
        .select('*')
        .order('descripcion', { ascending: true })
      
      if (error) throw error
      setRecursos(data || [])
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleTransferencia(e: React.FormEvent) {
    e.preventDefault()
    setProcesando(true)
    setMensaje(null)

    if (origen === destino) {
        setMensaje({ tipo: 'error', texto: 'El analista de origen y destino no pueden ser el mismo.' })
        setProcesando(false)
        return
    }

    if (cargaOrigen === 0) {
        setMensaje({ tipo: 'error', texto: 'El analista de origen no tiene tickets activos para transferir.' })
        setProcesando(false)
        return
    }

    try {
        const client = supabase as any

        // 1. Actualizar la tabla de asignaciones
        const { error } = await client
            .schema('programacion')
            .from('asignacion_recurso_ticket')
            .update({ codigo_recurso: destino })
            .eq('codigo_recurso', origen)

        if (error) throw error

        setMensaje({ tipo: 'success', texto: `Se transfirieron correctamente los tickets.` })
        
        await cargarRecursos()
        setOrigen('')
        setDestino('')

    } catch (err: any) {
        console.error(err)
        setMensaje({ tipo: 'error', texto: 'Error en la transferencia: ' + err.message })
    } finally {
        setProcesando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-slate-900 flex items-center justify-center">
      
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        
        {/* Header de Emergencia */}
        <div className="bg-amber-500 p-6 text-white flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <span>🚑</span> Reasignación de Cartera
                </h1>
                <p className="text-amber-100 text-sm mt-1">
                    Herramienta de contingencia para ausencias o saturación.
                </p>
            </div>
            <Link href="/modules/programacion" className="text-sm bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition">
                Cancelar y Volver
            </Link>
        </div>

        <div className="p-8">
            
            {mensaje && (
                <div className={`mb-8 p-4 rounded-lg border flex items-center gap-3 ${mensaje.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    <span className="text-2xl">{mensaje.tipo === 'error' ? '🛑' : '✅'}</span>
                    <div>
                        <p className="font-bold">{mensaje.tipo === 'error' ? 'Error' : 'Operación Exitosa'}</p>
                        <p className="text-sm">{mensaje.texto}</p>
                    </div>
                </div>
            )}

            <form onSubmit={handleTransferencia} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
                
                {/* COLUMNA ORIGEN */}
                <div className="md:col-span-3 bg-red-50 p-6 rounded-xl border border-red-100 h-full">
                    <label className="block text-sm font-bold text-red-800 mb-4 uppercase tracking-wider">
                        1. Desde (Origen)
                    </label>
                    <select 
                        className="w-full p-3 border border-red-200 rounded-lg focus:ring-red-500 text-slate-900 mb-4"
                        value={origen}
                        onChange={(e) => setOrigen(e.target.value)}
                        required
                    >
                        <option value="">Seleccionar Analista Ausente...</option>
                        {recursos.filter(r => r.carga_actual > 0).map(r => (
                            <option key={r.codigo_recurso} value={r.codigo_recurso}>
                                {r.descripcion} ({r.carga_actual} casos)
                            </option>
                        ))}
                    </select>
                    
                    {/* Preview de Carga */}
                    <div className="text-center">
                        <p className="text-xs text-red-600 font-bold uppercase">Tickets a Mover</p>
                        <p className="text-5xl font-black text-red-700 mt-2">{cargaOrigen}</p>
                    </div>
                </div>

                {/* FLECHA CENTRAL */}
                <div className="md:col-span-1 flex justify-center">
                    <div className="bg-gray-100 rounded-full p-3">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                        </svg>
                    </div>
                </div>

                {/* COLUMNA DESTINO */}
                <div className="md:col-span-3 bg-green-50 p-6 rounded-xl border border-green-100 h-full">
                    <label className="block text-sm font-bold text-green-800 mb-4 uppercase tracking-wider">
                        2. Hacia (Destino)
                    </label>
                    <select 
                        className="w-full p-3 border border-green-200 rounded-lg focus:ring-green-500 text-slate-900 mb-4"
                        value={destino}
                        onChange={(e) => setDestino(e.target.value)}
                        required
                    >
                        <option value="">Seleccionar Receptor...</option>
                        {recursos.filter(r => r.codigo_recurso !== origen).map(r => (
                            <option key={r.codigo_recurso} value={r.codigo_recurso}>
                                {r.descripcion} (Tiene {r.carga_actual})
                            </option>
                        ))}
                    </select>

                    <div className="bg-white/60 p-3 rounded-lg text-xs text-green-800 border border-green-100">
                        <p>💡 Tip: Busca compañeros del mismo equipo o con baja carga de trabajo.</p>
                    </div>
                </div>

                {/* BOTÓN ACCIÓN */}
                <div className="md:col-span-7 mt-4">
                    <button
                        type="submit"
                        disabled={procesando || cargaOrigen === 0 || !destino}
                        className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {procesando ? (
                            <>🔄 Procesando transferencia...</>
                        ) : (
                            <>🚀 Confirmar Transferencia de {cargaOrigen} Tickets</>
                        )}
                    </button>
                </div>

            </form>
        </div>
      </div>
    </div>
  )
}