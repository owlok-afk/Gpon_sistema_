'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faMap,
  faTable,
  faLocationDot,
  faRoute,
  faBuilding,
  faCheckCircle,
  faHourglassHalf,
  faXmarkCircle,
  faInfoCircle,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons'

type EstadoVinculacion = 'no_vinculada' | 'en_proceso' | 'vinculada' | 'rechazada'

type Institucion = {
  id: number
  nombre: string
  cct: string | null
  domicilio: string | null
  director: string | null
  telefono: string | null
  estado_vinculacion: EstadoVinculacion
  latitude: number | null
  longitude: number | null
}

type Profile = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'tecnico' | 'escuela'
}

const MapaInstituciones = dynamic(() => import('./MapaInstituciones'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center min-h-[500px]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500">Cargando mapa...</p>
      </div>
    </div>
  ),
})

function ChipEstado({ estado }: { estado: EstadoVinculacion }) {
  const config: Record<EstadoVinculacion, { label: string; bg: string; text: string; border: string; icon: any }> = {
    no_vinculada: { label: 'No vinculada', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: faInfoCircle },
    en_proceso: { label: 'En proceso', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100', icon: faHourglassHalf },
    vinculada: { label: 'Vinculada', bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: faCheckCircle },
    rechazada: { label: 'Rechazada', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-100', icon: faXmarkCircle },
  }
  const c = config[estado]
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${c.bg} ${c.text} ${c.border}`}>
      <FontAwesomeIcon icon={c.icon} className="text-[8px]" />
      {c.label}
    </span>
  )
}

function abrirGoogleMaps(lat: number, lng: number) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    '_blank'
  )
}

export default function AdminMapa() {
  const router = useRouter()
  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoVinculacion | 'todas'>('todas')
  const [seleccionadaId, setSeleccionadaId] = useState<number | null>(null)
  const [detalle, setDetalle] = useState<Institucion | null>(null)

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
        .from('instituciones')
        .select('id, nombre, cct, domicilio, director, telefono, estado_vinculacion, latitude, longitude')
        .order('nombre', { ascending: true })

      if (error) throw error
      setInstituciones(data || [])
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

  const conUbicacion = useMemo(
    () => instituciones.filter((i) => i.latitude != null && i.longitude != null),
    [instituciones]
  )

  const filtradas = useMemo(() => {
    return conUbicacion.filter((i) => {
      const q = busqueda.toLowerCase()
      const coincide =
        i.nombre.toLowerCase().includes(q) ||
        (i.cct && i.cct.toLowerCase().includes(q)) ||
        (i.domicilio && i.domicilio.toLowerCase().includes(q)) ||
        (i.director && i.director.toLowerCase().includes(q))
      const estadoOk = filtroEstado === 'todas' || i.estado_vinculacion === filtroEstado
      return coincide && estadoOk
    })
  }, [conUbicacion, busqueda, filtroEstado])

  const paraMapa = useMemo(
    () =>
      filtradas
        .filter((i): i is Institucion & { latitude: number; longitude: number } =>
          i.latitude != null && i.longitude != null
        )
        .map((i) => ({
          id: i.id,
          nombre: i.nombre,
          cct: i.cct,
          domicilio: i.domicilio,
          director: i.director,
          telefono: i.telefono,
          estado_vinculacion: i.estado_vinculacion,
          latitude: i.latitude,
          longitude: i.longitude,
        })),
    [filtradas]
  )

  const conteos = {
    total: instituciones.length,
    conUbicacion: conUbicacion.length,
    vinculada: conUbicacion.filter((i) => i.estado_vinculacion === 'vinculada').length,
    en_proceso: conUbicacion.filter((i) => i.estado_vinculacion === 'en_proceso').length,
    no_vinculada: conUbicacion.filter((i) => i.estado_vinculacion === 'no_vinculada').length,
    rechazada: conUbicacion.filter((i) => i.estado_vinculacion === 'rechazada').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Cargando mapa...</p>
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
              <a href="/admin" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Panel principal
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Administración
              </span>
              <a href="/admin/instituciones" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Instituciones
              </a>
              <a href="/admin/mapa" className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-sky-50 text-blue-600 font-semibold border border-sky-100 transition-all">
                <FontAwesomeIcon icon={faMap} className="w-4 h-4 text-blue-600" />
                Mapa
              </a>
              <a href="/admin/solicitudes" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Solicitudes
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Soporte
              </span>
              <a href="/admin/tickets" className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
                Tickets
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
                {profile?.full_name || 'Administrador'}
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
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 pl-64 flex flex-col min-h-screen">
        <header className="h-16 px-8 sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href="/admin/instituciones"
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-[10px]" />
              Instituciones
            </a>
            <span className="text-slate-300">/</span>
            <span className="text-xs font-semibold text-slate-800">Mapa</span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="/admin/instituciones"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all"
            >
              <FontAwesomeIcon icon={faTable} className="text-slate-500 text-[10px]" />
              Vista tabla
            </a>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-semibold text-xs text-slate-700">
              {iniciales}
            </div>
          </div>
        </header>

        <main className="p-6 max-w-full w-full flex flex-col gap-5">
          {/* KPIs */}
          <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Total</div>
              <div className="text-xl font-bold text-slate-900">{conteos.total}</div>
              <div className="text-[10px] text-slate-500">En el padrón</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <div className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Ubicadas</div>
              <div className="text-xl font-bold text-sky-700">{conteos.conUbicacion}</div>
              <div className="text-[10px] text-slate-500">Con coordenadas</div>
            </div>
            <div className="bg-white rounded-xl border border-emerald-200 p-3 shadow-sm">
              <div className="text-[10px] font-semibold text-emerald-600 uppercase mb-1">Vinculadas</div>
              <div className="text-xl font-bold text-emerald-700">{conteos.vinculada}</div>
              <div className="text-[10px] text-slate-500">En línea</div>
            </div>
            <div className="bg-white rounded-xl border border-amber-200 p-3 shadow-sm">
              <div className="text-[10px] font-semibold text-amber-600 uppercase mb-1">En proceso</div>
              <div className="text-xl font-bold text-amber-700">{conteos.en_proceso}</div>
              <div className="text-[10px] text-slate-500">Pendientes</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
              <div className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Sin vincular</div>
              <div className="text-xl font-bold text-slate-700">{conteos.no_vinculada}</div>
              <div className="text-[10px] text-slate-500">Sin cuenta</div>
            </div>
            <div className="bg-white rounded-xl border border-rose-200 p-3 shadow-sm">
              <div className="text-[10px] font-semibold text-rose-600 uppercase mb-1">Rechazadas</div>
              <div className="text-xl font-bold text-rose-700">{conteos.rechazada}</div>
              <div className="text-[10px] text-slate-500">Cerradas</div>
            </div>
          </section>

          {/* Layout: panel izquierdo + mapa con alturas fijas */}
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
            {/* Panel izquierdo */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-[500px] lg:h-[calc(100vh-280px)]">
              <div className="p-4 border-b border-slate-100">
                <div className="relative">
                  <FontAwesomeIcon
                    icon={faSearch}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                  />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar por nombre, CCT o domicilio..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:bg-white focus:ring-1 focus:ring-blue-400 transition-all"
                  />
                </div>

                <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1">
                  <button
                    onClick={() => setFiltroEstado('todas')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                      filtroEstado === 'todas'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todas ({conteos.conUbicacion})
                  </button>
                  <button
                    onClick={() => setFiltroEstado('vinculada')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                      filtroEstado === 'vinculada'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    Vinculadas ({conteos.vinculada})
                  </button>
                  <button
                    onClick={() => setFiltroEstado('en_proceso')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                      filtroEstado === 'en_proceso'
                        ? 'bg-amber-600 text-white'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                    }`}
                  >
                    En proceso ({conteos.en_proceso})
                  </button>
                  <button
                    onClick={() => setFiltroEstado('no_vinculada')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-all ${
                      filtroEstado === 'no_vinculada'
                        ? 'bg-slate-600 text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Sin vinc. ({conteos.no_vinculada})
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {paraMapa.length === 0 ? (
                  <div className="text-center py-12 px-4 text-slate-500">
                    <FontAwesomeIcon icon={faLocationDot} className="text-3xl text-slate-300 mb-2" />
                    <p className="text-xs font-medium">Sin instituciones ubicadas</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Ve a Instituciones → Editar → y arrastra el marcador para ubicar.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {paraMapa.map((i) => (
                      <button
                        key={i.id}
                        onClick={() => setSeleccionadaId(i.id)}
                        className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${
                          seleccionadaId === i.id ? 'bg-sky-50 border-l-2 border-sky-500' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-semibold text-slate-900 leading-snug line-clamp-2">
                              {i.nombre}
                            </div>
                            {i.cct && (
                              <div className="text-[10px] font-mono text-sky-700 mt-0.5">
                                {i.cct}
                              </div>
                            )}
                            {i.domicilio && (
                              <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                <FontAwesomeIcon icon={faLocationDot} className="mr-1 text-[9px]" />
                                {i.domicilio}
                              </div>
                            )}
                            <div className="mt-1.5">
                              <ChipEstado estado={i.estado_vinculacion} />
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3 border-t border-slate-100 text-[10px] text-slate-500 font-mono">
                {paraMapa.length} de {conteos.conUbicacion} ubicadas
              </div>
            </div>

            {/* Mapa — altura fija */}
            <div className="h-[500px] lg:h-[calc(100vh-280px)] rounded-2xl overflow-hidden border border-slate-200 bg-white">
              <MapaInstituciones
                instituciones={paraMapa}
                seleccionadaId={seleccionadaId}
                onSelectDetalle={(inst) => {
                  setDetalle({
                    id: inst.id,
                    nombre: inst.nombre,
                    cct: inst.cct,
                    domicilio: inst.domicilio,
                    director: inst.director,
                    telefono: inst.telefono,
                    estado_vinculacion: inst.estado_vinculacion,
                    latitude: inst.latitude,
                    longitude: inst.longitude,
                  })
                }}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Modal detalle */}
      {detalle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-3 overflow-y-auto">
          <div className="w-full max-w-md my-8 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faBuilding} className="text-blue-600" />
                Detalle del plantel
              </h2>
              <button
                onClick={() => setDetalle(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <div className="text-sm font-bold text-slate-900 leading-snug mb-1">
                  {detalle.nombre}
                </div>
                {detalle.cct && (
                  <div className="font-mono text-[11px] text-sky-800 bg-sky-50 border border-sky-100 inline-block px-2 py-0.5 rounded-md mb-2">
                    {detalle.cct}
                  </div>
                )}
                <div className="mt-1">
                  <ChipEstado estado={detalle.estado_vinculacion} />
                </div>
              </div>

              <div className="space-y-2 text-xs">
                {detalle.domicilio && (
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon icon={faLocationDot} className="text-slate-400 mt-0.5" />
                    <span className="text-slate-700">{detalle.domicilio}</span>
                  </div>
                )}
                {detalle.director && (
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 w-4">👤</span>
                    <span className="text-slate-700">{detalle.director}</span>
                  </div>
                )}
                {detalle.telefono && (
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 w-4">📞</span>
                    <span className="text-slate-700 font-mono">{detalle.telefono}</span>
                  </div>
                )}
                {detalle.latitude && detalle.longitude && (
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon icon={faMap} className="text-slate-400 mt-0.5" />
                    <span className="text-slate-700 font-mono text-[11px]">
                      {detalle.latitude.toFixed(6)}, {detalle.longitude.toFixed(6)}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2">
                {detalle.latitude && detalle.longitude && (
                  <button
                    onClick={() => abrirGoogleMaps(detalle.latitude!, detalle.longitude!)}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-xs font-semibold flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faRoute} className="text-xs" />
                    Cómo llegar
                  </button>
                )}
                <a
                  href="/admin/instituciones"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-xs font-semibold text-center"
                >
                  Editar en tabla
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}