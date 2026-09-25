'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBuilding,
  faPlus,
  faEdit,
  faTrash,
  faSearch,
  faLocationDot,
  faUser,
  faPhone,
  faEnvelope,
  faCheckCircle,
  faHourglassHalf,
  faXmarkCircle,
  faInfoCircle,
  faTimes,
  faMap,
  faRoute,
  faFilter,
  faSchool,
} from '@fortawesome/free-solid-svg-icons'
import type { Profile, Institucion, EstadoVinculacion } from '@/types'

// Dynamic import para MapaDinamico (Leaflet no soporta SSR)
const MapaDinamico = dynamic(() => import('./MapaDinamico'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500 dark:text-slate-400">Cargando mapa...</p>
      </div>
    </div>
  ),
})

function ChipEstado({ estado }: { estado: EstadoVinculacion }) {
  const config: Record<
    EstadoVinculacion,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    vinculada: {
      label: 'Vinculada',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: faCheckCircle,
    },
    en_proceso: {
      label: 'En proceso',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: faHourglassHalf,
    },
    no_vinculada: {
      label: 'No vinculada',
      bg: 'bg-slate-100 dark:bg-slate-700/60',
      text: 'text-slate-600 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-600',
      icon: faInfoCircle,
    },
    rechazada: {
      label: 'Rechazada',
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      icon: faXmarkCircle,
    },
  }
  const c = config[estado] || config.no_vinculada
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${c.bg} ${c.text} ${c.border}`}
    >
      <FontAwesomeIcon icon={c.icon} className="text-[9px]" />
      {c.label}
    </span>
  )
}

function InstitucionesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Filtros
  const [busqueda, setBusqueda] = useState(searchParams?.get('buscar') || '')
  const [filtroEstado, setFiltroEstado] = useState<EstadoVinculacion | 'todas'>('todas')
  const [filtroGPS, setFiltroGPS] = useState<'todas' | 'con_gps' | 'sin_gps'>('todas')

  // Modales
  const [modalFormulario, setModalFormulario] = useState(false)
  const [escuelaEditando, setEscuelaEditando] = useState<Institucion | null>(null)
  const [escuelaEliminando, setEscuelaEliminando] = useState<Institucion | null>(null)

  // Estado del formulario
  const [formNombre, setFormNombre] = useState('')
  const [formCCT, setFormCCT] = useState('')
  const [formDomicilio, setFormDomicilio] = useState('')
  const [formDirector, setFormDirector] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formCorreo, setFormCorreo] = useState('')
  const [formEstadoVinculacion, setFormEstadoVinculacion] = useState<EstadoVinculacion>('no_vinculada')
  const [posicionMapa, setPosicionMapa] = useState<{ lat: number; lng: number } | null>(null)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  // Si la URL trae ?nueva=1 o ?nuevo=1, abrir modal de creación
  useEffect(() => {
    if (searchParams?.get('nueva') === '1' || searchParams?.get('nuevo') === '1') {
      nuevaEscuela()
    }
  }, [searchParams])

  async function cargarDatos() {
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
      setProfile(prof as Profile)

      const { data, error } = await supabase
        .from('instituciones')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error
      setInstituciones((data as Institucion[]) || [])
    } catch (err) {
      console.error('Error cargando instituciones:', err)
    } finally {
      setLoading(false)
    }
  }

  function nuevaEscuela() {
    setEscuelaEditando(null)
    setFormNombre('')
    setFormCCT('')
    setFormDomicilio('')
    setFormDirector('')
    setFormTelefono('')
    setFormCorreo('')
    setFormEstadoVinculacion('no_vinculada')
    setPosicionMapa(null)
    setErrorForm(null)
    setModalFormulario(true)
  }

  function editarEscuela(inst: Institucion) {
    setEscuelaEditando(inst)
    setFormNombre(inst.nombre || '')
    setFormCCT(inst.cct || '')
    setFormDomicilio(inst.domicilio || '')
    setFormDirector(inst.director || '')
    setFormTelefono(inst.telefono || '')
    setFormCorreo(inst.correo || '')
    setFormEstadoVinculacion(inst.estado_vinculacion || 'no_vinculada')
    setPosicionMapa(
      inst.latitude && inst.longitude
        ? { lat: inst.latitude, lng: inst.longitude }
        : null
    )
    setErrorForm(null)
    setModalFormulario(true)
  }

  async function handleGuardarEscuela(e: React.FormEvent) {
    e.preventDefault()
    setErrorForm(null)

    if (!formNombre.trim()) {
      setErrorForm('El nombre de la institución es obligatorio.')
      return
    }

    setGuardando(true)

    try {
      const payload: Partial<Institucion> = {
        nombre: formNombre.trim(),
        cct: formCCT.trim().toUpperCase() || null,
        domicilio: formDomicilio.trim() || null,
        director: formDirector.trim() || null,
        telefono: formTelefono.trim() || null,
        correo: formCorreo.trim().toLowerCase() || null,
        estado_vinculacion: formEstadoVinculacion,
        latitude: posicionMapa?.lat ?? null,
        longitude: posicionMapa?.lng ?? null,
        updated_at: new Date().toISOString(),
      }

      if (escuelaEditando) {
        const { data, error } = await supabase
          .from('instituciones')
          .update(payload)
          .eq('id', escuelaEditando.id)
          .select()
          .single()

        if (error) throw error
        setInstituciones((prev) =>
          prev.map((i) => (i.id === escuelaEditando.id ? (data as Institucion) : i))
        )
      } else {
        const { data, error } = await supabase
          .from('instituciones')
          .insert([payload])
          .select()
          .single()

        if (error) throw error
        setInstituciones((prev) => [data as Institucion, ...prev])
      }

      setModalFormulario(false)
    } catch (err: unknown) {
      setErrorForm(err instanceof Error ? err.message : 'Error al guardar la escuela')
    } finally {
      setGuardando(false)
    }
  }

  async function confirmarEliminar() {
    if (!escuelaEliminando) return
    setGuardando(true)

    try {
      const { error } = await supabase
        .from('instituciones')
        .delete()
        .eq('id', escuelaEliminando.id)

      if (error) throw error

      setInstituciones((prev) => prev.filter((i) => i.id !== escuelaEliminando.id))
      setEscuelaEliminando(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar institución')
    } finally {
      setGuardando(false)
    }
  }

  // KPIs
  const conteos = useMemo(() => {
    return {
      total: instituciones.length,
      vinculadas: instituciones.filter((i) => i.estado_vinculacion === 'vinculada').length,
      enProceso: instituciones.filter((i) => i.estado_vinculacion === 'en_proceso').length,
      noVinculadas: instituciones.filter((i) => i.estado_vinculacion === 'no_vinculada').length,
      conGPS: instituciones.filter((i) => i.latitude !== null && i.longitude !== null).length,
      sinGPS: instituciones.filter((i) => i.latitude === null || i.longitude === null).length,
    }
  }, [instituciones])

  // Filtrado
  const filtradas = useMemo(() => {
    return instituciones.filter((i) => {
      const q = busqueda.trim().toLowerCase()
      const coincideBusqueda =
        !q ||
        i.nombre.toLowerCase().includes(q) ||
        (i.cct && i.cct.toLowerCase().includes(q)) ||
        (i.domicilio && i.domicilio.toLowerCase().includes(q)) ||
        (i.director && i.director.toLowerCase().includes(q))

      const coincideEstado = filtroEstado === 'todas' || i.estado_vinculacion === filtroEstado

      const coincideGPS =
        filtroGPS === 'todas' ||
        (filtroGPS === 'con_gps' && i.latitude !== null && i.longitude !== null) ||
        (filtroGPS === 'sin_gps' && (i.latitude === null || i.longitude === null))

      return coincideBusqueda && coincideEstado && coincideGPS
    })
  }, [instituciones, busqueda, filtroEstado, filtroGPS])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] dark:bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando padrón escolar...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* SIDEBAR UNIFICADO */}
      <AdminSidebar
        profile={profile}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        {/* HEADER UNIFICADO */}
        <AdminHeader
          profile={profile}
          searchValue={busqueda}
          onSearchChange={setBusqueda}
          searchPlaceholder="Buscar por nombre, CCT o localidad..."
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          actionButton={
            <div className="flex items-center gap-2">
              <Link
                href="/admin/mapa"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
              >
                <FontAwesomeIcon icon={faMap} className="text-blue-600 dark:text-blue-400 text-xs" />
                <span>Ver en mapa</span>
              </Link>
              <button
                onClick={nuevaEscuela}
                className="px-3.5 md:px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white active:scale-[0.99] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                <span className="hidden sm:inline">Añadir Escuela</span>
                <span className="sm:hidden">Nueva</span>
              </button>
            </div>
          }
        />

        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* BANNER / TITULO */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FontAwesomeIcon icon={faBuilding} className="text-sm" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Padrón de Instituciones Educativas
                </h1>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Directorio y control de escuelas registradas para servicio de fibra óptica GPON en el Estado de México.
              </p>
            </div>

            <button
              onClick={nuevaEscuela}
              className="self-start md:self-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPlus} />
              + Añadir Nueva Escuela
            </button>
          </div>

          {/* KPIS */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Escuelas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  Padrón
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                  {conteos.total}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Registradas en sistema
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Vinculadas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                  Activas
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 tracking-tight leading-none mb-1">
                  {conteos.vinculadas}
                </div>
                <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Con servicio GPON activo
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">En Proceso</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900">
                  Instalación
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300 tracking-tight leading-none mb-1">
                  {conteos.enProceso}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  En trámite o validación
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Con Coordenadas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900">
                  GPS
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-700 dark:text-sky-300 tracking-tight leading-none mb-1">
                  {conteos.conGPS}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {conteos.sinGPS} sin ubicar en mapa
                </div>
              </div>
            </div>
          </section>

          {/* FILTROS Y CONTROLES */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* TABS DE ESTADO */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFiltroEstado('todas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  filtroEstado === 'todas'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Todas ({conteos.total})
              </button>
              <button
                onClick={() => setFiltroEstado('vinculada')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroEstado === 'vinculada'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <FontAwesomeIcon icon={faCheckCircle} className="text-[10px]" />
                Vinculadas ({conteos.vinculadas})
              </button>
              <button
                onClick={() => setFiltroEstado('en_proceso')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroEstado === 'en_proceso'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <FontAwesomeIcon icon={faHourglassHalf} className="text-[10px]" />
                En Proceso ({conteos.enProceso})
              </button>
              <button
                onClick={() => setFiltroEstado('no_vinculada')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  filtroEstado === 'no_vinculada'
                    ? 'bg-slate-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <FontAwesomeIcon icon={faInfoCircle} className="text-[10px]" />
                No Vinculadas ({conteos.noVinculadas})
              </button>
            </div>

            {/* FILTRO GPS */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">GPS:</span>
              <select
                value={filtroGPS}
                onChange={(e) => setFiltroGPS(e.target.value as 'todas' | 'con_gps' | 'sin_gps')}
                className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="todas">Todos los registros</option>
                <option value="con_gps">Con ubicación GPS ({conteos.conGPS})</option>
                <option value="sin_gps">Sin coordenadas ({conteos.sinGPS})</option>
              </select>
            </div>
          </div>

          {/* TABLA DE INSTITUCIONES */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4 md:px-6">Institución / CCT</th>
                    <th className="py-3 px-4">Ubicación / Domicilio</th>
                    <th className="py-3 px-4">Estado de Conexión</th>
                    <th className="py-3 px-4 hidden sm:table-cell">Contacto</th>
                    <th className="py-3 px-4 hidden md:table-cell">Coordenadas</th>
                    <th className="py-3 px-4 md:px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
                  {filtradas.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        <FontAwesomeIcon icon={faBuilding} className="text-3xl mb-2 opacity-50 block mx-auto" />
                        No se encontraron instituciones educativas con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filtradas.map((inst) => (
                      <tr
                        key={inst.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        {/* INSTITUCION Y CCT */}
                        <td className="py-3 px-4 md:px-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white leading-snug">
                              {inst.nombre}
                            </span>
                            <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                              CCT: {inst.cct || 'Sin registrar'}
                            </span>
                          </div>
                        </td>

                        {/* DOMICILIO */}
                        <td className="py-3 px-4 max-w-xs">
                          <span className="text-slate-600 dark:text-slate-300 truncate block">
                            {inst.domicilio || 'Sin domicilio registrado'}
                          </span>
                        </td>

                        {/* ESTADO VINCULACION */}
                        <td className="py-3 px-4">
                          <ChipEstado estado={inst.estado_vinculacion} />
                        </td>

                        {/* CONTACTO */}
                        <td className="py-3 px-4 hidden sm:table-cell">
                          <div className="flex flex-col text-[11px] text-slate-500 dark:text-slate-400">
                            {inst.director && (
                              <span className="truncate max-w-[150px]">
                                <FontAwesomeIcon icon={faUser} className="text-slate-400 mr-1 text-[10px]" />
                                {inst.director}
                              </span>
                            )}
                            {inst.telefono && (
                              <span className="font-mono">
                                <FontAwesomeIcon icon={faPhone} className="text-slate-400 mr-1 text-[10px]" />
                                {inst.telefono}
                              </span>
                            )}
                            {!inst.director && !inst.telefono && <span className="text-slate-400">—</span>}
                          </div>
                        </td>

                        {/* GPS */}
                        <td className="py-3 px-4 hidden md:table-cell">
                          {inst.latitude && inst.longitude ? (
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${inst.latitude},${inst.longitude}&travelmode=driving`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
                              title="Abrir en Google Maps"
                            >
                              <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
                              {inst.latitude.toFixed(4)}, {inst.longitude.toFixed(4)}
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                              <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
                              Sin GPS
                            </span>
                          )}
                        </td>

                        {/* ACCIONES */}
                        <td className="py-3 px-4 md:px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inst.latitude && inst.longitude && (
                              <Link
                                href={`/admin/mapa`}
                                className="w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-center transition-colors"
                                title="Ver en Mapa GPON"
                              >
                                <FontAwesomeIcon icon={faMap} className="text-xs" />
                              </Link>
                            )}
                            <button
                              onClick={() => editarEscuela(inst)}
                              className="w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-center transition-colors cursor-pointer"
                              title="Editar escuela"
                            >
                              <FontAwesomeIcon icon={faEdit} className="text-xs" />
                            </button>
                            <button
                              onClick={() => setEscuelaEliminando(inst)}
                              className="w-8 h-8 rounded-lg text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors cursor-pointer"
                              title="Eliminar escuela"
                            >
                              <FontAwesomeIcon icon={faTrash} className="text-xs" />
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
        </main>
      </div>

      {/* ============================================================ */}
      {/* MODAL CREAR / EDITAR ESCUELA */}
      {/* ============================================================ */}
      {modalFormulario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FontAwesomeIcon icon={faSchool} className="text-xs" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {escuelaEditando ? 'Editar Institución Educativa' : 'Nueva Institución Educativa'}
                </h3>
              </div>
              <button
                onClick={() => setModalFormulario(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleGuardarEscuela} className="p-4 md:p-5 overflow-y-auto space-y-4 text-xs">
              {errorForm && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300">
                  {errorForm}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre oficial de la Escuela *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Primaria Lic. Benito Juárez"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Clave CCT
                  </label>
                  <input
                    type="text"
                    value={formCCT}
                    onChange={(e) => setFormCCT(e.target.value)}
                    placeholder="15EPR0123A"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 uppercase font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Domicilio / Localidad / Municipio
                  </label>
                  <input
                    type="text"
                    value={formDomicilio}
                    onChange={(e) => setFormDomicilio(e.target.value)}
                    placeholder="Calle, número, localidad, municipio..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Director / Responsable
                  </label>
                  <input
                    type="text"
                    value={formDirector}
                    onChange={(e) => setFormDirector(e.target.value)}
                    placeholder="Prof. Juan Pérez"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    placeholder="712-123-4567"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    value={formCorreo}
                    onChange={(e) => setFormCorreo(e.target.value)}
                    placeholder="escuela@edomex.gob.mx"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado de Vinculación GPON
                  </label>
                  <select
                    value={formEstadoVinculacion}
                    onChange={(e) => setFormEstadoVinculacion(e.target.value as EstadoVinculacion)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="vinculada">Vinculada (Servicio Activo)</option>
                    <option value="en_proceso">En Proceso (Instalación)</option>
                    <option value="no_vinculada">No Vinculada (Padrón)</option>
                    <option value="rechazada">Rechazada / Cancelada</option>
                  </select>
                </div>
              </div>

              {/* SELECCIÓN EN MAPA */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faLocationDot} className="text-blue-600 text-xs" />
                    Ubicación Satelital / GPS
                  </span>
                  {posicionMapa && (
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      {posicionMapa.lat.toFixed(5)}, {posicionMapa.lng.toFixed(5)}
                    </span>
                  )}
                </div>

                <div className="h-72 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                  <MapaDinamico
                    posicion={posicionMapa}
                    setPosicion={setPosicionMapa}
                    setCoordenadas={(lat, lng) => setPosicionMapa({ lat, lng })}
                    direccion={formDomicilio}
                  />
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Haz clic sobre el mapa para fijar o arrastrar el marcador hacia la institución educativa.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModalFormulario(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm disabled:opacity-60 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {guardando ? 'Guardando...' : escuelaEditando ? 'Guardar Cambios' : 'Registrar Escuela'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {/* ============================================================ */}
      {escuelaEliminando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <FontAwesomeIcon icon={faTrash} className="text-lg" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                ¿Eliminar escuela del padrón?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                ¿Estás seguro de eliminar a{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                  {escuelaEliminando.nombre}
                </strong>
                ? Esta acción eliminará permanentemente la institución del registro general.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEscuelaEliminando(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={guardando}
                onClick={confirmarEliminar}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm disabled:opacity-60 transition-colors cursor-pointer"
              >
                {guardando ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminInstitucionesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] dark:bg-slate-900">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
          </div>
        </div>
      }
    >
      <InstitucionesContent />
    </Suspense>
  )
}