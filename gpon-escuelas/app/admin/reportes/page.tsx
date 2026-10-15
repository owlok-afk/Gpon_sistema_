'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'
import ReporteUsoImpresionModal, { ReporteUsoCompleto } from '@/components/ReporteUsoImpresionModal'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faFileAlt,
  faPrint,
  faCheckCircle,
  faBuilding,
  faGraduationCap,
  faSearch,
  faFilter,
  faEye,
  faRotate,
  faCalendarAlt,
  faCamera,
} from '@fortawesome/free-solid-svg-icons'

export default function AdminReportesPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [reportes, setReportes] = useState<ReporteUsoCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCiclo, setFiltroCiclo] = useState<string>('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('todos')
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteUsoCompleto | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [actualizandoId, setActualizandoId] = useState<number | null>(null)

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

      const res = await fetch('/api/reportes-uso')
      const json = await res.json()
      if (res.ok && json.reportes) {
        setReportes(json.reportes)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function marcarRevisado(id: number) {
    try {
      setActualizandoId(id)
      const res = await fetch(`/api/reportes-uso/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'revisado' }),
      })
      if (res.ok) {
        setReportes((prev) =>
          prev.map((r) => (r.id === id ? { ...r, estado: 'revisado' } : r))
        )
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActualizandoId(null)
    }
  }

  const filtrados = useMemo(() => {
    return reportes.filter((r) => {
      const q = busqueda.toLowerCase().trim()
      const matchTexto =
        !q ||
        r.responsable_nombre.toLowerCase().includes(q) ||
        r.ciclo_escolar.toLowerCase().includes(q) ||
        (r.institucion?.nombre && r.institucion.nombre.toLowerCase().includes(q)) ||
        (r.institucion?.cct && r.institucion.cct.toLowerCase().includes(q))

      const matchCiclo = filtroCiclo === 'todos' || r.ciclo_escolar === filtroCiclo
      const matchPeriodo =
        filtroPeriodo === 'todos' ||
        (filtroPeriodo === 'semestre_1' && r.periodo.includes('Semestre 1')) ||
        (filtroPeriodo === 'semestre_2' && r.periodo.includes('Semestre 2'))

      return matchTexto && matchCiclo && matchPeriodo
    })
  }, [reportes, busqueda, filtroCiclo, filtroPeriodo])

  const ciclosDisponibles = Array.from(new Set(reportes.map((r) => r.ciclo_escolar)))

  const conteos = {
    total: reportes.length,
    semestre1: reportes.filter((r) => r.periodo.includes('Semestre 1')).length,
    semestre2: reportes.filter((r) => r.periodo.includes('Semestre 2')).length,
    excelente: reportes.filter((r) => r.calidad_servicio === 'excelente' || r.calidad_servicio === 'buena').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc] dark:bg-slate-900">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando reportes semestrales...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex font-sans text-slate-800 dark:text-slate-100 bg-[#f8fafc] dark:bg-slate-900 antialiased selection:bg-sky-100 selection:text-sky-900">
      <AdminSidebar
        profile={profile}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen w-full">
        <AdminHeader
          profile={profile}
          onToggleMobileMenu={() => setMobileMenuOpen(true)}
          searchPlaceholder="Buscar por escuela, CCT o responsable..."
          searchValue={busqueda}
          onSearchChange={setBusqueda}
          actionButton={
            <button
              onClick={cargar}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all shadow-xs"
              title="Refrescar lista"
            >
              <FontAwesomeIcon icon={faRotate} className="text-xs" />
              <span>Actualizar</span>
            </button>
          }
        />

        <main className="p-8 max-w-7xl w-full mx-auto flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  Reportes Semestrales de Uso de Internet
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  2 veces al año
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Monitoreo semestral del aprovechamiento de banda ancha GPON, terminales activas y satisfacción en los planteles educativos.
              </p>
            </div>
          </div>

          {/* KPIs */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Recibidos</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
                  Cédulas
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-1">
                  {conteos.total}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Reportes registrados en el sistema
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Semestre 1 (Ago - Ene)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-800">
                  1er Semestre
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-sky-700 dark:text-sky-400 tracking-tight leading-none mb-1">
                  {conteos.semestre1}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Evaluaciones de otoño-invierno
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Semestre 2 (Feb - Jul)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                  2do Semestre
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 tracking-tight leading-none mb-1">
                  {conteos.semestre2}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Evaluaciones de primavera-verano
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Satisfacción Óptima</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800">
                  Buena / Excelente
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tracking-tight leading-none mb-1">
                  {conteos.total > 0 ? `${Math.round((conteos.excelente / conteos.total) * 100)}%` : '100%'}
                </div>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Percepción positiva de velocidad GPON
                </div>
              </div>
            </div>
          </section>

          {/* Tabla de reportes */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 shadow-sm p-6 flex flex-col gap-5">
            {/* Filtros */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <div className="flex items-center gap-2 overflow-x-auto select-none pb-1">
                <button
                  onClick={() => setFiltroPeriodo('todos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroPeriodo === 'todos'
                      ? 'bg-slate-900 dark:bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  Todos los periodos ({conteos.total})
                </button>
                <button
                  onClick={() => setFiltroPeriodo('semestre_1')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroPeriodo === 'semestre_1'
                      ? 'bg-sky-600 text-white'
                      : 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40'
                  }`}
                >
                  Semestre 1: Ago – Ene ({conteos.semestre1})
                </button>
                <button
                  onClick={() => setFiltroPeriodo('semestre_2')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroPeriodo === 'semestre_2'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                  }`}
                >
                  Semestre 2: Feb – Jul ({conteos.semestre2})
                </button>
              </div>

              {ciclosDisponibles.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Ciclo:</span>
                  <select
                    value={filtroCiclo}
                    onChange={(e) => setFiltroCiclo(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="todos">Todos los ciclos</option>
                    {ciclosDisponibles.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-700 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4 font-medium">Folio</th>
                    <th className="py-3 px-4 font-medium">Institución / CCT</th>
                    <th className="py-3 px-4 font-medium">Ciclo / Periodo</th>
                    <th className="py-3 px-4 font-medium">Reporte Escrito</th>
                    <th className="py-3 px-4 font-medium">Evidencias</th>
                    <th className="py-3 px-4 font-medium">Calidad GPON</th>
                    <th className="py-3 px-4 font-medium">Responsable</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-slate-700 dark:text-slate-200">
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        <FontAwesomeIcon icon={faFileAlt} className="text-3xl mb-2 text-slate-300 dark:text-slate-600" />
                        <p className="text-xs font-medium">No se encontraron reportes semestrales con estos filtros.</p>
                      </td>
                    </tr>
                  ) : (
                    filtrados.map((r) => {
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-900 dark:text-blue-400 whitespace-nowrap">
                            REP-{r.id.toString().padStart(5, '0')}
                          </td>
                          <td className="py-3.5 px-4 max-w-[220px]">
                            <div className="font-semibold text-slate-900 dark:text-white truncate">
                              {r.institucion?.nombre || 'Escuela registrada'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              CCT: {r.institucion?.cct || 'S/N'} • {r.institucion?.turno || 'Matutino'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{r.ciclo_escolar}</div>
                            <span className="text-[10px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded border border-sky-100 dark:border-sky-800">
                              {r.periodo}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-[240px]">
                            <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                              {r.reporte_texto || 'Sin redacción'}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {r.fotos && r.fotos.length > 0 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                                <FontAwesomeIcon icon={faCamera} className="text-[10px]" />
                                <span>{r.fotos.length} foto{r.fotos.length > 1 ? 's' : ''}</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400">Sin fotos</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`capitalize font-semibold text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                r.calidad_servicio === 'excelente'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : r.calidad_servicio === 'buena'
                                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                                  : r.calidad_servicio === 'regular'
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                              }`}
                            >
                              {r.calidad_servicio}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 max-w-[180px]">
                            <div className="font-medium text-slate-800 dark:text-slate-200 truncate">{r.responsable_nombre}</div>
                            <div className="text-[10px] text-slate-400 truncate">{r.responsable_cargo}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                r.estado === 'revisado'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {r.estado === 'revisado' ? 'Revisado' : 'Por revisar'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setReporteSeleccionado(r)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 transition-all flex items-center gap-1.5"
                                title="Ver e imprimir cédula oficial"
                              >
                                <FontAwesomeIcon icon={faPrint} className="text-[10px]" />
                                Imprimir
                              </button>
                              {r.estado !== 'revisado' && (
                                <button
                                  onClick={() => marcarRevisado(r.id)}
                                  disabled={actualizandoId === r.id}
                                  className="px-2 py-1 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all"
                                  title="Marcar como revisado por NOC"
                                >
                                  {actualizandoId === r.id ? '...' : 'Aprobar'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {reporteSeleccionado && (
        <ReporteUsoImpresionModal
          reporte={reporteSeleccionado}
          onClose={() => setReporteSeleccionado(null)}
        />
      )}
    </div>
  )
}

