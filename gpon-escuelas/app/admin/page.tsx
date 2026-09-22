'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
} from '@fortawesome/free-solid-svg-icons'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'tecnico' | 'escuela'
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

export default function AdminDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
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

  useEffect(() => {
    cargarTodo()
  }, [])

  async function cargarTodo() {
    try {
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

      // Instituciones
      const { data: insts } = await supabase
        .from('instituciones')
        .select('estado_vinculacion')

      // Solicitudes pendientes
      const { count: solicitudesPendientes } = await supabase
        .from('solicitudes')
        .select('*', { count: 'exact', head: true })
        .eq('estado', 'pendiente')

      // Tickets
      const { data: tickets } = await supabase
        .from('tickets')
        .select('estado')

      const total = insts?.length || 0
      const vinculadas = insts?.filter((i) => i.estado_vinculacion === 'vinculada').length || 0
      const enProceso = insts?.filter((i) => i.estado_vinculacion === 'en_proceso').length || 0
      const noVinculadas = insts?.filter((i) => i.estado_vinculacion === 'no_vinculada').length || 0
      const rechazadas = insts?.filter((i) => i.estado_vinculacion === 'rechazada').length || 0

      const ticketsAbiertos = tickets?.filter((t) => t.estado === 'abierto').length || 0
      const ticketsEnProceso = tickets?.filter((t) =>
        ['en_revision', 'programado', 'en_camino', 'en_proceso'].includes(t.estado)
      ).length || 0
      const ticketsResueltos = tickets?.filter((t) => t.estado === 'resuelto').length || 0

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Cargando panel...</p>
        </div>
      </div>
    )
  }

  const iniciales = (profile?.full_name || profile?.email || 'AD')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="min-h-screen flex font-sans text-slate-800 bg-[#f8fafc] antialiased selection:bg-sky-100 selection:text-sky-900">

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
              <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">GPON Telecom</span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">S.A. DE C.V.</span>
            </div>
          </div>

          <nav className="flex flex-col gap-5 px-3.5 py-4 text-xs">
            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">General</span>
              <a href="/admin" className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-50 text-blue-600 font-semibold border border-sky-100 transition-all">
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  Panel principal
                </span>
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Administración</span>
              <a href="/admin/instituciones" className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faBuilding} className="w-4 h-4 text-slate-400" />
                  Instituciones
                </span>
              </a>
              <a href="/admin/mapa" className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faMap} className="w-4 h-4 text-slate-400" />
                  Mapa
                </span>
              </a>
              <a href="/admin/solicitudes" className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faFileLines} className="w-4 h-4 text-slate-400" />
                  Solicitudes
                </span>
                {kpis.solicitudesPendientes > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                    {kpis.solicitudesPendientes}
                  </span>
                )}
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Soporte</span>
              <a href="/admin/tickets" className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faTicketAlt} className="w-4 h-4 text-slate-400" />
                  Tickets
                </span>
                {kpis.ticketsAbiertos > 0 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                    {kpis.ticketsAbiertos}
                  </span>
                )}
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Sistema</span>
              <a href="#usuarios" className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-slate-400" />
                  Usuarios
                </span>
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
                placeholder="Buscar escuela, CCT o municipio..."
                className="w-full pl-3.5 pr-14 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-sm">⌘K</kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/admin/instituciones"
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition-all shadow-sm"
            >
              + Añadir Nueva Escuela
            </a>
            <div className="h-5 w-px bg-slate-200 mx-1"></div>
            <div className="flex items-center gap-2.5 pl-1">
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
          </div>
        </header>

        <main className="p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">

          {/* Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-7 shadow-lg border border-blue-500/30">
            <div className="absolute -right-16 -top-20 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
            <div className="absolute right-32 -bottom-24 w-72 h-72 rounded-full bg-sky-400/20 blur-xl pointer-events-none"></div>
            <svg className="absolute right-0 top-0 h-full w-1/2 opacity-15 pointer-events-none" viewBox="0 0 400 200" fill="none" preserveAspectRatio="none">
              <path d="M0 0 C 150 80, 250 20, 400 120 L 400 0 Z" fill="white" />
              <path d="M50 200 C 180 120, 280 180, 400 60 L 400 200 Z" fill="white" />
            </svg>

            <div className="relative z-10 flex flex-col gap-6">
              <div className="max-w-3xl flex flex-col gap-2.5">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-tight">
                  Bienvenido al Sistema de Gestión
                </h1>
                <p className="text-xs md:text-sm text-blue-100/90 leading-relaxed font-normal">
                  Esta plataforma permite administrar los servicios de conectividad GPON proporcionados por GPON Telecom S.A. de C.V. a instituciones educativas de la zona norte del Estado de México.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-white/15 max-w-2xl">
                <div className="flex flex-col">
                  <span className="text-base md:text-lg font-bold text-white tracking-tight">Norte Edomex</span>
                  <span className="text-[11px] text-blue-200/80 font-medium">Zona de cobertura</span>
                </div>
                <div className="flex flex-col sm:border-l sm:border-white/15 sm:pl-5">
                  <span className="text-base md:text-lg font-bold text-white tracking-tight">{kpis.total}</span>
                  <span className="text-[11px] text-blue-200/80 font-medium">Instituciones en padrón</span>
                </div>
                <div className="flex flex-col sm:border-l sm:border-white/15 sm:pl-5">
                  <span className="text-base md:text-lg font-bold text-white tracking-tight">{kpis.vinculadas}</span>
                  <span className="text-[11px] text-blue-200/80 font-medium">Con servicio activo</span>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs principales */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm hover:border-sky-200 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Escuelas Vinculadas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">Total</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                  {kpis.vinculadas}
                </div>
                <div className="text-[11px] font-medium text-sky-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                  de {kpis.total} registradas
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Solicitudes pendientes</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">Por revisar</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-700 tracking-tight leading-none mb-1">
                  {kpis.solicitudesPendientes}
                </div>
                <a href="/admin/solicitudes" className="text-[11px] font-medium text-indigo-700 hover:underline flex items-center gap-1">
                  Ir a solicitudes <FontAwesomeIcon icon={faArrowRight} className="text-[8px]" />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm hover:border-amber-200 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Tickets abiertos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">Activos</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700 tracking-tight leading-none mb-1">
                  {kpis.ticketsAbiertos}
                </div>
                <a href="/admin/tickets" className="text-[11px] font-medium text-amber-700 hover:underline flex items-center gap-1">
                  Ver tickets <FontAwesomeIcon icon={faArrowRight} className="text-[8px]" />
                </a>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Instituciones</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">Registro</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700 tracking-tight leading-none mb-1">
                  {kpis.total}
                </div>
                <a href="/admin/instituciones" className="text-[11px] font-medium text-emerald-700 hover:underline flex items-center gap-1">
                  Ver padrón <FontAwesomeIcon icon={faArrowRight} className="text-[8px]" />
                </a>
              </div>
            </div>
          </section>

          {/* Fila: Estado de padrón + Tickets */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Estado de vinculación */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Estado de vinculación</h2>
                <a href="/admin/instituciones" className="text-xs font-medium text-blue-600 hover:underline">
                  Ver padrón →
                </a>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faCheckCircle} className="text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">Vinculadas</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-700">{kpis.vinculadas}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faHourglassHalf} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">En proceso</span>
                  </div>
                  <span className="text-lg font-bold text-amber-700">{kpis.enProceso}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faInfoCircle} className="text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">No vinculadas</span>
                  </div>
                  <span className="text-lg font-bold text-slate-700">{kpis.noVinculadas}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faXmarkCircle} className="text-rose-600" />
                    <span className="text-sm font-medium text-rose-900">Rechazadas</span>
                  </div>
                  <span className="text-lg font-bold text-rose-700">{kpis.rechazadas}</span>
                </div>
              </div>
            </div>

            {/* Resumen de tickets */}
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-slate-900">Resumen de tickets</h2>
                <a href="/admin/tickets" className="text-xs font-medium text-blue-600 hover:underline">
                  Ver tickets →
                </a>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">Abiertos</span>
                  </div>
                  <span className="text-lg font-bold text-amber-700">{kpis.ticketsAbiertos}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 border border-sky-100">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faHourglassHalf} className="text-sky-600" />
                    <span className="text-sm font-medium text-sky-900">En proceso</span>
                  </div>
                  <span className="text-lg font-bold text-sky-700">{kpis.ticketsEnProceso}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">Resueltos</span>
                  </div>
                  <span className="text-lg font-bold text-emerald-700">{kpis.ticketsResueltos}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Mapa */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex flex-col gap-1">
                <h2 className="text-base md:text-lg font-bold text-slate-900 tracking-tight">
                  Cobertura GPON — Región Noroeste EDOMEX
                </h2>
                <p className="text-xs text-slate-500 font-normal">
                  Visualiza la ubicación geográfica de todas las instituciones educativas en el mapa interactivo.
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

            <div className="relative w-full rounded-2xl bg-gradient-to-br from-sky-50 to-emerald-50 border border-slate-200/80 overflow-hidden min-h-[300px] flex items-center justify-center p-8">
              <svg className="absolute inset-0 w-full h-full stroke-slate-200/60 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern height="40" id="grid-pattern" patternUnits="userSpaceOnUse" width="40">
                    <path d="M 40 0 L 0 0 0 40" fill="none" strokeDasharray="2 4" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect fill="url(#grid-pattern)" height="100%" width="100%" />
              </svg>

              <div className="relative z-10 text-center max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-blue-100 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                  <FontAwesomeIcon icon={faMap} className="text-2xl text-blue-600" />
                </div>
                <p className="text-sm font-semibold text-slate-800 mb-1">
                  Mapa interactivo de instituciones
                </p>
                <p className="text-xs text-slate-500 mb-4">
                  Consulta la ubicación, estado de vinculación y cómo llegar a cada plantel.
                </p>
                <a
                  href="/admin/mapa"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all"
                >
                  <FontAwesomeIcon icon={faMap} className="text-xs" />
                  Ver mapa
                </a>
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
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400 mt-2 sm:mt-0">
            <span>Soporte 24/7: 800-4766-NOC</span>
          </div>
        </footer>
      </div>
    </div>
  )
}