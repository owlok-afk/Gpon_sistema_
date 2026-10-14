'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle,
  faHourglassHalf,
  faXmarkCircle,
  faInfoCircle,
  faSignOutAlt,
  faNetworkWired,
  faExclamationTriangle,
  faClipboardList,
  faClockRotateLeft,
  faChartLine,
  faRotate,
  faServer,
  faPlus,
  faTimes,
  faEye,
  faPaperPlane,
  faCalendarPlus,
  faClock,
  faWrench,
  faTicketAlt,
  faFileAlt,
  faPrint,
  faGraduationCap,
  faQrcode,
  faKey,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import ModalNuevoReporteUso from '@/components/ModalNuevoReporteUso'
import ReporteUsoImpresionModal, { ReporteUsoCompleto } from '@/components/ReporteUsoImpresionModal'
import ModalCodigoAccesoEscuela from '@/components/ModalCodigoAccesoEscuela'

type EstadoVinculacion = 'no_vinculada' | 'en_proceso' | 'vinculada' | 'rechazada'
type TipoTicket = 'incidencia' | 'mantenimiento'
type EstadoTicket =
  | 'abierto'
  | 'en_revision'
  | 'programado'
  | 'en_camino'
  | 'en_proceso'
  | 'resuelto'
  | 'cancelado'
type Prioridad = 'baja' | 'media' | 'alta' | 'critica'

type Institucion = {
  id: number
  nombre: string
  cct: string | null
  domicilio: string | null
  director: string | null
  telefono: string | null
  correo: string | null
  estado_vinculacion: EstadoVinculacion
  fecha_solicitud: string | null
  fecha_vinculacion: string | null
  turno: string | null
  ciclo_escolar: string | null
}

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'tecnico' | 'escuela'
  telefono: string | null
}

type Ticket = {
  id: number
  folio: string
  tipo: TipoTicket
  institucion_id: number | null
  creado_por: string | null
  ticket_origen_id: number | null
  titulo: string
  descripcion: string | null
  categoria: string | null
  prioridad: Prioridad
  cuadrilla: string | null
  estado: EstadoTicket
  programado_para: string | null
  resuelto_en: string | null
  created_at: string
}

type Comentario = {
  id: number
  ticket_id: number
  autor_id: string | null
  autor_rol: string | null
  contenido: string
  es_interno: boolean
  created_at: string
}

// ============================================================
// CHIPS
// ============================================================
function ChipEstadoVinculacion({ estado }: { estado: EstadoVinculacion }) {
  const config: Record<EstadoVinculacion, { label: string; bg: string; text: string; border: string; icon: any; punto: string }> = {
    no_vinculada: { label: 'No vinculada', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: faInfoCircle, punto: 'bg-slate-400' },
    en_proceso: { label: 'En proceso', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: faHourglassHalf, punto: 'bg-amber-500' },
    vinculada: { label: 'Vinculada', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: faCheckCircle, punto: 'bg-emerald-500' },
    rechazada: { label: 'Rechazada', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: faXmarkCircle, punto: 'bg-rose-500' },
  }
  const c = config[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.punto}`}></span>
      {c.label}
    </span>
  )
}

function ChipEstadoTicket({ estado }: { estado: EstadoTicket }) {
  const config: Record<EstadoTicket, { label: string; bg: string; text: string; border: string; punto: string }> = {
    abierto: { label: 'Abierto', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-100', punto: 'bg-amber-500' },
    en_revision: { label: 'En revisión', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', punto: 'bg-sky-500' },
    programado: { label: 'Programado', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100', punto: 'bg-sky-500' },
    en_camino: { label: 'En camino', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-100', punto: 'bg-blue-500' },
    en_proceso: { label: 'En sitio (Atendiendo)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', punto: 'bg-emerald-500' },
    resuelto: { label: 'Resuelto', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100', punto: 'bg-emerald-500' },
    cancelado: { label: 'Cancelado', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', punto: 'bg-slate-400' },
  }
  const c = config[estado] || config.abierto
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.punto}`}></span>
      {c.label}
    </span>
  )
}

