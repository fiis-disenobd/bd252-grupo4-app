'use client'

import { useEffect, useState } from 'react'
// ⚠️ PASO 1: DESCOMENTA LA SIGUIENTE LÍNEA EN TU VS CODE:
import { createClient } from '@supabase/supabase-js'

// --- DEFINICIÓN DE TIPOS ---
interface TicketProgramado {
  codigo_ticket: number
  estado_ticket: string
  fecha_programada: string
  cliente: string
  cartera: string
  monto_deuda: number
  diasmora: number
  recurso_asignado: string | null
}

interface Recurso {
  codigo_recurso: string
  descripcion: string
  nivelexperiencia: string
  tipo_recurso: string
}

export default function ModuloProgramacion() {
  // Estados de Datos
  const [tickets, setTickets] = useState<TicketProgramado[]>([])
  const [recursos, setRecursos] = useState<Recurso[]>([])
  
  // Estados de Interfaz
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [mensaje, setMensaje] = useState<{tipo: 'error' | 'success', texto: string} | null>(null)
  
  // Estados del Formulario
  const [selectedTicketId, setSelectedTicketId] = useState<string>('')
  const [selectedRecursoId, setSelectedRecursoId] = useState<string>('')
  const [saving, setSaving] = useState(false)

  // ⚠️ PASO 2: DESCOMENTA ESTE BLOQUE Y BORRA LA LÍNEA DE "const supabase = null"
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  const supabase = createClient(supabaseUrl, supabaseKey)
  

  useEffect(() => {
    // Protección para que no falle si olvidaste descomentar
    if (supabase) {
      cargarDatos()
      cargarRecursos()
    } else {
      setLoading(false) // Solo para que veas la pantalla si no hay conexión
    }
  }, [])

  // --- FUNCIONES DE CARGA ---

  async function cargarDatos() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .schema('programacion') 
        .from('vista_programacion_consolidada')
        .select('*')
        .order('codigo_ticket', { ascending: true })
      
      if (error) throw error
      setTickets((data as any[]) || [])
    } catch (err: any) {
      console.error(err)
      setMensaje({ tipo: 'error', texto: 'Error cargando tickets: ' + err.message })
    } finally {
      setLoading(false)
    }
  }

  async function cargarRecursos() {
    try {
        const { data } = await supabase
        .schema('programacion')
        .from('recurso')
        .select('codigo_recurso, descripcion, nivelexperiencia, tipo_recurso')
        .eq('tipo_recurso', 'Asesor') 
        
        setRecursos((data as any[]) || [])
    } catch (err) {
        console.error("Error cargando recursos", err)
    }
  }

  // --- FUNCIÓN DE GUARDADO (ASIGNACIÓN) ---

  async function handleGuardarAsignacion(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMensaje(null)

    if (!supabase) {
        alert("⚠️ ¡Atención! Debes descomentar las líneas de Supabase en el código (page.tsx) para que esto funcione.");
        setSaving(false);
        return;
    }

    try {
      if (!selectedTicketId || !selectedRecursoId) {
        throw new Error('Por favor selecciona un ticket y un recurso.')
      }

      // 1. Insertar en la tabla ASIGNACION_RECURSO_TICKET
      const { error: insertError } = await supabase
        .schema('programacion')
        .from('asignacion_recurso_ticket')
        .insert({
          codigo_ticket: parseInt(selectedTicketId),
          codigo_recurso: selectedRecursoId
        })

      if (insertError) throw insertError

      // 2. Actualizar estado del Ticket a 'En Ejecucion'
      await supabase
        .schema('programacion')
        .from('ticket')
        .update({ estado: 'En Ejecucion' })
        .eq('codigo_ticket', parseInt(selectedTicketId))

      // Éxito
      setMensaje({ tipo: 'success', texto: '¡Asignación creada correctamente!' })
      setModalOpen(false)
      setSelectedTicketId('')
      setSelectedRecursoId('')
      cargarDatos() // Recargar la tabla
    } catch (err: any) {
      console.error(err)
      // Aquí capturamos el error de tu TRIGGER SQL (ej: Experto requerido)
      setMensaje({ 
        tipo: 'error', 
        texto: err.message.includes('RF203') 
          ? '⛔ BLOQUEO DE REGLA: Cartera Tardía requiere un experto.' 
          : 'Error al guardar: ' + err.message 
      })
    } finally {
      setSaving(false)
    }
  }

  // Helper de estilos
  const getEstadoColor = (estado: string) => {
    const s = estado?.toLowerCase() || ''
    if (s === 'pendiente') return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    if (s === 'en ejecucion') return 'bg-blue-100 text-blue-800 border-blue-200'
    if (s === 'finalizado') return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  return (
    // Forzamos text-slate-900 para evitar letras blancas
    <div className="min-h-screen bg-gray-50 p-8 relative text-slate-900">
      
      {/* --- CABECERA --- */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Programación de Recursos</h1>
          <p className="text-gray-500 mt-1">Gestión operativa de cobranzas</p>
        </div>
        <div className="flex gap-3">
            <button onClick={cargarDatos} className="px-4 py-2 bg-white border border-gray-300 text-slate-700 rounded-md hover:bg-gray-50 shadow-sm transition-all">
              Refrescar
            </button>
            <button 
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-all flex items-center gap-2"
            >
              <span>+</span> Nueva Asignación
            </button>
        </div>
      </div>

      {/* --- MENSAJES DE ALERTA --- */}
      {mensaje && (
        <div className={`max-w-7xl mx-auto mb-6 p-4 rounded-lg border ${
          mensaje.tipo === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'
        }`}>
          {mensaje.tipo === 'error' ? '⚠️ ' : '✅ '} {mensaje.texto}
        </div>
      )}

      {/* --- TABLA --- */}
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Deuda</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Asignado a</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                 <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {supabase ? "Cargando datos..." : "⚠️ Falta descomentar Supabase en el código."}
                 </td></tr>
              ) : tickets.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No se encontraron tickets.</td></tr>
              ) : tickets.map((t) => (
                <tr key={t.codigo_ticket} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-medium text-slate-900">#{t.codigo_ticket}</span>
                    <div className="text-xs text-gray-500">{t.fecha_programada}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{t.cliente}</div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.cartera === 'Tardia' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {t.cartera}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-slate-900 font-semibold">S/ {t.monto_deuda}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-semibold border ${getEstadoColor(t.estado_ticket)}`}>
                      {t.estado_ticket}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {t.recurso_asignado ? (
                        <span className="text-indigo-600 font-medium">{t.recurso_asignado}</span>
                    ) : (
                        <span className="text-gray-400 italic">--</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL (POP-UP) --- */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Asignar Recurso</h2>
            
            <form onSubmit={handleGuardarAsignacion} className="space-y-4">
              
              {/* Selector de Ticket */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seleccionar Ticket Pendiente</label>
                <select 
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border text-slate-900 bg-white"
                  value={selectedTicketId}
                  onChange={(e) => setSelectedTicketId(e.target.value)}
                  required
                >
                  <option value="">-- Selecciona un ticket --</option>
                  {tickets
                    .filter(t => !t.recurso_asignado && t.estado_ticket !== 'Finalizado')
                    .map(t => (
                      <option key={t.codigo_ticket} value={t.codigo_ticket} className="text-slate-900">
                        #{t.codigo_ticket} - {t.cliente} ({t.cartera})
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Solo se muestran tickets sin asignar.</p>
              </div>

              {/* Selector de Recurso */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asignar a Analista</label>
                <select 
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2 border text-slate-900 bg-white"
                  value={selectedRecursoId}
                  onChange={(e) => setSelectedRecursoId(e.target.value)}
                  required
                >
                  <option value="">-- Selecciona un recurso --</option>
                  {recursos.map(r => (
                    <option key={r.codigo_recurso} value={r.codigo_recurso} className="text-slate-900">
                      {r.descripcion} ({r.nivelexperiencia})
                    </option>
                  ))}
                </select>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-700 bg-gray-100 hover:bg-gray-200 rounded-md transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition flex items-center"
                >
                  {saving ? 'Guardando...' : 'Guardar Asignación'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  )
}