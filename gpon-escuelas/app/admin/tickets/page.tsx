'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faSearch,
  faTicketAlt,
  faWrench,
  faExclamationTriangle,
  faCheckCircle,
  faHourglassHalf,
  faTimes,
  faTrash,
  faEye,
  faPaperPlane,
  faCalendarPlus,
  faClock,
  faUser,
  faBuilding,
  faLock,
} from '@fortawesome/free-solid-svg-icons'

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
  updated_at: string
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

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'tecnico' | 'escuela'
}

// ============================================================
// CHIPS
// ============================================================
function ChipEstado({ estado }: { estado: EstadoTicket }) {
  const config: Record<EstadoTicket, { label: string; bg: string; text: string; border: string; icon: any }> = {
    abierto: { label: 'Abierto', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: faExclamationTriangle },
    en_revision: { label: 'En revisión', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', icon: faEye },
    programado: { label: 'Programado', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', icon: faCalendarPlus },
    en_camino: { label: 'En camino', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: faClock },
    en_proceso: { label: 'En proceso', bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', icon: faWrench },
    resuelto: { label: 'Resuelto', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: faCheckCircle },
    cancelado: { label: 'Cancelado', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: faTimes },
  }
  const c = config[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <FontAwesomeIcon icon={c.icon} className="text-[9px]" />
      {c.label}
    </span>
  )
}

function ChipPrioridad({ prioridad }: { prioridad: Prioridad }) {
  const config: Record<Prioridad, { label: string; bg: string; text: string; border: string }> = {
    baja: { label: 'Baja', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
    media: { label: 'Media', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-100' },
    alta: { label: 'Alta', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
    critica: { label: 'Crítica', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100' },
  }
  const c = config[prioridad]
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  )
}

function ChipTipo({ tipo }: { tipo: TipoTicket }) {
  if (tipo === 'mantenimiento') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
        <FontAwesomeIcon icon={faWrench} className="text-[9px]" />
        Mantenimiento
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
      <FontAwesomeIcon icon={faExclamationTriangle} className="text-[9px]" />
      Incidencia
    </span>
  )
}

// ============================================================
// MODAL CREAR TICKET
// ============================================================
function ModalCrearTicket({
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
      setError('El título es obligatorio.')
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
      if (!res.ok) throw new Error(json.error || 'Error al crear')

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
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faPlus} className="text-blue-600" />
          Nueva incidencia
        </h2>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600" disabled={guardando}>
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <form onSubmit={submit} className="p-5 space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Título *
          </label>
          <input
            type="text"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Internet lento en laboratorio"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Descripción
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            placeholder="Describe el problema con detalle..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="">— Sin categoría —</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prioridad
            </label>
            <select
              value={prioridad}
              onChange={(e) => setPrioridad(e.target.value as Prioridad)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors text-sm font-semibold"
          >
            {guardando ? 'Creando...' : 'Crear incidencia'}
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
// MODAL DETALLE TICKET
// ============================================================
function ModalDetalleTicket({
  ticket,
  comentarios,
  cargandoComentarios,
  onClose,
  onActualizado,
  puedeEditar,
}: {
  ticket: Ticket
  comentarios: Comentario[]
  cargandoComentarios: boolean
  onClose: () => void
  onActualizado: () => void
  puedeEditar: boolean
}) {
  const [estado, setEstado] = useState<EstadoTicket>(ticket.estado)
  const [cuadrilla, setCuadrilla] = useState(ticket.cuadrilla || '')
  const [comentario, setComentario] = useState('')
  const [esInterno, setEsInterno] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [mostrarAgendar, setMostrarAgendar] = useState(false)

  // Agendar mantenimiento
  const [mantTitulo, setMantTitulo] = useState('')
  const [mantDescripcion, setMantDescripcion] = useState('')
  const [mantFecha, setMantFecha] = useState('')
  const [mantCuadrilla, setMantCuadrilla] = useState('')

  const estadosDisponibles: { value: EstadoTicket; label: string }[] = [
    { value: 'abierto', label: 'Abierto' },
    { value: 'en_revision', label: 'En revisión' },
    { value: 'programado', label: 'Programado' },
    { value: 'en_camino', label: 'En camino' },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'resuelto', label: 'Resuelto' },
    { value: 'cancelado', label: 'Cancelado' },
  ]

  async function guardarCambios() {
    setGuardando(true)
    try {
      const res = await fetch(`/api/ticket/${ticket.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, cuadrilla }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      onActualizado()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  async function enviarComentario() {
    if (!comentario.trim()) return
    setEnviandoComentario(true)
    try {
      const res = await fetch(`/api/ticket/${ticket.id}/comentario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenido: comentario, es_interno: esInterno }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      setComentario('')
      setEsInterno(false)
      onActualizado()
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setEnviandoComentario(false)
    }
  }

  async function agendarMantenimiento() {
    if (!mantTitulo.trim()) {
      alert('El título es obligatorio.')
      return
    }
    setGuardando(true)
    try {
      const res = await fetch(`/api/ticket/${ticket.id}/agendar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: mantTitulo,
          descripcion: mantDescripcion,
          programado_para: mantFecha ? new Date(mantFecha).toISOString() : null,
          cuadrilla: mantCuadrilla,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error')
      alert('Mantenimiento agendado: ' + json.mantenimiento.folio)
      onActualizado()
      setMostrarAgendar(false)
      setMantTitulo('')
      setMantDescripcion('')
      setMantFecha('')
      setMantCuadrilla('')
    } catch (err: any) {
      alert('Error: ' + err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] overflow-y-auto">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="text-lg font-bold text-slate-900 font-mono">
            {ticket.folio}
          </h2>
          <ChipTipo tipo={ticket.tipo} />
          <ChipEstado estado={ticket.estado} />
          <ChipPrioridad prioridad={ticket.prioridad} />
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
          disabled={guardando}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Info */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">{ticket.titulo}</h3>
          {ticket.descripcion && (
            <p className="text-sm text-slate-600 whitespace-pre-wrap">{ticket.descripcion}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 rounded-lg p-3">
            <span className="text-slate-500 block mb-0.5">Creado</span>
            <span className="font-medium text-slate-900">
              {new Date(ticket.created_at).toLocaleString('es-MX')}
            </span>
          </div>
          {ticket.categoria && (
            <div className="bg-slate-50 rounded-lg p-3">
              <span className="text-slate-500 block mb-0.5">Categoría</span>
              <span className="font-medium text-slate-900 capitalize">
                {ticket.categoria.replace('_', ' ')}
              </span>
            </div>
          )}
          {ticket.programado_para && (
            <div className="bg-slate-50 rounded-lg p-3">
              <span className="text-slate-500 block mb-0.5">Programado para</span>
              <span className="font-medium text-slate-900">
                {new Date(ticket.programado_para).toLocaleString('es-MX')}
              </span>
            </div>
          )}
          {ticket.ticket_origen_id && (
            <div className="bg-slate-50 rounded-lg p-3">
              <span className="text-slate-500 block mb-0.5">Origen</span>
              <span className="font-medium text-slate-900 font-mono">
                Ticket #{ticket.ticket_origen_id}
              </span>
            </div>
          )}
        </div>

        {/* Edición de estado (solo admin/técnico) */}
        {puedeEditar && (
          <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wider">
              Gestión del ticket
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Estado
                </label>
                <select
                  value={estado}
                  onChange={(e) => setEstado(e.target.value as EstadoTicket)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                >
                  {estadosDisponibles.map((e) => (
                    <option key={e.value} value={e.value}>
                      {e.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Cuadrilla / Técnico
                </label>
                <input
                  type="text"
                  value={cuadrilla}
                  onChange={(e) => setCuadrilla(e.target.value)}
                  placeholder="Ej: Cuadrilla 04 (Téc. Arriaga)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={guardarCambios}
                disabled={guardando}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-xs font-semibold"
              >
                {guardando ? 'Guardando...' : 'Guardar cambios'}
              </button>

              {ticket.tipo === 'incidencia' && (
                <button
                  onClick={() => setMostrarAgendar(!mostrarAgendar)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-xs font-semibold flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faCalendarPlus} className="text-xs" />
                  {mostrarAgendar ? 'Cancelar' : 'Agendar mantenimiento'}
                </button>
              )}
            </div>

            {/* Formulario agendar */}
            {mostrarAgendar && (
              <div className="pt-3 border-t border-sky-200 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Título del mantenimiento *
                  </label>
                  <input
                    type="text"
                    value={mantTitulo}
                    onChange={(e) => setMantTitulo(e.target.value)}
                    placeholder="Ej: Revisión de empalme en poste 142"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    value={mantDescripcion}
                    onChange={(e) => setMantDescripcion(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Fecha programada
                    </label>
                    <input
                      type="datetime-local"
                      value={mantFecha}
                      onChange={(e) => setMantFecha(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Cuadrilla
                    </label>
                    <input
                      type="text"
                      value={mantCuadrilla}
                      onChange={(e) => setMantCuadrilla(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
                <button
                  onClick={agendarMantenimiento}
                  disabled={guardando}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 text-xs font-semibold"
                >
                  {guardando ? 'Agendando...' : 'Confirmar agendado'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Comentarios */}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Historial y comentarios
          </h3>

          {cargandoComentarios ? (
            <div className="text-center py-4 text-slate-400 text-xs">Cargando...</div>
          ) : comentarios.length === 0 ? (
            <div className="text-center py-4 text-slate-400 text-xs">
              Sin comentarios aún.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {comentarios.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg p-3 text-xs ${
                    c.es_interno
                      ? 'bg-amber-50 border border-amber-100'
                      : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700">
                      {c.autor_rol === 'escuela'
                        ? 'Escuela'
                        : c.autor_rol === 'admin'
                        ? 'Admin'
                        : c.autor_rol === 'tecnico'
                        ? 'Técnico'
                        : 'Sistema'}
                      {c.es_interno && (
                        <span className="ml-2 text-[10px] text-amber-700 inline-flex items-center gap-1">
                          <FontAwesomeIcon icon={faLock} className="text-[8px]" /> interno
                        </span>
                      )}
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

          {/* Nuevo comentario */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={2}
              placeholder="Escribe un comentario..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
            <div className="flex items-center justify-between mt-2">
              {puedeEditar && (
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={esInterno}
                    onChange={(e) => setEsInterno(e.target.checked)}
                    className="rounded"
                  />
                  Comentario interno (no lo ve la escuela)
                </label>
              )}
              {!puedeEditar && <span></span>}
              <button
                onClick={enviarComentario}
                disabled={enviandoComentario || !comentario.trim()}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faPaperPlane} className="text-[10px]" />
                {enviandoComentario ? 'Enviando...' : 'Comentar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// PÁGINA
// ============================================================
export default function AdminTickets() {
  const router = useRouter()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoTicket | 'todos'>('todos')
  const [filtroTipo, setFiltroTipo] = useState<TipoTicket | 'todos'>('todos')
  const [seleccionado, setSeleccionado] = useState<Ticket | null>(null)
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [cargandoComentarios, setCargandoComentarios] = useState(false)
  const [mostrarCrear, setMostrarCrear] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    try {
      setLoading(true)
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

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTickets(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function cargarComentarios(ticketId: number) {
    setCargandoComentarios(true)
    try {
      const { data, error } = await supabase
        .from('ticket_comentarios')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) throw error
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

  async function actualizarYRefrescar() {
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

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este ticket? Esta acción no se puede deshacer.')) return
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id)
      if (error) throw error
      await cargar()
    } catch (err) {
      console.error(err)
      alert('Error al eliminar')
    }
  }


  const puedeEditar = profile?.role === 'admin' || profile?.role === 'tecnico'

  const filtrados = useMemo(() => {
    return tickets.filter((t) => {
      const q = busqueda.toLowerCase()
      const coincide =
        t.titulo.toLowerCase().includes(q) ||
        t.folio.toLowerCase().includes(q) ||
        (t.descripcion && t.descripcion.toLowerCase().includes(q)) ||
        (t.cuadrilla && t.cuadrilla.toLowerCase().includes(q))
      const estadoOk = filtroEstado === 'todos' || t.estado === filtroEstado
      const tipoOk = filtroTipo === 'todos' || t.tipo === filtroTipo
      return coincide && estadoOk && tipoOk
    })
  }, [tickets, busqueda, filtroEstado, filtroTipo])

  const conteos = {
    total: tickets.length,
    abiertos: tickets.filter((t) => t.estado === 'abierto').length,
    enProceso: tickets.filter((t) =>
      ['en_revision', 'programado', 'en_camino', 'en_proceso'].includes(t.estado)
    ).length,
    resueltos: tickets.filter((t) => t.estado === 'resuelto').length,
    incidencias: tickets.filter((t) => t.tipo === 'incidencia').length,
    mantenimientos: tickets.filter((t) => t.tipo === 'mantenimiento').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Cargando tickets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* SIDEBAR */}
      <AdminSidebar
        ticketsAbiertos={conteos.abiertos}
        profile={profile}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* MAIN */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        <AdminHeader
          profile={profile}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          searchPlaceholder="Buscar por folio, título o cuadrilla..."
          searchValue={busqueda}
          onSearchChange={setBusqueda}
          actionButton={
            <button
              onClick={() => setMostrarCrear(true)}
              className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white active:scale-[0.99] transition-all shadow-sm"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              <span>Nueva incidencia</span>
            </button>
          }
        />

        <main className="p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Gestión de Tickets
            </h1>
            <p className="text-xs md:text-sm text-slate-500">
              Incidencias y mantenimientos programados en las instituciones educativas.
            </p>
          </div>

          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Abiertos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                  Revisar
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700 leading-none mb-1">
                  {conteos.abiertos}
                </div>
                <div className="text-[11px] text-slate-500">Sin asignar</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">En proceso</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                  Activos
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-700 leading-none mb-1">
                  {conteos.enProceso}
                </div>
                <div className="text-[11px] text-slate-500">Revisión / programado / en curso</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Resueltos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Cerrados
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700 leading-none mb-1">
                  {conteos.resueltos}
                </div>
                <div className="text-[11px] text-slate-500">Completados</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Histórico
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 leading-none mb-1">
                  {conteos.total}
                </div>
                <div className="text-[11px] text-slate-500">
                  {conteos.incidencias} incidencias · {conteos.mantenimientos} mant.
                </div>
              </div>
            </div>
          </section>

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 flex flex-col gap-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 overflow-x-auto select-none pb-1">
                <button
                  onClick={() => { setFiltroTipo('todos'); setFiltroEstado('todos') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroTipo === 'todos' && filtroEstado === 'todos'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos ({conteos.total})
                </button>
                <button
                  onClick={() => { setFiltroTipo('incidencia'); setFiltroEstado('todos') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroTipo === 'incidencia' && filtroEstado === 'todos'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Incidencias ({conteos.incidencias})
                </button>
                <button
                  onClick={() => { setFiltroTipo('mantenimiento'); setFiltroEstado('todos') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroTipo === 'mantenimiento' && filtroEstado === 'todos'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  Mantenimientos ({conteos.mantenimientos})
                </button>
                <div className="h-5 w-px bg-slate-200 mx-1"></div>
                <button
                  onClick={() => { setFiltroTipo('todos'); setFiltroEstado('abierto') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'abierto' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Abiertos
                </button>
                <button
                  onClick={() => { setFiltroTipo('todos'); setFiltroEstado('resuelto') }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'resuelto' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Resueltos
                </button>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {filtrados.length} resultado{filtrados.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4 font-medium">Folio</th>
                    <th className="py-3 px-4 font-medium">Tipo</th>
                    <th className="py-3 px-4 font-medium">Título</th>
                    <th className="py-3 px-4 font-medium">Prioridad</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 font-medium">Cuadrilla</th>
                    <th className="py-3 px-4 font-medium">Fecha</th>
                    <th className="py-3 px-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filtrados.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {t.folio}
                      </td>
                      <td className="py-3.5 px-4">
                        <ChipTipo tipo={t.tipo} />
                      </td>
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="font-semibold text-slate-900 text-xs line-clamp-2">
                          {t.titulo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <ChipPrioridad prioridad={t.prioridad} />
                      </td>
                      <td className="py-3.5 px-4">
                        <ChipEstado estado={t.estado} />
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {t.cuadrilla || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => abrirTicket(t)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-[10px] mr-1" />
                            Ver
                          </button>
                          {profile?.role === 'admin' && (
                            <button
                              onClick={() => eliminar(t.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtrados.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <FontAwesomeIcon icon={faTicketAlt} className="text-3xl text-slate-300 mb-2" />
                  <p className="text-sm font-medium">
                    {busqueda || filtroEstado !== 'todos' || filtroTipo !== 'todos'
                      ? 'No hay tickets con esos filtros'
                      : 'No hay tickets registrados todavía'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        <footer className="mt-auto border-t border-slate-200/60 bg-white px-8 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">GPON Telecom S.A. de C.V.</span>
            <span>•</span>
            <span>Sistema de Monitoreo Escolar de Banda Ancha</span>
          </div>
          <div className="font-mono text-[11px] mt-2 sm:mt-0">Soporte 24/7: 800-4766-NOC</div>
        </footer>
      </div>

      {/* Modal crear */}
      {mostrarCrear && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-3 overflow-y-auto">
          <div className="w-full max-w-lg my-8">
            <ModalCrearTicket
              onClose={() => setMostrarCrear(false)}
              onCreated={cargar}
            />
          </div>
        </div>
      )}

      {/* Modal detalle */}
      {seleccionado && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-3 overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <ModalDetalleTicket
              ticket={seleccionado}
              comentarios={comentarios}
              cargandoComentarios={cargandoComentarios}
              onClose={() => setSeleccionado(null)}
              onActualizado={actualizarYRefrescar}
              puedeEditar={puedeEditar}
            />
          </div>
        </div>
      )}
    </div>
  )
}