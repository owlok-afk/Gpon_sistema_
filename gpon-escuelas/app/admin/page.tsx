'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMap,
  faBuilding,
  faFileLines,
  faTicketAlt,
  faUsers,
  faCheckCircle,
  faHourglassHalf,
  faXmarkCircle,
  faInfoCircle,
  faCircleCheck,
  faArrowRight,
  faExclamationTriangle,
  faSun,
  faMoon,
  faSearch,
} from '@fortawesome/free-solid-svg-icons'

// ============================================================
// TIPOS
// ============================================================
type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'tecnico' | 'escuela'
}

type EstadoVinculacion = 'no_vinculada' | 'en_proceso' | 'vinculada' | 'rechazada'

type Institucion = {
  id: number
  nombre: string
  cct: string | null
  domicilio: string | null
  estado_vinculacion: EstadoVinculacion
}

type KPIs = {
  vinculadas: number
  enProceso: number
  noVinculadas: number
  rechazadas: number
  total: number
  solicitudesPendientes: number
  ticketsAbiertos: number
  ticketsEnProceso: number
  ticketsResueltos: number
}

type LocalidadAgrupada = {
  key: string
  nombre: string
  instituciones: Institucion[]
  vinculadas: number
  enProceso: number
  noVinculadas: number
  rechazadas: number
}

// ============================================================
// COLORES POR ESTADO
// ============================================================
const COLOR_ESTADO: Record<EstadoVinculacion, string> = {
  vinculada: 'bg-emerald-500',
  en_proceso: 'bg-amber-500',
  rechazada: 'bg-rose-500',
  no_vinculada: 'bg-slate-400',
}

const COLOR_ESTADO_TEXT: Record<EstadoVinculacion, string> = {
  vinculada: 'text-emerald-600 dark:text-emerald-400',
  en_proceso: 'text-amber-700 dark:text-amber-400',
  rechazada: 'text-rose-600 dark:text-rose-400',
  no_vinculada: 'text-slate-500 dark:text-slate-400',
}

// ============================================================
// HOOK DARK MODE
// ============================================================
function useDarkMode() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('gpon_theme')
    if (saved === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  function toggle() {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('gpon_theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('gpon_theme', 'light')
    }
  }

  return { isDark, toggle }
}

// ============================================================
// HELPERS DE TEXTO
// ============================================================
function claveLocalidad(raw: string | null): string {
  if (!raw || !raw.trim()) return '__sin_domicilio__'
  return raw.trim().toUpperCase()
}

function tituloBonito(raw: string): string {
  return raw
    .toLowerCase()
    .split(' ')
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1) : ''))
    .join(' ')
}