// ============================================================
// MODAL: REPORTAR FALLA
// ============================================================
function ModalReportarFalla({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState('')
  const [prioridad, setPrioridad] = useState<Prioridad>('media')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categorias = [
    'sin_servicio',
    'lentitud',
    'intermitencia',
    'cable_dañado',
    'equipo_dañado',
    'configuracion',
    'otro',
  ]

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!titulo.trim()) {
      setError('Describe brevemente el problema.')
      return
    }
    setGuardando(true)
    try {
      const res = await fetch('/api/ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo, descripcion, categoria, prioridad }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al crear reporte')
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error desconocido')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 bg-amber-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600" />
          Reportar Falla
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600" disabled={guardando}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <form onSubmit={submit} className="p-5 space-y-4">
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800">
          Al enviar, el NOC recibirá tu reporte y se te asignará un folio de seguimiento.
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            ¿Qué está pasando? *
          </label>
          <input
            type="text"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: No hay internet en el laboratorio"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Describe el problema con detalle
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            placeholder="Ej: Desde hoy por la mañana no tenemos conexión. Las luces del módem están todas apagadas menos la de power."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tipo de problema
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">— Selecciona —</option>
              <option value="sin_servicio">Sin servicio</option>
              <option value="lentitud">Internet lento</option>
              <option value="intermitencia">Se va y vuelve</option>
              <option value="cable_dañado">Cable dañado</option>
              <option value="equipo_dañado">Equipo dañado</option>
              <option value="configuracion">Configuración / WiFi</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Urgencia
            </label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as Prioridad)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="baja">Baja — puedo esperar</option>
              <option value="media">Media — afecta algunas aulas</option>
              <option value="alta">Alta — afecta todo el plantel</option>
              <option value="critica">Crítica — no hay clases</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-60 transition-colors text-sm font-semibold"
          >
            {guardando ? 'Enviando reporte...' : 'Enviar reporte'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-semibold"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

// ============================================================
// MODAL: DETALLE DEL TICKET (para escuela)
// ============================================================
function ModalDetalleTicket({
  ticket,
  comentarios,
  cargandoComentarios,
  onClose,
  onComentado,
}: {
  ticket: Ticket
  comentarios: Comentario[]
  cargandoComentarios: boolean
  onClose: () => void
  onComentado: () => void
}) {
  const [comentario, setComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  async function enviarComentario() {
    if (!comentario.trim()) return
    setEnviandoComentario(true)
    try {
      const res = await fetch(`/api/ticket/${ticket.id}/comentario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: comentario, es_interno: false }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setComentario('')
      onComentado()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setEnviandoComentario(false)
    }
  }

  const pasos = [
    { key: 'abierto', label: 'Recibido', desc: 'Tu reporte llegó al NOC' },
    { key: 'en_revision', label: 'En revisión', desc: 'El NOC está analizando' },
    { key: 'programado', label: 'Programado', desc: 'Se agendó visita técnica' },
    { key: 'en_camino', label: 'En camino', desc: 'Cuadrilla en ruta' },
    { key: 'en_proceso', label: 'En sitio', desc: 'Trabajando en el problema' },
    { key: 'resuelto', label: 'Resuelto', desc: 'Problema solucionado' },
  ]
  const orden = ['abierto', 'en_revision', 'programado', 'en_camino', 'en_proceso', 'resuelto']
  const idxActual = orden.indexOf(ticket.estado)
  const cancelado = ticket.estado === 'cancelado'

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] overflow-y-auto">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-slate-900 font-mono">
            {ticket.folio}
          </h2>
          <ChipEstadoTicket estado={ticket.estado} />
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Título y descripción */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">{ticket.titulo}</h3>
          {ticket.descripcion && (
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{ticket.descripcion}</p>
          )}
        </div>

        {/* Info básica */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 rounded-lg p-3">
            <span className="text-slate-500 block mb-0.5">Fecha del reporte</span>
            <span className="font-medium text-slate-900">
              {new Date(ticket.created_at).toLocaleString('es-MX')}
            </span>
          </div>
          {ticket.categoria && (
            <div className="bg-slate-50 rounded-lg p-3">
              <span className="text-slate-500 block mb-0.5">Tipo</span>
              <span className="font-medium text-slate-900 capitalize">
                {ticket.categoria.replace('_', ' ')}
              </span>
            </div>
          )}
          {ticket.cuadrilla && (
            <div className="bg-slate-50 rounded-lg p-3 col-span-2">
              <span className="text-slate-500 block mb-0.5">Cuadrilla asignada</span>
              <span className="font-medium text-slate-900">{ticket.cuadrilla}</span>
            </div>
          )}
          {ticket.programado_para && (
            <div className="bg-slate-50 rounded-lg p-3 col-span-2">
              <span className="text-slate-500 block mb-0.5">Visita programada</span>
              <span className="font-medium text-slate-900">
                {new Date(ticket.programado_para).toLocaleString('es-MX')}
              </span>
            </div>
          )}
          {ticket.resuelto_en && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 col-span-2">
              <span className="text-emerald-700 block mb-0.5">Resuelto el</span>
              <span className="font-medium text-emerald-900">
                {new Date(ticket.resuelto_en).toLocaleString('es-MX')}
              </span>
            </div>
          )}
        </div>

        {/* Stepper de progreso */}
        {!cancelado && (
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
              Estado del servicio
            </h3>
            <div className="space-y-2">
              {pasos.map((paso, i) => {
                const activo = i <= idxActual
                const actual = i === idxActual
                return (
                  <div
                    key={paso.key}
                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                      actual
                        ? 'bg-sky-50 border border-sky-200'
                        : activo
                        ? 'bg-slate-50 border border-slate-100'
                        : 'bg-white border border-slate-100'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activo ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'
                      }`}
                    >
                      {activo ? (
                        <FontAwesomeIcon icon={faCheckCircle} className="text-xs" />
                      ) : (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className={`text-xs font-semibold ${activo ? 'text-slate-900' : 'text-slate-400'}`}>
                        {paso.label}
                      </div>
                      <div className={`text-[10px] ${activo ? 'text-slate-500' : 'text-slate-300'}`}>
                        {paso.desc}
                      </div>
                    </div>
                    {actual && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-sky-100 text-sky-800">
                        AHORA
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {cancelado && (
          <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 text-xs text-rose-800">
            <FontAwesomeIcon icon={faXmarkCircle} className="mr-1.5" />
            Este reporte fue cancelado por el NOC.
          </div>
        )}

        {/* Comentarios */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Mensajes
          </h3>

          {cargandoComentarios ? (
            <div className="text-center py-4 text-slate-400 text-xs">Cargando...</div>
          ) : comentarios.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-xs">
              Aún no hay mensajes sobre este ticket.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {comentarios.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg p-3 text-xs ${
                    c.autor_rol === 'escuela'
                      ? 'bg-blue-50 border border-blue-100 ml-4'
                      : 'bg-slate-50 border border-slate-200 mr-4'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">
                      {c.autor_rol === 'escuela' ? 'Tú' : c.autor_rol === 'admin' ? 'NOC Central' : 'Técnico GPON'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.created_at).toLocaleString('es-MX')}
                    </span>
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{c.contenido}</p>
                </div>
              ))}
            </div>
          )}

          {/* Comentar */}
          {ticket.estado !== 'cancelado' && ticket.estado !== 'resuelto' && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={2}
                placeholder="Escribe un mensaje..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={enviarComentario}
                  disabled={enviandoComentario || !comentario.trim()}
                  className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className="text-[10px]" />
                  {enviandoComentario ? 'Enviando...' : 'Enviar'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================
// PÁGINA
// ============================================================
export default function EscuelaDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [institucion, setInstitucion] = useState<Institucion | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [reportesUso, setReportesUso] = useState<ReporteUsoCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [mostrarReportar, setMostrarReportar] = useState(false)
  const [mostrarNuevoReporte, setMostrarNuevoReporte] = useState(false)
  const [reporteImprimir, setReporteImprimir] = useState<ReporteUsoCompleto | null>(null)
  const [modalCodigoAcceso, setModalCodigoAcceso] = useState<{
    abierto: boolean
    ticketId?: number
    ticketFolio?: string
    ticketTitulo?: string
  }>({ abierto: false })
  const [seleccionado, setSeleccionado] = useState<Ticket | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [cargandoComentarios, setCargandoComentarios] = useState(false)

  useEffect(() => {
    cargar()

    // Sincronización automática periódica en segundo plano para reflejar cambios en tickets y visitas técnicas
    const timer = setInterval(() => {
      cargar(true)
    }, 8000)

    return () => clearInterval(timer)
  }, [])

  async function cargarReportes() {
    try {
      const res = await fetch('/api/reportes-uso')
      const json = await res.json()
      if (res.ok && json.reportes) {
        setReportesUso(json.reportes)
      }
    } catch (err) {
      console.error('Error cargando reportes_uso:', err)
    }
  }

  async function cargar(silencioso = false) {
    try {
      if (!silencioso) setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(prof)

      const { data: inst } = await supabase
        .from('instituciones')
        .select('*')
        .eq('profile_id', user.id)
        .maybeSingle()
      setInstitucion(inst)

      // Cargar tickets (RLS filtra automáticamente)
      const { data: tks } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
      setTickets(tks || [])

      await cargarReportes()
    } catch (err) {
      console.error(err)
    } finally {
      if (!silencioso) setLoading(false)
    }
  }

  async function cargarComentarios(ticketId: number) {
    setCargandoComentarios(true)
    try {
      const { data } = await supabase
        .from('ticket_comentarios')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })
      setComentarios(data || [])
    } catch (err) {
      console.error(err)
      setComentarios([])
    } finally {
      setCargandoComentarios(false)
    }
  }

  function abrirTicket(t: Ticket) {
    setSeleccionado(t)
    cargarComentarios(t.id)
  }

  async function refrescarSeleccionado() {
    await cargar()
    if (seleccionado) {
      const { data: t } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', seleccionado.id)
        .single()
      if (t) {
        setSeleccionado(t)
        cargarComentarios(t.id)
      }
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Cargando panel del plantel...</p>
        </div>
      </div>
    )
  }

  const iniciales = (profile?.full_name || profile?.email || 'ES')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const estado = institucion?.estado_vinculacion || 'no_vinculada'
  const estaVinculada = estado === 'vinculada'

  const ticketsAbiertos = tickets.filter(
    (t) => !['resuelto', 'cancelado'].includes(t.estado)
  ).length
  const ticketsResueltos = tickets.filter((t) => t.estado === 'resuelto').length

  return (
    <div className="h-full font-sans text-slate-800 bg-[#f8fafc] antialiased flex selection:bg-sky-100 selection:text-sky-900">

      {/* SIDEBAR */}
      <aside className="flex flex-col justify-between h-screen w-64 fixed left-0 top-0 z-50 bg-white border-r border-slate-200 select-none text-slate-600">
        <div className="flex flex-col overflow-y-auto">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 bg-white">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shadow-xs flex-shrink-0 overflow-hidden">
              <img
                src="/logo_gpon.png"
                alt="GPON Telecom"
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.currentTarget
                  target.style.display = 'none'
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = 'flex'
                  }
                }}
              />
              <div className="hidden w-full h-full rounded-lg bg-[#2563EB] items-center justify-center text-white font-bold text-xs">
                G
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                GPON Telecom
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                S.A. DE C.V.
              </span>
            </div>
          </div>

          <nav className="flex flex-col gap-5 px-3.5 py-4 text-xs">
            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                General
              </span>
              <a href="/escuela" className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-sky-50 text-blue-600 font-semibold border border-sky-100 transition-all">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Panel del Plantel
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Servicios y Soporte
              </span>
              <button
                onClick={() => setMostrarReportar(true)}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all text-left w-full"
              >
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-4 h-4 text-amber-500" />
                  Reportar Falla
                </span>
              </button>
              <a href="#mis-reportes" className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faClipboardList} className="w-4 h-4 text-slate-400" />
                  Mis Reportes
                </span>
                {ticketsAbiertos > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-100">
                    {ticketsAbiertos}
                  </span>
                )}
              </a>
              <a href="#reportes-semestrales" className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faFileAlt} className="w-4 h-4 text-blue-600" />
                  Reportes de Uso (2/año)
                </span>
                {reportesUso.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                    {reportesUso.length}
                  </span>
                )}
              </a>
              <button
                onClick={() => setModalCodigoAcceso({ abierto: true })}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all text-left w-full"
              >
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-blue-600" />
                  Pase Técnico (OTP/QR)
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Acceso
                </span>
              </button>
              <a href="#historial" className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faClockRotateLeft} className="w-4 h-4 text-slate-400" />
                  Historial de Servicio
                </span>
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Equipo y Red
              </span>
              <a href="#modem" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <FontAwesomeIcon icon={faServer} className="w-4 h-4 text-slate-400" />
                Mi Módem / ONT
              </a>
              <a href="#consumo" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <FontAwesomeIcon icon={faChartLine} className="w-4 h-4 text-slate-400" />
                Consumo de Datos
              </a>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex flex-col gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
              {iniciales}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-900 truncate leading-tight">
                {profile?.full_name || 'Escuela'}
              </span>
              <span className="text-[11px] text-slate-500 font-normal truncate">
                {institucion?.nombre || 'Sin institución'}
              </span>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all"
          >
            <FontAwesomeIcon icon={faSignOutAlt} className="w-3.5 h-3.5 text-slate-400" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <header className="h-16 px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center w-full max-w-md">
            <div className="relative w-full">
              <input
                type="search"
                placeholder="Buscar folio, reporte o manual..."
                className="w-full pl-3.5 pr-14 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalCodigoAcceso({ abierto: true })}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 active:scale-[0.99] transition-all shadow-xs flex items-center gap-1.5"
              title="Pase de acceso con código OTP o QR para técnicos"
            >
              <FontAwesomeIcon icon={faQrcode} className="text-[11px]" />
              Pase Técnico (QR)
            </button>
            <button
              onClick={() => setMostrarReportar(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.99] transition-all shadow-sm flex items-center gap-1.5"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
              Reportar Falla
            </button>
            <div className="h-5 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-xs text-white shadow-sm">
                {iniciales}
              </div>
              <div className="hidden md:flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-900 leading-tight">
                  {profile?.full_name || 'Escuela'}
                </span>
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
                  {institucion?.nombre || 'Sin institución'}
                </span>
              </div>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#08296c] via-[#0948a4] to-[#0066cc] text-white p-7 shadow-lg border border-blue-400/30">
            <div className="absolute -right-16 -top-20 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
            <div className="absolute right-32 -bottom-24 w-72 h-72 rounded-full bg-sky-400/20 blur-xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-6">
              <div className="max-w-3xl flex flex-col gap-2.5">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
                  Bienvenido al Portal Escolar
                  {institucion?.nombre ? ` — ${institucion.nombre}` : ''}
                </h1>
                <p className="text-xs md:text-sm text-blue-100/90 leading-relaxed font-normal">
                  {estaVinculada
                    ? `Reporta fallas y da seguimiento a los tickets de soporte del plantel.`
                    : estado === 'en_proceso'
                    ? 'Tu solicitud está siendo revisada por un administrador.'
                    : estado === 'rechazada'
                    ? 'Tu solicitud fue rechazada. Contacta al NOC central.'
                    : 'Aún no tienes una institución vinculada.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/15 max-w-2xl">
                <div className="flex flex-col">
                  <span className="text-base md:text-lg font-bold text-white tracking-tight">
                    {institucion?.nombre || 'Sin institución'}
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">Plantel educativo</span>
                </div>
                <div className="flex flex-col sm:border-l sm:border-white/15 sm:pl-5">
                  <span className="text-base md:text-lg font-bold text-white tracking-tight">
                    {institucion?.cct || '—'}
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">Clave CCT</span>
                </div>
                <div className="flex flex-col sm:border-l sm:border-white/15 sm:pl-5">
                  <span className="text-base md:text-lg font-bold text-white tracking-tight">
                    {estaVinculada ? 'Vinculada' : estado === 'en_proceso' ? 'En Proceso' : estado === 'rechazada' ? 'Rechazada' : 'Sin vincular'}
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">Estado del servicio</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Estado de vinculación</span>
                <ChipEstadoVinculacion estado={estado} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                  {estaVinculada ? 'Activa' : estado === 'en_proceso' ? 'Pendiente' : estado === 'rechazada' ? 'Cerrada' : '—'}
                </div>
                <div className="text-[11px] font-medium text-slate-500">Tu vínculo con el NOC</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Tickets abiertos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                  Activos
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700 tracking-tight leading-none mb-1">
                  {ticketsAbiertos}
                </div>
                <div className="text-[11px] font-normal text-slate-500">Requieren seguimiento</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Tickets resueltos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Cerrados
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700 tracking-tight leading-none mb-1">
                  {ticketsResueltos}
                </div>
                <div className="text-[11px] font-normal text-slate-500">Atendidos por el NOC</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Histórico total</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Todos
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                  {tickets.length}
                </div>
                <div className="text-[11px] font-normal text-slate-500">Reportes registrados</div>
              </div>
            </div>
          </section>

          {/* Bloque principal */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                    Estado de Conectividad y Telemetría del Plantel
                  </h2>
                  <ChipEstadoVinculacion estado={estado} />
                </div>
                <p className="text-xs text-slate-500 font-normal">
                  {institucion?.cct ? `CCT ${institucion.cct}` : 'Sin CCT registrado'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#f8fafc] rounded-xl p-5 border border-slate-200/80 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-bold text-slate-800">Parámetros Técnicos de Conexión</span>
                  <span className="text-[10px] font-mono text-slate-400">Sin datos</span>
                </div>
                <div className="space-y-3 text-xs">
                  {[
                    ['Equipo Terminal ONT', '—'],
                    ['Potencia Óptica Rx', '—'],
                    ['Dirección IP Asignada', '—'],
                    ['Puerto OLT', '—'],
                    ['VLAN Educativa', '—'],
                  ].map(([label, valor]) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">{label}:</span>
                      <span className="font-mono text-slate-400">{valor}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <button
                    disabled
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 bg-slate-100 border border-slate-200 cursor-not-allowed"
                  >
                    <FontAwesomeIcon icon={faRotate} className="w-3.5 h-3.5" />
                    Probar Conectividad
                  </button>
                  <span className="text-[11px] font-mono text-slate-400">—</span>
                </div>
              </div>

              <div className="bg-[#f8fafc] rounded-xl p-5 border border-slate-200/80 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <span className="text-xs font-bold text-slate-800">Ruta del Enlace Óptico</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    Sin topología
                  </span>
                </div>
                <div className="text-center py-8 text-slate-400">
                  <FontAwesomeIcon icon={faNetworkWired} className="text-3xl mb-2" />
                  <p className="text-xs">La topología se mostrará cuando el NOC registre la información.</p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Diagnóstico general:</span>
                  <span className="font-semibold text-slate-400">Sin diagnóstico</span>
                </div>
              </div>
            </div>

            {/* Tabla de tickets */}
            <div id="mis-reportes" className="pt-4 border-t border-slate-100 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Mis Reportes y Solicitudes de Soporte
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                    {tickets.length}
                  </span>
                </div>
                <button
                  onClick={() => setMostrarReportar(true)}
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                  Reportar nueva falla
                </button>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Folio</th>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Problema</th>
                      <th className="px-4 py-3">Cuadrilla</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3 text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {tickets.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                          <FontAwesomeIcon icon={faTicketAlt} className="text-2xl mb-2" />
                          <p className="text-xs">Aún no has reportado fallas</p>
                          <button
                            onClick={() => setMostrarReportar(true)}
                            className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-xs font-semibold"
                          >
                            Reportar primera falla
                          </button>
                        </td>
                      </tr>
                    ) : (
                      tickets.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-semibold text-slate-900">
                            {t.folio}
                          </td>
                          <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                            {new Date(t.created_at).toLocaleDateString('es-MX', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3 max-w-[260px]">
                            <div className="font-medium text-slate-900 line-clamp-2">
                              {t.titulo}
                            </div>
                            {t.tipo === 'mantenimiento' && (
                              <div className="text-[10px] text-sky-600 mt-0.5 flex items-center gap-1">
                                <FontAwesomeIcon icon={faWrench} className="text-[8px]" />
                                Mantenimiento programado
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {t.cuadrilla || <span className="text-slate-400">Sin asignar</span>}
                          </td>
                          <td className="px-4 py-3">
                            <ChipEstadoTicket estado={t.estado} />
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {t.estado === 'en_proceso' ? (
                                <button
                                  onClick={() => setModalCodigoAcceso({
                                    abierto: true,
                                    ticketId: t.id,
                                    ticketFolio: t.folio,
                                    ticketTitulo: t.titulo,
                                  })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all inline-flex items-center gap-1 shadow-2xs"
                                  title="Ver datos de la visita técnica activa"
                                >
                                  <FontAwesomeIcon icon={faCheckCircle} className="text-[10px] text-emerald-600" />
                                  <span>En Sitio</span>
                                </button>
                              ) : t.estado !== 'resuelto' && t.estado !== 'cancelado' ? (
                                <button
                                  onClick={() => setModalCodigoAcceso({
                                    abierto: true,
                                    ticketId: t.id,
                                    ticketFolio: t.folio,
                                    ticketTitulo: t.titulo,
                                  })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all inline-flex items-center gap-1"
                                  title="Generar código o QR de acceso para este reporte"
                                >
                                  <FontAwesomeIcon icon={faKey} className="text-[10px]" />
                                  Pase
                                </button>
                              ) : null}
                              <button
                                onClick={() => abrirTicket(t)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-all inline-flex items-center gap-1.5"
                              >
                                <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                                Ver
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sección: Reportes Semestrales de Uso de Internet */}
            <div id="reportes-semestrales" className="pt-6 border-t border-slate-100 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <FontAwesomeIcon icon={faFileAlt} className="text-blue-600" />
                      Reportes Semestrales de Uso y Aprovechamiento de Internet
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      2 veces al año
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Cédulas oficiales semestrales para documentar el impacto educativo y justificar la conectividad del plantel.
                  </p>
                </div>
                <button
                  onClick={() => setMostrarNuevoReporte(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                  Nuevo Reporte Semestral
                </button>
              </div>

              {/* Lista de reportes semestrales */}
              <div className="overflow-x-auto rounded-xl border border-slate-200/80">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Folio</th>
                      <th className="px-4 py-3">Ciclo y Periodo</th>
                      <th className="px-4 py-3">Reporte Escrito</th>
                      <th className="px-4 py-3">Evidencias</th>
                      <th className="px-4 py-3">Calidad</th>
                      <th className="px-4 py-3">Responsable</th>
                      <th className="px-4 py-3 text-right">Cédula Oficial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {reportesUso.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                          <FontAwesomeIcon icon={faGraduationCap} className="text-3xl text-slate-300 mb-2" />
                          <p className="text-xs font-semibold text-slate-600">No se han registrado reportes semestrales en este ciclo</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 max-w-md mx-auto">
                            Las escuelas beneficiarias deben generar 2 reportes al año (Semestre 1: Ago-Ene y Semestre 2: Feb-Jul).
                          </p>
                          <button
                            onClick={() => setMostrarNuevoReporte(true)}
                            className="mt-3.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
                          >
                            <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                            Generar primer reporte del ciclo
                          </button>
                        </td>
                      </tr>
                    ) : (
                      reportesUso.map((rep) => (
                        <tr key={rep.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono font-bold text-blue-900 whitespace-nowrap">
                            REP-{rep.id.toString().padStart(5, '0')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-semibold text-slate-800">{rep.ciclo_escolar}</div>
                            <span className="text-[10px] font-semibold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                              {rep.periodo}
                            </span>
                          </td>
                          <td className="px-4 py-3 max-w-[240px]">
                            <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                              {rep.reporte_texto || 'Sin descripción'}
                            </p>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {rep.fotos && rep.fotos.length > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                                📷 {rep.fotos.length} foto{rep.fotos.length > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Sin fotos</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`capitalize font-semibold text-[11px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                              rep.calidad_servicio === 'excelente'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : rep.calidad_servicio === 'buena'
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : rep.calidad_servicio === 'regular'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              {rep.calidad_servicio}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700 max-w-[160px]">
                            <div className="font-medium text-xs truncate">{rep.responsable_nombre}</div>
                            <div className="text-[10px] text-slate-400 truncate">{rep.responsable_cargo}</div>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={() => setReporteImprimir(rep)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-all inline-flex items-center gap-1.5"
                            >
                              <FontAwesomeIcon icon={faPrint} className="text-[11px]" />
                              Ver / Imprimir
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>

        <footer className="mt-auto border-t border-slate-200/60 bg-white px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">GPON Telecom S.A. de C.V.</span>
            <span>•</span>
            <span>Sistema de Monitoreo Escolar de Banda Ancha</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] mt-2 sm:mt-0">
            <span>Soporte 24/7: 800-4766-NOC</span>
          </div>
        </footer>
      </div>

      {/* Modal reportar falla */}
      {mostrarReportar && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-3 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <ModalReportarFalla
              onClose={() => setMostrarReportar(false)}
              onCreated={cargar}
            />
          </div>
        </div>
      )}

      {/* Modal detalle ticket */}
      {seleccionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-3 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <ModalDetalleTicket
              ticket={seleccionado}
              comentarios={comentarios}
              cargandoComentarios={cargandoComentarios}
              onClose={() => setSeleccionado(null)}
              onComentado={refrescarSeleccionado}
            />
          </div>
        </div>
      )}

      {/* Modal nuevo reporte semestral de uso */}
      {mostrarNuevoReporte && (
        <ModalNuevoReporteUso
          onClose={() => setMostrarNuevoReporte(false)}
          onCreated={cargarReportes}
          institucionNombre={institucion?.nombre}
          institucionCCT={institucion?.cct || undefined}
          directorDefault={institucion?.director || profile?.full_name || undefined}
        />
      )}

      {/* Modal de impresión oficial de reporte */}
      {reporteImprimir && (
        <ReporteUsoImpresionModal
          reporte={reporteImprimir}
          onClose={() => setReporteImprimir(null)}
        />
      )}

      {/* Modal pase de acceso técnico OTP / QR */}
      {modalCodigoAcceso.abierto && (
        <ModalCodigoAccesoEscuela
          onClose={() => setModalCodigoAcceso({ abierto: false })}
          institucionId={institucion?.id}
          institucionNombre={institucion?.nombre}
          institucionCCT={institucion?.cct || undefined}
          ticketId={modalCodigoAcceso.ticketId}
          ticketFolio={modalCodigoAcceso.ticketFolio}
          ticketTitulo={modalCodigoAcceso.ticketTitulo}
          onValidado={() => cargar(true)}
        />
      )}
    </div>
  )
}