'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle,
  faXmarkCircle,
  faHourglassHalf,
  faSearch,
  faBuilding,
  faUser,
  faPhone,
  faEnvelope,
  faCalendar,
  faTimes,
  faExclamationTriangle,
  faTrash,
  faEye,
} from '@fortawesome/free-solid-svg-icons'

type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada'

type Solicitud = {
  id: number
  nombre_institucion: string
  cct: string
  correo: string
  domicilio: string | null
  matricula: number | null
  director: string | null
  telefono: string | null
  año_ejecucion: number | null
  presidente_asociacion: string | null
  telefono_asociacion: string | null
  ciclo_escolar: string | null
  zona_escolar: string | null
  turno: string | null
  estado: EstadoSolicitud
  notas_admin: string | null
  aprobada_en: string | null
  rechazada_en: string | null
  created_at: string
}

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'tecnico' | 'escuela'
}

// ============================================================
// CHIP DE ESTADO
// ============================================================
function ChipEstado({ estado }: { estado: EstadoSolicitud }) {
  const config: Record<
    EstadoSolicitud,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    pendiente: {
      label: 'Pendiente',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      icon: faHourglassHalf,
    },
    aprobada: {
      label: 'Aprobada',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
      icon: faCheckCircle,
    },
    rechazada: {
      label: 'Rechazada',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
      icon: faXmarkCircle,
    },
  }
  const c = config[estado]
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}
    >
      <FontAwesomeIcon icon={c.icon} className="text-[9px]" />
      {c.label}
    </span>
  )
}

