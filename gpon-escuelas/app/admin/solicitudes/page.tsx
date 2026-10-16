'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

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
  faMap,
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[95vh] overflow-y-auto">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FontAwesomeIcon icon={faBuilding} className="text-blue-600 dark:text-blue-400" />
            Solicitud #{solicitud.id}
          </h2>
          <ChipEstado estado={solicitud.estado} />
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          disabled={procesando}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Institución */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Datos de la institución
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">Nombre:</span>
              <span className="text-slate-900 dark:text-white font-semibold text-right max-w-[60%]">
                {solicitud.nombre_institucion}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">CCT:</span>
              <span className="font-mono font-semibold text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-800 px-2 py-0.5 rounded-md">
                {solicitud.cct}
              </span>
            </div>
            {solicitud.turno && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Turno:</span>
                <span className="text-slate-900 dark:text-slate-200">{solicitud.turno}</span>
              </div>
            )}
            {solicitud.domicilio && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Domicilio:</span>
                <span className="text-slate-900 dark:text-slate-200 text-right max-w-[60%]">
                  {solicitud.domicilio}
                </span>
              </div>
            )}
            {solicitud.matricula && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Matrícula:</span>
                <span className="text-slate-900 dark:text-slate-200">{solicitud.matricula}</span>
              </div>
            )}
            {solicitud.ciclo_escolar && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Ciclo escolar:</span>
                <span className="text-slate-900 dark:text-slate-200">{solicitud.ciclo_escolar}</span>
              </div>
            )}
            {solicitud.zona_escolar && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Zona escolar:</span>
                <span className="text-slate-900 dark:text-slate-200">{solicitud.zona_escolar}</span>
              </div>
            )}
            {solicitud.año_ejecucion && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Año de ejecución:</span>
                <span className="text-slate-900 dark:text-slate-200">{solicitud.año_ejecucion}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contacto */}
        <div>
          <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
            Contacto
          </h3>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/60 rounded-xl p-4 space-y-2">
            {solicitud.director && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUser} className="text-slate-400 text-xs" />
                  Director:
                </span>
                <span className="text-slate-900 dark:text-white text-right max-w-[60%]">
                  {solicitud.director}
                </span>
              </div>
            )}
            {solicitud.telefono && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faPhone} className="text-slate-400 text-xs" />
                  Teléfono:
                </span>
                <span className="text-slate-900 dark:text-white font-mono">{solicitud.telefono}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faEnvelope} className="text-slate-400 text-xs" />
                Correo:
              </span>
              <span className="text-slate-900 dark:text-white font-mono text-right max-w-[60%] break-all">
                {solicitud.correo}
              </span>
            </div>
            {solicitud.presidente_asociacion && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Presidente asociación:</span>
                <span className="text-slate-900 dark:text-white text-right max-w-[60%]">
                  {solicitud.presidente_asociacion}
                </span>
              </div>
            )}
            {solicitud.telefono_asociacion && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 dark:text-slate-400">Tel. asociación:</span>
                <span className="text-slate-900 dark:text-white font-mono">
                  {solicitud.telefono_asociacion}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <FontAwesomeIcon icon={faCalendar} className="text-slate-400" />
          Recibida el {new Date(solicitud.created_at).toLocaleString('es-MX')}
        </div>

        {solicitud.notas_admin && (
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Nota del administrador
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300">{solicitud.notas_admin}</p>
          </div>
        )}

        {/* Acciones */}
        {esPendiente ? (
          <>
            {accion === 'ninguna' && (
              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4">
                <p className="text-xs text-blue-800 dark:text-blue-300 mb-3">
                  Al aprobar, se creará la cuenta, se enviará un correo con las
                  credenciales y la institución quedará vinculada en el padrón.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setAccion('aprobar')}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-semibold shadow-sm"
                  >
                    <FontAwesomeIcon icon={faCheckCircle} />
                    Aprobar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccion('rechazar')}
                    className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 text-sm font-semibold shadow-sm"
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
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
                }`}
              >
                <p
                  className={`text-xs font-semibold mb-3 ${
                    accion === 'aprobar' ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                  }`}
                >
                  {accion === 'aprobar'
                    ? 'Confirmar aprobación de la solicitud'
                    : 'Confirmar rechazo de la solicitud'}
                </p>

                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                  {accion === 'rechazar'
                    ? 'Motivo del rechazo (opcional, se enviará por correo)'
                    : 'Nota interna (opcional)'}
                </label>
                <textarea
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-3"
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
                    className="px-4 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm font-semibold disabled:opacity-60"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-300">
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
    <div className="min-h-screen flex font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* SIDEBAR */}
      <AdminSidebar
        solicitudesPendientes={conteos.pendiente}
        profile={profile}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* MAIN */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        <AdminHeader
          profile={profile}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          searchPlaceholder="Buscar por institución, CCT o correo..."
          searchValue={busqueda}
          onSearchChange={setBusqueda}
          actionButton={
            <div className="flex items-center gap-2">
              <Link
                href="/admin/mapa"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
              >
                <FontAwesomeIcon icon={faMap} className="text-slate-500 text-[10px]" />
                <span className="hidden sm:inline">Ver mapa</span>
              </Link>
              <Link
                href="/admin/instituciones"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
              >
                <FontAwesomeIcon icon={faBuilding} className="text-slate-500 text-[10px]" />
                <span className="hidden sm:inline">Instituciones</span>
              </Link>
            </div>
          }
        />

        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                Solicitudes de Vinculación
              </h1>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Revisa y aprueba solicitudes de acceso enviadas por instituciones educativas.
              </p>
            </div>
          </div>

          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Pendientes</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800">
                  Revisar
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-400 tracking-tight leading-none mb-1">
                  {conteos.pendiente}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Por aprobar o rechazar
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Aprobadas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                  Éxito
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight leading-none mb-1">
                  {conteos.aprobada}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Cuentas creadas
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Rechazadas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-800">
                  Cerradas
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 tracking-tight leading-none mb-1">
                  {conteos.rechazada}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Sin acceso
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total histórico</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                  Todas
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                  {conteos.todas}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Recibidas en el sistema
                </div>
              </div>
            </div>
          </section>

          {/* Tabla */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shadow-sm p-6 flex flex-col gap-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2 overflow-x-auto select-none pb-1">
                <button
                  onClick={() => setFiltroEstado('pendiente')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'pendiente'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                  }`}
                >
                  Pendientes ({conteos.pendiente})
                </button>
                <button
                  onClick={() => setFiltroEstado('aprobada')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'aprobada'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                  }`}
                >
                  Aprobadas ({conteos.aprobada})
                </button>
                <button
                  onClick={() => setFiltroEstado('rechazada')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'rechazada'
                      ? 'bg-rose-600 text-white'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                  }`}
                >
                  Rechazadas ({conteos.rechazada})
                </button>
                <button
                  onClick={() => setFiltroEstado('todas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'todas'
                      ? 'bg-slate-900 dark:bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
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

            <div className="overflow-x-auto touch-pan-x border border-slate-200/80 dark:border-slate-700 rounded-xl">
              <table className="w-full min-w-[750px] text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4 font-medium">CCT</th>
                    <th className="py-3 px-4 font-medium">Institución</th>
                    <th className="py-3 px-4 font-medium">Director / Correo</th>
                    <th className="py-3 px-4 font-medium">Recibida</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                  {paginadas.map((sol) => (
                    <tr key={sol.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-sky-800 dark:text-sky-300">
                        <span className="bg-sky-50 dark:bg-sky-950/50 border border-sky-100 dark:border-sky-800 px-2 py-0.5 rounded-md">
                          {sol.cct}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-[260px]">
                        <div className="font-semibold text-slate-900 dark:text-white text-xs line-clamp-2">
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
                          <div className="text-slate-800 dark:text-slate-200 text-xs truncate">
                            {sol.director}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {sol.correo}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
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
                            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
                            title="Ver y procesar"
                          >
                            <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                            {sol.estado === 'pendiente' && esAdmin ? 'Revisar' : 'Ver'}
                          </button>
                          {esAdmin && (
                            <button
                              onClick={() => eliminar(sol.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-all"
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
                <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                  <FontAwesomeIcon
                    icon={faHourglassHalf}
                    className="text-3xl text-slate-300 dark:text-slate-600 mb-2"
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 pt-2">
                <span className="font-mono text-[11px]">
                  Mostrando <strong className="text-slate-800 dark:text-slate-200">{inicio + 1}</strong>–
                  <strong className="text-slate-800 dark:text-slate-200">
                    {Math.min(inicio + porPagina, filtradas.length)}
                  </strong>{' '}
                  de <strong className="text-slate-800 dark:text-slate-200">{filtradas.length}</strong> solicitudes
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={paginaActual === 1}
                    onClick={() => setPagina((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all"
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
                            ? 'border border-slate-900 bg-slate-900 dark:border-blue-600 dark:bg-blue-600 text-white font-semibold'
                            : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        {num}
                      </button>
                    )
                  })}
                  <button
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-all"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>

        <footer className="mt-auto border-t border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">GPON Telecom S.A. de C.V.</span>
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