// ============================================================
// PANEL DE LOCALIDADES
// ============================================================
function PanelLocalidades({ instituciones }: { instituciones: Institucion[] }) {
  const router = useRouter()
  const [filtro, setFiltro] = useState('')
  const [orden, setOrden] = useState<'cantidad' | 'alfabetico'>('cantidad')

  const localidades: LocalidadAgrupada[] = useMemo(() => {
    const map: Record<string, Institucion[]> = {}
    for (const inst of instituciones) {
      const key = claveLocalidad(inst.domicilio)
      if (!map[key]) map[key] = []
      map[key].push(inst)
    }

    return Object.entries(map).map(([key, insts]) => ({
      key,
      nombre:
        key === '__sin_domicilio__'
          ? 'Sin ubicación registrada'
          : insts[0]?.domicilio?.trim() || key,
      instituciones: insts,
      vinculadas: insts.filter((i) => i.estado_vinculacion === 'vinculada')
        .length,
      enProceso: insts.filter((i) => i.estado_vinculacion === 'en_proceso')
        .length,
      noVinculadas: insts.filter((i) => i.estado_vinculacion === 'no_vinculada')
        .length,
      rechazadas: insts.filter((i) => i.estado_vinculacion === 'rechazada')
        .length,
    }))
  }, [instituciones])

  const localidadesFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase()
    let arr = localidades
    if (q.length >= 2) {
      arr = arr.filter(
        (l) =>
          l.nombre.toLowerCase().includes(q) ||
          l.instituciones.some((i) => i.nombre.toLowerCase().includes(q))
      )
    }

    if (orden === 'alfabetico') {
      arr = [...arr].sort((a, b) => a.nombre.localeCompare(b.nombre))
    } else {
      arr = [...arr].sort(
        (a, b) => b.instituciones.length - a.instituciones.length
      )
    }

    return arr
  }, [localidades, filtro, orden])

  const totalUbicadas = useMemo(
    () =>
      localidades
        .filter((l) => l.key !== '__sin_domicilio__')
        .reduce((acc, l) => acc + l.instituciones.length, 0),
    [localidades]
  )

  const totalLocalidades = useMemo(
    () => localidades.filter((l) => l.key !== '__sin_domicilio__').length,
    [localidades]
  )

  const conteoPorEstado = useMemo(() => {
    return {
      vinculadas: instituciones.filter(
        (i) => i.estado_vinculacion === 'vinculada'
      ).length,
      enProceso: instituciones.filter(
        (i) => i.estado_vinculacion === 'en_proceso'
      ).length,
      noVinculadas: instituciones.filter(
        (i) => i.estado_vinculacion === 'no_vinculada'
      ).length,
      rechazadas: instituciones.filter(
        (i) => i.estado_vinculacion === 'rechazada'
      ).length,
    }
  }, [instituciones])

  return (
    <div className="flex flex-col gap-4">
      {/* Controles */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
        <div className="relative w-full md:max-w-md">
          <input
            type="search"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar localidad o escuela..."
            className="w-full pl-3.5 pr-10 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-1 focus:ring-slate-400 transition-all"
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
            Ordenar:
          </span>
          <button
            onClick={() => setOrden('cantidad')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              orden === 'cantidad'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Por cantidad
          </button>
          <button
            onClick={() => setOrden('alfabetico')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              orden === 'alfabetico'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            Alfabético
          </button>
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
            Localidades
          </span>
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 font-mono">
            {totalLocalidades}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
          <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
            Vinculadas
          </span>
          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono">
            {conteoPorEstado.vinculadas}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
            No vinculadas
          </span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 font-mono">
            {conteoPorEstado.noVinculadas}
          </span>
        </div>
        <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900">
          <span className="text-[11px] font-medium text-sky-800 dark:text-sky-300">
            Total escuelas
          </span>
          <span className="text-sm font-bold text-sky-700 dark:text-sky-300 font-mono">
            {totalUbicadas}
          </span>
        </div>
      </div>

      {/* Grid de localidades */}
      {localidadesFiltradas.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-700">
          <FontAwesomeIcon
            icon={faSearch}
            className="text-2xl text-slate-300 dark:text-slate-500 mb-2"
          />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Sin resultados
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Ajusta la búsqueda o limpia el filtro
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
          {localidadesFiltradas.map((loc) => {
            const total = loc.instituciones.length
            const pctVinculadas = total > 0 ? (loc.vinculadas / total) * 100 : 0
            const pctNoVinculadas =
              total > 0 ? (loc.noVinculadas / total) * 100 : 0
            const pctEnProceso = total > 0 ? (loc.enProceso / total) * 100 : 0
            const pctRechazadas = total > 0 ? (loc.rechazadas / total) * 100 : 0

            return (
              <button
                key={loc.key}
                onClick={() => {
                  if (loc.key === '__sin_domicilio__') return
                  router.push(
                    `/admin/instituciones?buscar=${encodeURIComponent(
                      loc.nombre
                    )}`
                  )
                }}
                className="group text-left bg-white dark:bg-slate-700/40 rounded-xl border border-slate-200 dark:border-slate-600/60 p-3 hover:border-sky-300 dark:hover:border-sky-500 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate leading-tight group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">
                      {tituloBonito(loc.nombre)}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                      {total} {total === 1 ? 'escuela' : 'escuelas'}
                    </div>
                  </div>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-[10px] text-slate-300 dark:text-slate-500 group-hover:text-sky-500 transition-colors flex-shrink-0 mt-0.5"
                  />
                </div>

                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-600 rounded-full overflow-hidden flex mb-2">
                  {pctVinculadas > 0 && (
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${pctVinculadas}%` }}
                    />
                  )}
                  {pctEnProceso > 0 && (
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${pctEnProceso}%` }}
                    />
                  )}
                  {pctNoVinculadas > 0 && (
                    <div
                      className="h-full bg-slate-400"
                      style={{ width: `${pctNoVinculadas}%` }}
                    />
                  )}
                  {pctRechazadas > 0 && (
                    <div
                      className="h-full bg-rose-500"
                      style={{ width: `${pctRechazadas}%` }}
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {loc.instituciones.slice(0, 24).map((inst) => (
                    <span
                      key={inst.id}
                      className={`w-1.5 h-1.5 rounded-full ${
                        COLOR_ESTADO[inst.estado_vinculacion]
                      }`}
                      title={`${inst.nombre} — ${inst.estado_vinculacion}`}
                    />
                  ))}
                  {loc.instituciones.length > 24 && (
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 leading-none">
                      +{loc.instituciones.length - 24}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-[9px] font-mono">
                  {loc.vinculadas > 0 && (
                    <span className={COLOR_ESTADO_TEXT.vinculada}>
                      ● {loc.vinculadas}
                    </span>
                  )}
                  {loc.noVinculadas > 0 && (
                    <span className={COLOR_ESTADO_TEXT.no_vinculada}>
                      ● {loc.noVinculadas}
                    </span>
                  )}
                  {loc.enProceso > 0 && (
                    <span className={COLOR_ESTADO_TEXT.en_proceso}>
                      ● {loc.enProceso}
                    </span>
                  )}
                  {loc.rechazadas > 0 && (
                    <span className={COLOR_ESTADO_TEXT.rechazada}>
                      ● {loc.rechazadas}
                    </span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================================
// DASHBOARD
// ============================================================
export default function AdminDashboard() {
  const router = useRouter()
  const { isDark, toggle } = useDarkMode()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [kpis, setKpis] = useState<KPIs>({
    vinculadas: 0,
    enProceso: 0,
    noVinculadas: 0,
    rechazadas: 0,
    total: 0,
    solicitudesPendientes: 0,
    ticketsAbiertos: 0,
    ticketsEnProceso: 0,
    ticketsResueltos: 0,
  })
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    cargarTodo()
  }, [])

  async function cargarTodo() {
    try {
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

      const { data: insts, error: errInst } = await supabase
        .from('instituciones')
        .select('id, nombre, cct, domicilio, estado_vinculacion')

      if (errInst) {
        console.error('[dashboard] Error instituciones:', errInst)
      }
      setInstituciones(insts || [])

      const { count: solicitudesPendientes } = await supabase
        .from('solicitudes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')

      const { data: tickets } = await supabase.from('tickets').select('estado')

      const total = insts?.length || 0
      const vinculadas =
        insts?.filter((i) => i.estado_vinculacion === 'vinculada').length || 0
      const enProceso =
        insts?.filter((i) => i.estado_vinculacion === 'en_proceso').length || 0
      const noVinculadas =
        insts?.filter((i) => i.estado_vinculacion === 'no_vinculada').length || 0
      const rechazadas =
        insts?.filter((i) => i.estado_vinculacion === 'rechazada').length || 0

      const ticketsAbiertos =
        tickets?.filter((t) => t.estado === 'abierto').length || 0
      const ticketsEnProceso =
        tickets?.filter((t) =>
          ['en_revision', 'programado', 'en_camino', 'en_proceso'].includes(
            t.estado
          )
        ).length || 0
      const ticketsResueltos =
        tickets?.filter((t) => t.estado === 'resuelto').length || 0

      setKpis({
        vinculadas,
        enProceso,
        noVinculadas,
        rechazadas,
        total,
        solicitudesPendientes: solicitudesPendientes || 0,
        ticketsAbiertos,
        ticketsEnProceso,
        ticketsResueltos,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
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

  const resultadosBusqueda = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    if (q.length < 2) return []
    return instituciones
      .filter(
        (i) =>
          i.nombre.toLowerCase().includes(q) ||
          (i.cct && i.cct.toLowerCase().includes(q)) ||
          (i.domicilio && i.domicilio.toLowerCase().includes(q))
      )
      .slice(0, 6)
  }, [busqueda, instituciones])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] dark:bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Cargando panel...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* SIDEBAR */}
      <AdminSidebar
        solicitudesPendientes={kpis.solicitudesPendientes}
        ticketsAbiertos={kpis.ticketsAbiertos}
        profile={profile}
        isOpenMobile={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* MAIN */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader
          profile={profile}
          onToggleMobileMenu={() => setMobileOpen(true)}
          actionButton={
            <Link
              href="/admin/instituciones?nueva=1"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white active:scale-[0.99] transition-all shadow-sm"
            >
              + Añadir Nueva Escuela
            </Link>
          }
        >
          <div className="relative w-full">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar escuela, CCT o localidad..."
              className="w-full pl-3.5 pr-10 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-1 focus:ring-slate-400 transition-all"
            />
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"
            />

            {resultadosBusqueda.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-80 overflow-y-auto">
                {resultadosBusqueda.map((inst) => (
                  <button
                    key={inst.id}
                    onClick={() => {
                      router.push(
                        `/admin/instituciones?buscar=${encodeURIComponent(
                          inst.cct || inst.nombre
                        )}`
                      )
                      setBusqueda('')
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors"
                  >
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {inst.nombre}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      {inst.cct || 'Sin CCT'} · {inst.domicilio || 'Sin ubicación'}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </AdminHeader>

        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-5 md:p-7 shadow-lg border border-blue-500/30">
            <div className="absolute -right-16 -top-20 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
            <div className="absolute right-32 -bottom-24 w-72 h-72 rounded-full bg-sky-400/20 blur-xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-6">
              <div className="max-w-3xl flex flex-col gap-2.5">
                <h1 className="text-xl md:text-3xl font-bold tracking-tight leading-tight">
                  Bienvenido al Sistema de Gestión
                </h1>
                <p className="text-xs md:text-sm text-blue-100/90 leading-relaxed font-normal">
                  Esta plataforma permite administrar los servicios de
                  conectividad GPON proporcionados por GPON Telecom S.A. de C.V.
                  a instituciones educativas de la zona norte del Estado de
                  México.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/15 max-w-2xl">
                <div className="flex flex-col">
                  <span className="text-base md:text-lg font-bold tracking-tight">
                    Norte Edomex
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">
                    Zona de cobertura
                  </span>
                </div>
                <div className="flex flex-col sm:border-l sm:border-white/15 sm:pl-5">
                  <span className="text-base md:text-lg font-bold tracking-tight">
                    {kpis.total}
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">
                    Instituciones en padrón
                  </span>
                </div>
                <div className="flex flex-col sm:border-l sm:border-white/15 sm:pl-5">
                  <span className="text-base md:text-lg font-bold tracking-tight">
                    {kpis.vinculadas}
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">
                    Con servicio activo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* Card 1 – Total instituciones */}
            <Link
              href="/admin/instituciones"
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-sky-200 dark:hover:border-sky-700 transition-all flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center flex-shrink-0 group-hover:bg-sky-100 dark:group-hover:bg-sky-900/50 transition-colors">
                  <FontAwesomeIcon icon={faBuilding} className="text-sky-600 dark:text-sky-400 text-lg" />
                </div>
                <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900 px-2 py-0.5 rounded-full">
                  Padrón
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {kpis.total}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Total de instituciones
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Vinculadas</span>
                  <span className="font-semibold text-sky-700 dark:text-sky-300">
                    {kpis.total > 0 ? Math.round((kpis.vinculadas / kpis.total) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-700"
                    style={{ width: kpis.total > 0 ? `${(kpis.vinculadas / kpis.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </Link>

            {/* Card 2 – Escuelas vinculadas */}
            <Link
              href="/admin/instituciones?estado=vinculada"
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-emerald-200 dark:hover:border-emerald-700 transition-all flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600 dark:text-emerald-400 text-lg" />
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-2 py-0.5 rounded-full">
                  Activas
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {kpis.vinculadas}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Escuelas con servicio activo
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-slate-500 dark:text-slate-400">En proceso: <strong className="text-slate-700 dark:text-slate-200">{kpis.enProceso}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />
                  <span className="text-slate-500 dark:text-slate-400">Sin vincular: <strong className="text-slate-700 dark:text-slate-200">{kpis.noVinculadas}</strong></span>
                </div>
              </div>
            </Link>

            {/* Card 3 – Solicitudes pendientes */}
            <Link
              href="/admin/solicitudes"
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors">
                  <FontAwesomeIcon icon={faFileLines} className="text-indigo-600 dark:text-indigo-400 text-lg" />
                </div>
                {kpis.solicitudesPendientes > 0 ? (
                  <span className="text-[10px] font-bold text-white bg-indigo-600 dark:bg-indigo-500 px-2 py-0.5 rounded-full animate-pulse">
                    {kpis.solicitudesPendientes} nuevo{kpis.solicitudesPendientes > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-full">
                    Al día
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {kpis.solicitudesPendientes}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Solicitudes por revisar
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
                Ir a solicitudes
                <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
              </div>
            </Link>

            {/* Card 4 – Tickets */}
            <Link
              href="/admin/tickets"
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-amber-200 dark:hover:border-amber-700 transition-all flex flex-col gap-4"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50 transition-colors">
                  <FontAwesomeIcon icon={faTicketAlt} className="text-amber-600 dark:text-amber-400 text-lg" />
                </div>
                {kpis.ticketsAbiertos > 0 ? (
                  <span className="text-[10px] font-bold text-white bg-amber-500 dark:bg-amber-600 px-2 py-0.5 rounded-full">
                    {kpis.ticketsAbiertos} abierto{kpis.ticketsAbiertos > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900 px-2 py-0.5 rounded-full">
                    Resueltos
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
                  {kpis.ticketsAbiertos + kpis.ticketsEnProceso}
                </div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tickets activos en sistema
                </div>
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-slate-500 dark:text-slate-400">Abiertos: <strong className="text-slate-700 dark:text-slate-200">{kpis.ticketsAbiertos}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  <span className="text-slate-500 dark:text-slate-400">Resueltos: <strong className="text-slate-700 dark:text-slate-200">{kpis.ticketsResueltos}</strong></span>
                </div>
              </div>
            </Link>
          </section>

          {/* Estado de vinculación + Tickets */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Panel Vinculación */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Estado de vinculación</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{kpis.total} instituciones en padrón</p>
                </div>
                <Link href="/admin/instituciones" className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  Ver padrón <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                </Link>
              </div>

              {/* Barra stacked */}
              {kpis.total > 0 && (
                <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                  <div className="bg-emerald-500 transition-all duration-700 rounded-l-full" style={{ width: `${(kpis.vinculadas / kpis.total) * 100}%` }} title={`Vinculadas: ${kpis.vinculadas}`} />
                  <div className="bg-amber-400 transition-all duration-700" style={{ width: `${(kpis.enProceso / kpis.total) * 100}%` }} title={`En proceso: ${kpis.enProceso}`} />
                  <div className="bg-slate-200 dark:bg-slate-600 transition-all duration-700" style={{ width: `${(kpis.noVinculadas / kpis.total) * 100}%` }} title={`Sin vincular: ${kpis.noVinculadas}`} />
                  <div className="bg-rose-400 transition-all duration-700 rounded-r-full" style={{ width: `${(kpis.rechazadas / kpis.total) * 100}%` }} title={`Rechazadas: ${kpis.rechazadas}`} />
                </div>
              )}

              <div className="flex flex-col gap-2">
                {[
                  { label: 'Vinculadas', count: kpis.vinculadas, color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', icon: faCheckCircle },
                  { label: 'En proceso', count: kpis.enProceso, color: 'bg-amber-400', text: 'text-amber-700 dark:text-amber-300', icon: faHourglassHalf },
                  { label: 'Sin vincular', count: kpis.noVinculadas, color: 'bg-slate-300 dark:bg-slate-500', text: 'text-slate-600 dark:text-slate-300', icon: faInfoCircle },
                  { label: 'Rechazadas', count: kpis.rechazadas, color: 'bg-rose-400', text: 'text-rose-700 dark:text-rose-300', icon: faXmarkCircle },
                ].map(({ label, count, color, text, icon }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex-1">{label}</span>
                    <div className="flex-1 h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-700`}
                        style={{ width: kpis.total > 0 ? `${(count / kpis.total) * 100}%` : '0%' }} />
                    </div>
                    <span className={`text-xs font-bold w-6 text-right ${text}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel Tickets */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-sm p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-0.5">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Resumen de tickets</h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {kpis.ticketsAbiertos + kpis.ticketsEnProceso + kpis.ticketsResueltos} tickets en total
                  </p>
                </div>
                <Link href="/admin/tickets" className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                  Ver tickets <FontAwesomeIcon icon={faArrowRight} className="text-[9px]" />
                </Link>
              </div>

              {/* Números grandes */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Abiertos', count: kpis.ticketsAbiertos, bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-100 dark:border-amber-900' },
                  { label: 'En proceso', count: kpis.ticketsEnProceso, bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-100 dark:border-sky-900' },
                  { label: 'Resueltos', count: kpis.ticketsResueltos, bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-100 dark:border-emerald-900' },
                ].map(({ label, count, bg, text, border }) => (
                  <div key={label} className={`${bg} border ${border} rounded-xl p-3 flex flex-col items-center gap-0.5`}>
                    <span className={`text-2xl font-extrabold leading-none ${text}`}>{count}</span>
                    <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              {/* Barra de progreso resueltos */}
              {(kpis.ticketsAbiertos + kpis.ticketsEnProceso + kpis.ticketsResueltos) > 0 && (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">Tasa de resolución</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                      {Math.round((kpis.ticketsResueltos / (kpis.ticketsAbiertos + kpis.ticketsEnProceso + kpis.ticketsResueltos)) * 100)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                      style={{ width: `${(kpis.ticketsResueltos / (kpis.ticketsAbiertos + kpis.ticketsEnProceso + kpis.ticketsResueltos)) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* PANEL DE LOCALIDADES */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 shadow-sm p-4 md:p-6 flex flex-col gap-4 md:gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                    Cobertura por Localidad
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                    {kpis.total} escuelas
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                  Localidades donde GPON Telecom tiene presencia registrada.
                </p>
              </div>
              <a
                href="/admin/mapa"
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-sm self-start md:self-auto"
              >
                <FontAwesomeIcon icon={faMap} />
                Abrir mapa completo
              </a>
            </div>

            <PanelLocalidades instituciones={instituciones} />
          </div>
        </main>

        <footer className="mt-auto border-t border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              GPON Telecom S.A. de C.V.
            </span>
            <span>•</span>
            <span>Sistema de Monitoreo Escolar de Banda Ancha</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] mt-2 sm:mt-0">
            <span>Soporte 24/7: 800-4766-NOC</span>
          </div>
        </footer>
      </div>
    </div>
  )
}