// ============================================================
// MODAL DE DETALLE / ACCIONES
// ============================================================
function ModalSolicitud({
  solicitud,
  onClose,
  onAprobar,
  onRechazar,
  procesando,
}: {
  solicitud: Solicitud
  onClose: () => void
  onAprobar: (nota: string) => void
  onRechazar: (nota: string) => void
  procesando: boolean
}) {
  const [nota, setNota] = useState('')
  const [accion, setAccion] = useState<'ninguna' | 'aprobar' | 'rechazar'>('ninguna')

  const esPendiente = solicitud.estado === 'pendiente'

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] overflow-y-auto">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faBuilding} className="text-blue-600" />
            Solicitud #{solicitud.id}
          </h2>
          <ChipEstado estado={solicitud.estado} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          disabled={procesando}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Institución */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Datos de la institución
          </h3>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Nombre:</span>
              <span className="text-slate-900 font-semibold text-right max-w-[60%]">
                {solicitud.nombre_institucion}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">CCT:</span>
              <span className="font-mono font-semibold text-sky-800 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                {solicitud.cct}
              </span>
            </div>
            {solicitud.turno && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Turno:</span>
                <span className="text-slate-900">{solicitud.turno}</span>
              </div>
            )}
            {solicitud.domicilio && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Domicilio:</span>
                <span className="text-slate-900 text-right max-w-[60%]">
                  {solicitud.domicilio}
                </span>
              </div>
            )}
            {solicitud.matricula && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Matrícula:</span>
                <span className="text-slate-900">{solicitud.matricula}</span>
              </div>
            )}
            {solicitud.ciclo_escolar && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Ciclo escolar:</span>
                <span className="text-slate-900">{solicitud.ciclo_escolar}</span>
              </div>
            )}
            {solicitud.zona_escolar && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Zona escolar:</span>
                <span className="text-slate-900">{solicitud.zona_escolar}</span>
              </div>
            )}
            {solicitud.año_ejecucion && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Año de ejecución:</span>
                <span className="text-slate-900">{solicitud.año_ejecucion}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
            Contacto
          </h3>
          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            {solicitud.director && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUser} className="text-slate-400 text-xs" />
                  Director:
                </span>
                <span className="text-slate-900 text-right max-w-[60%]">
                  {solicitud.director}
                </span>
              </div>
            )}
            {solicitud.telefono && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faPhone} className="text-slate-400 text-xs" />
                  Teléfono:
                </span>
                <span className="text-slate-900 font-mono">{solicitud.telefono}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faEnvelope} className="text-slate-400 text-xs" />
                Correo:
              </span>
              <span className="text-slate-900 font-mono text-right max-w-[60%] break-all">
                {solicitud.correo}
              </span>
            </div>
            {solicitud.presidente_asociacion && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Presidente asociación:</span>
                <span className="text-slate-900 text-right max-w-[60%]">
                  {solicitud.presidente_asociacion}
                </span>
              </div>
            )}
            {solicitud.telefono_asociacion && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tel. asociación:</span>
                <span className="text-slate-900 font-mono">
                  {solicitud.telefono_asociacion}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <FontAwesomeIcon icon={faCalendar} className="text-slate-400" />
          Recibida el {new Date(solicitud.created_at).toLocaleString('es-MX')}
        </div>

        {solicitud.notas_admin && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Nota del administrador
            </p>
            <p className="text-sm text-slate-700">{solicitud.notas_admin}</p>
          </div>
        )}

        {/* Acciones */}
        {esPendiente ? (
          <>
            {accion === 'ninguna' && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-xs text-blue-800 mb-3">
                  Al aprobar, se creará la cuenta, se enviará un correo con las
                  credenciales y la institución quedará vinculada en el padrón.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAccion('aprobar')}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccion('rechazar')}
                    className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <FontAwesomeIcon icon={faXmarkCircle} />
                    Rechazar
                  </button>
                </div>
              </div>
            )}

            {accion !== 'ninguna' && (
              <div
                className={`rounded-xl p-4 border ${
                  accion === 'aprobar'
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-rose-50 border-rose-200'
                }`}
              >
                <p
                  className={`text-xs font-semibold mb-3 ${
                    accion === 'aprobar' ? 'text-emerald-800' : 'text-rose-800'
                  }`}
                >
                  {accion === 'aprobar'
                    ? 'Confirmar aprobación de la solicitud'
                    : 'Confirmar rechazo de la solicitud'}
                </p>

                <label className="block text-xs font-medium text-slate-600 mb-1">
                  {accion === 'rechazar'
                    ? 'Motivo del rechazo (opcional, se enviará por correo)'
                    : 'Nota interna (opcional)'}
                </label>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-3"
                  placeholder={
                    accion === 'rechazar' ? 'Ej: Datos incorrectos...' : 'Ej: Verificado por...'
                  }
                />

                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() =>
                      accion === 'aprobar' ? onAprobar(nota) : onRechazar(nota)
                    }
                    className={`flex-1 px-4 py-2.5 text-white rounded-lg disabled:opacity-60 transition-colors flex items-center justify-center gap-2 text-sm font-semibold ${
                      accion === 'aprobar'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-rose-600 hover:bg-rose-700'
                    }`}
                  >
                    <FontAwesomeIcon
                      icon={accion === 'aprobar' ? faCheckCircle : faXmarkCircle}
                    />
                    {procesando
                      ? 'Procesando...'
                      : accion === 'aprobar'
                      ? 'Confirmar aprobación'
                      : 'Confirmar rechazo'}
                  </button>
                  <button
                    type="button"
                    disabled={procesando}
                    onClick={() => {
                      setAccion('ninguna')
                      setNota('')
                    }}
                    className="px-4 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm font-semibold disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">
            Esta solicitud ya fue procesada.{' '}
            {solicitud.aprobada_en &&
              `Aprobada el ${new Date(solicitud.aprobada_en).toLocaleString('es-MX')}`}
            {solicitud.rechazada_en &&
              `Rechazada el ${new Date(solicitud.rechazada_en).toLocaleString('es-MX')}`}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// PÁGINA
// ============================================================
export default function AdminSolicitudes() {
  const router = useRouter()
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoSolicitud | 'todas'>('pendiente')
  const [seleccionada, setSeleccionada] = useState<Solicitud | null>(null)
  const [procesando, setProcesando] = useState(false)
  const [pagina, setPagina] = useState(1)
  const porPagina = 10

  useEffect(() => {
    cargar()
  }, [])

  async function cargar() {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
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
        .from('solicitudes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSolicitudes(data || [])
    } catch (err) {
      console.error(err)
      alert('Error al cargar las solicitudes')
    } finally {
      setLoading(false)
    }
  }

  async function aprobar(solicitudId: number, nota: string) {
    setProcesando(true)
    try {
      const res = await fetch('/api/aprobar-solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId, nota }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al aprobar')

      if (json.aviso) {
        alert(json.aviso + (json.passwordTemporal ? `\n\nContraseña temporal: ${json.passwordTemporal}` : ''))
      } else {
        alert('Solicitud aprobada. Se envió un correo con las credenciales.')
      }

      setSeleccionada(null)
      await cargar()
    } catch (err: any) {
      alert('Error: ' + (err.message || 'desconocido'))
    } finally {
      setProcesando(false)
    }
  }

  async function rechazar(solicitudId: number, nota: string) {
    setProcesando(true)
    try {
      const res = await fetch('/api/rechazar-solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitudId, nota }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al rechazar')

      alert('Solicitud rechazada.')
      setSeleccionada(null)
      await cargar()
    } catch (err: any) {
      alert('Error: ' + (err.message || 'desconocido'))
    } finally {
      setProcesando(false)
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar esta solicitud? Esta acción no se puede deshacer.')) return
    try {
      const { error } = await supabase.from('solicitudes').delete().eq('id', id)
      if (error) throw error
      await cargar()
    } catch (err) {
      console.error(err)
      alert('Error al eliminar')
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const iniciales = (profile?.full_name || profile?.email || 'AD')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const esAdmin = profile?.role === 'admin'

  const filtradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const q = busqueda.toLowerCase()
      const coincide =
        s.nombre_institucion.toLowerCase().includes(q) ||
        s.cct.toLowerCase().includes(q) ||
        s.correo.toLowerCase().includes(q) ||
        (s.director && s.director.toLowerCase().includes(q))
      const estadoOk = filtroEstado === 'todas' || s.estado === filtroEstado
      return coincide && estadoOk
    })
  }, [solicitudes, busqueda, filtroEstado])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * porPagina
  const paginadas = filtradas.slice(inicio, inicio + porPagina)

  useEffect(() => {
    setPagina(1)
  }, [busqueda, filtroEstado])

  const conteos = {
    todas: solicitudes.length,
    pendiente: solicitudes.filter((s) => s.estado === 'pendiente').length,
    aprobada: solicitudes.filter((s) => s.estado === 'aprobada').length,
    rechazada: solicitudes.filter((s) => s.estado === 'rechazada').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Cargando solicitudes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full font-sans text-slate-800 bg-[#f8fafc] antialiased flex selection:bg-sky-100 selection:text-sky-900">
      {/* SIDEBAR */}
      <aside className="flex flex-col justify-between h-screen w-64 fixed left-0 top-0 z-50 bg-white border-r border-slate-200 select-none text-slate-600">
        <div className="flex flex-col overflow-y-auto">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100 bg-white">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 p-1 flex items-center justify-center shadow-sm flex-shrink-0">
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-xs">
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
              <a
                href="/admin"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Panel principal
                </span>
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Administración
              </span>
              <a
                href="/admin/instituciones"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Instituciones
                </span>
              </a>
              <a
                href="/admin/solicitudes"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-50 text-blue-600 font-semibold border border-sky-100 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Solicitudes
                </span>
                {conteos.pendiente > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                    {conteos.pendiente}
                  </span>
                )}
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Soporte
              </span>
              <a href="#mantenimiento" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Mantenimiento
              </a>
              <a href="#incidencias" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Incidencias
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Sistema
              </span>
              <a href="#usuarios" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Usuarios
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
                {profile?.full_name || 'Administrador General'}
              </span>
              <span className="text-[11px] text-slate-500 font-normal capitalize">
                {profile?.role || 'admin'}
              </span>
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 transition-all"
          >
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
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
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por institución, CCT o correo..."
                className="w-full pl-3.5 pr-14 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-xs text-slate-700">
              {iniciales}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight">
                {profile?.full_name || 'Administrador'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">NOC Central</span>
            </div>
          </div>
        </header>

        <main className="p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                Solicitudes de Vinculación
              </h1>
              <p className="text-xs md:text-sm text-slate-500">
                Revisa y aprueba solicitudes de acceso enviadas por instituciones educativas.
              </p>
            </div>
          </div>

          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Pendientes</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                  Revisar
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700 tracking-tight leading-none mb-1">
                  {conteos.pendiente}
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Por aprobar o rechazar
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Aprobadas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Éxito
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700 tracking-tight leading-none mb-1">
                  {conteos.aprobada}
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Cuentas creadas
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Rechazadas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                  Cerradas
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-rose-700 tracking-tight leading-none mb-1">
                  {conteos.rechazada}
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Sin acceso
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total histórico</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Todas
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                  {conteos.todas}
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Recibidas en el sistema
                </div>
              </div>
            </div>
          </section>

          {/* Tabla */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 flex flex-col gap-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 overflow-x-auto select-none pb-1">
                <button
                  onClick={() => setFiltroEstado('pendiente')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'pendiente'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  Pendientes ({conteos.pendiente})
                </button>
                <button
                  onClick={() => setFiltroEstado('aprobada')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'aprobada'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Aprobadas ({conteos.aprobada})
                </button>
                <button
                  onClick={() => setFiltroEstado('rechazada')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'rechazada'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Rechazadas ({conteos.rechazada})
                </button>
                <button
                  onClick={() => setFiltroEstado('todas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'todas'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas ({conteos.todas})
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-400">
                  {filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4 font-medium">CCT</th>
                    <th className="py-3 px-4 font-medium">Institución</th>
                    <th className="py-3 px-4 font-medium">Director / Correo</th>
                    <th className="py-3 px-4 font-medium">Recibida</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginadas.map((sol) => (
                    <tr key={sol.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-sky-800">
                        <span className="bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                          {sol.cct}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <div className="font-semibold text-slate-900 text-xs line-clamp-2">
                          {sol.nombre_institucion}
                        </div>
                        {sol.turno && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Turno: {sol.turno}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-[220px]">
                        {sol.director && (
                          <div className="text-slate-800 text-xs truncate">
                            {sol.director}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 font-mono truncate">
                          {sol.correo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(sol.created_at).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3.5 px-4">
                        <ChipEstado estado={sol.estado} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSeleccionada(sol)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-1.5"
                            title="Ver y procesar"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                            {sol.estado === 'pendiente' && esAdmin ? 'Revisar' : 'Ver'}
                          </button>
                          {esAdmin && (
                            <button
                              onClick={() => eliminar(sol.id)}
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

              {paginadas.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <FontAwesomeIcon
                    icon={faHourglassHalf}
                    className="text-3xl text-slate-300 mb-2"
                  />
                  <p className="text-sm font-medium">
                    {busqueda || filtroEstado !== 'todas'
                      ? 'No hay solicitudes con esos filtros'
                      : 'No hay solicitudes registradas'}
                  </p>
                </div>
              )}
            </div>

            {filtradas.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 pt-2">
                <span className="font-mono text-[11px]">
                  Mostrando <strong className="text-slate-800">{inicio + 1}</strong>–
                  <strong className="text-slate-800">
                    {Math.min(inicio + porPagina, filtradas.length)}
                  </strong>{' '}
                  de <strong className="text-slate-800">{filtradas.length}</strong> solicitudes
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={paginaActual === 1}
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all"
                  >
                    Anterior
                  </button>
                  {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                    let num
                    if (totalPaginas <= 5) num = i + 1
                    else if (paginaActual <= 3) num = i + 1
                    else if (paginaActual >= totalPaginas - 2)
                      num = totalPaginas - 4 + i
                    else num = paginaActual - 2 + i
                    return (
                      <button
                        key={num}
                        onClick={() => setPagina(num)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                          num === paginaActual
                            ? 'border border-slate-900 bg-slate-900 text-white font-semibold'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {num}
                      </button>
                    )
                  })}
                  <button
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-auto border-t border-slate-200/60 bg-white px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">GPON Telecom S.A. de C.V.</span>
            <span>•</span>
            <span>Sistema de Monitoreo Escolar de Banda Ancha</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 mt-2 sm:mt-0">
            <span>Soporte 24/7: 800-4766-NOC</span>
          </div>
        </footer>
      </div>

      {/* Modal */}
      {seleccionada && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-3 overflow-y-auto">
          <div className="w-full max-w-2xl my-8">
            <ModalSolicitud
              solicitud={seleccionada}
              onClose={() => setSeleccionada(null)}
              onAprobar={(nota) => aprobar(seleccionada.id, nota)}
              onRechazar={(nota) => rechazar(seleccionada.id, nota)}
              procesando={procesando}
            />
          </div>
        </div>
      )}
    </div>
  )
}