'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faWrench,
  faTicketAlt,
  faCheckCircle,
  faExclamationTriangle,
  faClock,
  faEye,
  faCalendarPlus,
  faBuilding,
  faMapPin,
  faPlus,
  faTimes,
  faCheck,
  faArrowRight,
  faFilter,
  faKey,
  faQrcode,
  faShieldHalved,
} from '@fortawesome/free-solid-svg-icons'
import ModalValidarAccesoTecnico from '@/components/ModalValidarAccesoTecnico'
import type { Ticket, EstadoTicket, Prioridad, TipoTicket } from '@/types'

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'tecnico' | 'escuela'
}

type Institucion = {
  id: number
  nombre: string
  cct: string | null
  domicilio: string | null
}

export default function TecnicoDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [instituciones, setInstituciones] = useState<Record<number, Institucion>>({})
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'resueltos' | 'mis_asignados'>('activos')

  // Modal para actualizar ticket rápido
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null)
  const [nuevoEstado, setNuevoEstado] = useState<EstadoTicket>('en_proceso')
  const [nuevaCuadrilla, setNuevaCuadrilla] = useState('')
  const [nuevoComentario, setNuevoComentario] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [modalValidarAcceso, setModalValidarAcceso] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos(silencioso = false) {
    try {
      if (!silencioso) setLoading(true)
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

      if (!prof || (prof.role !== 'tecnico' && prof.role !== 'admin')) {
        router.push('/login')
        return
      }
      setProfile(prof)

      // Cargar tickets
      const { data: tks, error: errTks } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false })

      if (errTks) throw errTks
      setTickets(tks || [])

      // Cargar nombres de instituciones para enriquecer la vista
      const { data: insts } = await supabase
        .from('instituciones')
        .select('id, nombre, cct, domicilio')

      if (insts) {
        const instMap: Record<number, Institucion> = {}
        for (const inst of insts) {
          instMap[inst.id] = inst
        }
        setInstituciones(instMap)
      }
    } catch (err) {
      console.error('Error cargando panel técnico:', err)
    } finally {
      if (!silencioso) setLoading(false)
    }
  }

  function abrirModalActualizar(t: Ticket) {
    setTicketSeleccionado(t)
    setNuevoEstado(t.estado)
    setNuevaCuadrilla(t.cuadrilla || profile?.full_name || '')
    setNuevoComentario('')
  }

  async function guardarEstadoTicket() {
    if (!ticketSeleccionado) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/ticket/${ticketSeleccionado.id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: nuevoEstado,
          cuadrilla: nuevaCuadrilla,
          comentario: nuevoComentario.trim() || undefined,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al actualizar')

      // Actualizar estado local
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketSeleccionado.id
            ? {
                ...t,
                estado: nuevoEstado,
                cuadrilla: nuevaCuadrilla || null,
                resuelto_en: nuevoEstado === 'resuelto' ? new Date().toISOString() : t.resuelto_en,
              }
            : t
        )
      )
      setTicketSeleccionado(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al guardar estado')
    } finally {
      setGuardando(false)
    }
  }

  // Métricas
  const kpis = useMemo(() => {
    const abiertos = tickets.filter((t) => t.estado === 'abierto').length
    const enRevision = tickets.filter((t) => t.estado === 'en_revision').length
    const enCamino = tickets.filter((t) => t.estado === 'en_camino').length
    const enProceso = tickets.filter((t) => t.estado === 'en_proceso').length
    const programados = tickets.filter((t) => t.estado === 'programado').length
    const resueltos = tickets.filter((t) => t.estado === 'resuelto').length
    const totalActivos = abiertos + enRevision + enCamino + enProceso + programados

    const misAsignados = profile?.full_name
      ? tickets.filter(
          (t) =>
            t.cuadrilla &&
            t.cuadrilla.toLowerCase().includes(profile.full_name!.toLowerCase())
        ).length
      : 0

    return {
      total: tickets.length,
      activos: totalActivos,
      abiertos,
      enProceso: enProceso + enCamino,
      programados,
      resueltos,
      misAsignados,
    }
  }, [tickets, profile])

  // Filtrado
  const ticketsFiltrados = useMemo(() => {
    return tickets.filter((t) => {
      const q = busqueda.trim().toLowerCase()
      const inst = t.institucion_id ? instituciones[t.institucion_id] : null

      const matchBusqueda =
        !q ||
        t.folio.toLowerCase().includes(q) ||
        t.titulo.toLowerCase().includes(q) ||
        (t.cuadrilla && t.cuadrilla.toLowerCase().includes(q)) ||
        (inst && inst.nombre.toLowerCase().includes(q)) ||
        (inst && inst.cct && inst.cct.toLowerCase().includes(q))

      let matchEstado = true
      if (filtroEstado === 'activos') {
        matchEstado = !['resuelto', 'cancelado'].includes(t.estado)
      } else if (filtroEstado === 'resueltos') {
        matchEstado = t.estado === 'resuelto'
      } else if (filtroEstado === 'mis_asignados') {
        matchEstado = Boolean(
          profile?.full_name &&
            t.cuadrilla &&
            t.cuadrilla.toLowerCase().includes(profile.full_name.toLowerCase())
        )
      }

      return matchBusqueda && matchEstado
    })
  }, [tickets, busqueda, filtroEstado, instituciones, profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] dark:bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando panel de técnico...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
      {/* SIDEBAR UNIFICADO */}
      <AdminSidebar
        ticketsAbiertos={kpis.abiertos}
        profile={profile}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        {/* HEADER UNIFICADO */}
        <AdminHeader
          profile={profile}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          searchValue={busqueda}
          onSearchChange={setBusqueda}
          searchPlaceholder="Buscar ticket, CCT o plantel..."
          actionButton={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModalValidarAcceso(true)}
                className="inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] transition-all shadow-sm cursor-pointer"
              >
                <FontAwesomeIcon icon={faKey} className="text-xs" />
                <span>Validar Acceso (Código / QR)</span>
              </button>
              <Link
                href="/admin/tickets"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all shadow-sm"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                <span>Ver todos los tickets</span>
              </Link>
            </div>
          }
        />

        {/* CONTENIDO PRINCIPAL */}
        <main className="p-4 md:p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          {/* BANNER TÉCNICO EN AZUL */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#08296c] via-[#0948a4] to-[#0066cc] text-white p-5 md:p-7 shadow-lg border border-blue-400/30">
            <div className="absolute -right-16 -top-20 w-96 h-96 rounded-full bg-white/10 blur-2xl pointer-events-none"></div>
            <div className="absolute right-32 -bottom-24 w-72 h-72 rounded-full bg-sky-400/20 blur-xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-2xl flex flex-col gap-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-xs self-start">
                    <FontAwesomeIcon icon={faWrench} className="text-xs" />
                    <span>Panel de Operaciones de Campo</span>
                  </div>
                  <h1 className="text-xl md:text-3xl font-bold tracking-tight leading-tight">
                    Hola, {profile?.full_name || 'Técnico de Campo'}
                  </h1>
                  <p className="text-xs md:text-sm text-blue-100/90 leading-relaxed font-normal">
                    Desde aquí puedes gestionar tickets asignados, reportar estado de atención en cuadrilla y cerrar incidencias resueltas con los planteles educativos.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white/10 p-3 rounded-xl border border-white/20 self-start md:self-center">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                    {kpis.activos}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold leading-tight">Tickets Activos</span>
                    <span className="text-[11px] text-blue-100">Requieren atención técnica</span>
                  </div>
                </div>
              </div>

              {/* STATS RÁPIDOS */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/15">
                <div className="flex flex-col">
                  <span className="text-base md:text-lg font-bold tracking-tight">
                    {kpis.abiertos}
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">Sin atender</span>
                </div>
                <div className="flex flex-col sm:border-l sm:border-white/15 sm:pl-4">
                  <span className="text-base md:text-lg font-bold tracking-tight">
                    {kpis.enProceso}
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">En camino / En proceso</span>
                </div>
                <div className="flex flex-col sm:border-l sm:border-white/15 sm:pl-4">
                  <span className="text-base md:text-lg font-bold tracking-tight">
                    {kpis.programados}
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">Programados</span>
                </div>
                <div className="flex flex-col sm:border-l sm:border-white/15 sm:pl-4">
                  <span className="text-base md:text-lg font-bold tracking-tight">
                    {kpis.resueltos}
                  </span>
                  <span className="text-[11px] text-blue-200/80 font-medium">Resueltos</span>
                </div>
              </div>
            </div>
          </div>

          {/* TARJETAS KPI DE OPERACIÓN */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sin atender</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900">
                  Urgente
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight leading-none mb-1">
                  {kpis.abiertos}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Tickets abiertos por asignar
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">En Curso</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                  En ruta
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 tracking-tight leading-none mb-1">
                  {kpis.enProceso}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Cuadrilla en camino / trabajando
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Programados</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900">
                  Agenda
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-600 dark:text-sky-400 tracking-tight leading-none mb-1">
                  {kpis.programados}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Visitas con fecha asignada
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 shadow-sm flex flex-col justify-between gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Resueltos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                  Éxito
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight leading-none mb-1">
                  {kpis.resueltos}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Incidencias concluidas
                </div>
              </div>
            </div>
          </section>

          {/* LISTADO DE TICKETS DE CAMPO */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700 p-4 md:p-6 shadow-sm flex flex-col gap-5">
            {/* ENCABEZADO Y FILTROS */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Tickets de Operación Técnica
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                    {ticketsFiltrados.length} en vista
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Selecciona cualquier ticket para cambiar de estado (En camino, En proceso, Resuelto).
                </p>
              </div>

              {/* TABS DE FILTRO */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setFiltroEstado('activos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filtroEstado === 'activos'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Activos ({kpis.activos})
                </button>
                <button
                  onClick={() => setFiltroEstado('mis_asignados')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filtroEstado === 'mis_asignados'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Mi Cuadrilla ({kpis.misAsignados})
                </button>
                <button
                  onClick={() => setFiltroEstado('resueltos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filtroEstado === 'resueltos'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Resueltos ({kpis.resueltos})
                </button>
                <button
                  onClick={() => setFiltroEstado('todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    filtroEstado === 'todos'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  Todos ({kpis.total})
                </button>
              </div>
            </div>

            {/* TABLA DE TICKETS */}
            {ticketsFiltrados.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-700/20 rounded-xl border border-slate-200/80 dark:border-slate-700">
                <FontAwesomeIcon icon={faCheckCircle} className="text-3xl text-emerald-500 mb-2" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  No hay tickets que coincidan con el filtro
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Todos los tickets en este segmento se encuentran atendidos.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4 font-medium">Folio</th>
                      <th className="py-3 px-4 font-medium">Institución / Plantel</th>
                      <th className="py-3 px-4 font-medium">Problema</th>
                      <th className="py-3 px-4 font-medium">Prioridad</th>
                      <th className="py-3 px-4 font-medium">Cuadrilla Asignada</th>
                      <th className="py-3 px-4 font-medium">Estado</th>
                      <th className="py-3 px-4 font-medium text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700 bg-white dark:bg-slate-800">
                    {ticketsFiltrados.map((t) => {
                      const inst = t.institucion_id ? instituciones[t.institucion_id] : null
                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                            {t.folio}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">
                              {inst?.nombre || 'Plantel no especificado'}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                              {inst?.cct || 'Sin CCT'} · {inst?.domicilio || 'Sin ubicación'}
                            </div>
                          </td>
                          <td className="py-3 px-4 max-w-[240px]">
                            <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                              {t.titulo}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {t.descripcion || 'Sin descripción detallada'}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${
                                t.prioridad === 'critica'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : t.prioridad === 'alta'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-sky-50 text-sky-700 border-sky-200'
                              }`}
                            >
                              {t.prioridad.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {t.cuadrilla ? (
                              <span className="font-medium">{t.cuadrilla}</span>
                            ) : (
                              <span className="text-slate-400 italic">Sin cuadrilla</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                t.estado === 'resuelto'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : t.estado === 'en_proceso'
                                  ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                                  : t.estado === 'en_camino'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : t.estado === 'programado'
                                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  t.estado === 'resuelto'
                                    ? 'bg-emerald-500'
                                    : t.estado === 'en_proceso'
                                    ? 'bg-cyan-500'
                                    : t.estado === 'en_camino'
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              {t.estado.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {t.estado === 'en_proceso' ? (
                                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1.5 shadow-2xs">
                                  <FontAwesomeIcon icon={faCheckCircle} className="text-[10px] text-emerald-600" />
                                  <span className="hidden sm:inline">En Sitio (Atendiendo)</span>
                                </span>
                              ) : t.estado !== 'resuelto' && t.estado !== 'cancelado' ? (
                                <button
                                  onClick={() => setModalValidarAcceso(true)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 transition-all shadow-xs inline-flex items-center gap-1 cursor-pointer"
                                  title="Validar código de acceso al llegar al plantel"
                                >
                                  <FontAwesomeIcon icon={faKey} className="text-[10px]" />
                                  <span className="hidden sm:inline">Validar Entrada</span>
                                </button>
                              ) : null}
                              <button
                                onClick={() => abrirModalActualizar(t)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <FontAwesomeIcon icon={faWrench} className="text-[10px]" />
                                <span>Actualizar</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* MODAL PARA ACTUALIZAR ESTADO */}
      {ticketSeleccionado && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex flex-col">
                <span className="text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {ticketSeleccionado.folio}
                </span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Actualizar Estado de Intervención
                </h3>
              </div>
              <button
                onClick={() => setTicketSeleccionado(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div className="font-semibold text-slate-900 dark:text-white">
                  {ticketSeleccionado.titulo}
                </div>
                <div className="text-slate-500 dark:text-slate-400 mt-1">
                  Plantel: {ticketSeleccionado.institucion_id ? instituciones[ticketSeleccionado.institucion_id]?.nombre : 'No especificado'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nuevo Estado de Atención *
                </label>
                <select
                  value={nuevoEstado}
                  onChange={(e) => setNuevoEstado(e.target.value as EstadoTicket)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en_revision">En revisión</option>
                  <option value="en_camino">En camino (Cuadrilla en trayecto)</option>
                  <option value="en_proceso">En proceso (Trabajando en sitio)</option>
                  <option value="programado">Programado</option>
                  <option value="resuelto">Resuelto (Servicio restablecido)</option>
                  <option value="abierto">Abierto</option>
                  <option value="cancelado">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cuadrilla / Técnico responsable
                </label>
                <input
                  type="text"
                  value={nuevaCuadrilla}
                  onChange={(e) => setNuevaCuadrilla(e.target.value)}
                  placeholder="Ej: Cuadrilla Norte 02 - Téc. Mario"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nota / Bitácora técnica (Opcional)
                </label>
                <textarea
                  value={nuevoComentario}
                  onChange={(e) => setNuevoComentario(e.target.value)}
                  rows={3}
                  placeholder="Ej: Se reemplazó conector SC/APC en roseta y se verificó potencia Rx a -19.4 dBm."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-xl text-xs bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <button
                onClick={() => setTicketSeleccionado(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all cursor-pointer"
                disabled={guardando}
              >
                Cancelar
              </button>
              <button
                onClick={guardarEstadoTicket}
                disabled={guardando}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {guardando ? (
                  <span>Guardando...</span>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="text-xs" />
                    <span>Confirmar Estado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL PARA VALIDAR ACCESO TÉCNICO CON CÓDIGO / QR */}
      {modalValidarAcceso && (
        <ModalValidarAccesoTecnico
          onClose={() => setModalValidarAcceso(false)}
          onValidado={() => {
            cargarDatos(true)
          }}
        />
      )}
    </div>
  )
}

