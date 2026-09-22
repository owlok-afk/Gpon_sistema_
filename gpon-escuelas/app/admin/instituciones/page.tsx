'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { supabase } from '@/lib/supabase'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPlus,
  faSchool,
  faEdit,
  faTrash,
  faSave,
  faTimes,
  faMapPin,
  faGlobe,
  faInfoCircle,
  faHourglassHalf,
  faCheckCircle,
  faXmarkCircle,
  faDownload,
  faMap,
  faSearch,
} from '@fortawesome/free-solid-svg-icons'

const MapaConArrastre = dynamic(() => import('./MapaDinamico'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-xl border-2 border-slate-300 bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p className="text-xs text-slate-500">Cargando mapa...</p>
      </div>
    </div>
  ),
})

type EstadoVinculacion = 'no_vinculada' | 'en_proceso' | 'vinculada' | 'rechazada'

type Institucion = {
  id: number
  nombre: string
  domicilio: string | null
  director: string | null
  telefono: string | null
  correo: string | null
  matricula: number | null
  cct: string | null
  latitude: number | null
  longitude: number | null
  año_ejecucion: number | null
  presidente_asociacion: string | null
  telefono_asociacion: string | null
  ciclo_escolar: string | null
  zona_escolar: string | null
  turno: string | null
  profile_id: string | null
  estado_vinculacion: EstadoVinculacion
  notas: string | null
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
function ChipEstado({ estado }: { estado: EstadoVinculacion }) {
  const config: Record<
    EstadoVinculacion,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    no_vinculada: {
      label: 'No vinculada',
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      icon: faInfoCircle,
    },
    en_proceso: {
      label: 'En proceso',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
      icon: faHourglassHalf,
    },
    vinculada: {
      label: 'Vinculada',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
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
// FORMULARIO
// ============================================================
function FormularioInstitucion({
  institucion,
  onSave,
  onCancel,
  posicion,
  setPosicion,
  puedeCambiarEstado,
}: {
  institucion: Institucion | null
  onSave: (data: Partial<Institucion>) => void
  onCancel: () => void
  posicion: { lat: number; lng: number } | null
  setPosicion: (pos: { lat: number; lng: number } | null) => void
  puedeCambiarEstado: boolean
}) {
  const [formData, setFormData] = useState<Partial<Institucion>>({
    nombre: '',
    domicilio: '',
    director: '',
    telefono: '',
    correo: '',
    matricula: null,
    cct: '',
    año_ejecucion: 2026,
    presidente_asociacion: '',
    telefono_asociacion: '',
    ciclo_escolar: '',
    zona_escolar: '',
    turno: '',
    estado_vinculacion: 'no_vinculada',
    notas: '',
  })
  const [lat, setLat] = useState<string>('')
  const [lng, setLng] = useState<string>('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (institucion) {
      setFormData({
        nombre: institucion.nombre || '',
        domicilio: institucion.domicilio || '',
        director: institucion.director || '',
        telefono: institucion.telefono || '',
        correo: institucion.correo || '',
        matricula: institucion.matricula ?? null,
        cct: institucion.cct || '',
        año_ejecucion: institucion.año_ejecucion ?? null,
        presidente_asociacion: institucion.presidente_asociacion || '',
        telefono_asociacion: institucion.telefono_asociacion || '',
        ciclo_escolar: institucion.ciclo_escolar || '',
        zona_escolar: institucion.zona_escolar || '',
        turno: institucion.turno || '',
        estado_vinculacion: institucion.estado_vinculacion || 'no_vinculada',
        notas: institucion.notas || '',
      })
      if (institucion.latitude && institucion.longitude) {
        setPosicion({ lat: institucion.latitude, lng: institucion.longitude })
        setLat(institucion.latitude.toString())
        setLng(institucion.longitude.toString())
      } else {
        setPosicion(null)
        setLat('')
        setLng('')
      }
    } else {
      setFormData({
        nombre: '',
        domicilio: '',
        director: '',
        telefono: '',
        correo: '',
        matricula: null,
        cct: '',
        año_ejecucion: 2026,
        presidente_asociacion: '',
        telefono_asociacion: '',
        ciclo_escolar: '',
        zona_escolar: '',
        turno: '',
        estado_vinculacion: 'no_vinculada',
        notas: '',
      })
      setPosicion(null)
      setLat('')
      setLng('')
    }
  }, [institucion, setPosicion])

  function handleCoordenadasChange(newLat: string, newLng: string) {
    setLat(newLat)
    setLng(newLng)
    const latNum = parseFloat(newLat)
    const lngNum = parseFloat(newLng)
    if (!isNaN(latNum) && !isNaN(lngNum)) {
      setPosicion({ lat: latNum, lng: lngNum })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.nombre) {
      alert('El nombre es obligatorio')
      return
    }
    setGuardando(true)
    await onSave({
      ...formData,
      latitude: posicion?.lat ?? null,
      longitude: posicion?.lng ?? null,
    })
    setGuardando(false)
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[95vh] overflow-y-auto">
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <FontAwesomeIcon icon={faSchool} className="text-blue-600" />
          {institucion ? 'Editar institución' : 'Nueva institución'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre de la institución *
            </label>
            <input
              type="text"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">CCT</label>
            <input
              type="text"
              value={formData.cct || ''}
              onChange={(e) => setFormData({ ...formData, cct: e.target.value.toUpperCase() })}
              placeholder="15DST0182J"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Turno</label>
            <select
              value={formData.turno || ''}
              onChange={(e) => setFormData({ ...formData, turno: e.target.value || null })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="">—</option>
              <option value="MATUTINO">Matutino</option>
              <option value="VESPERTINO">Vespertino</option>
              <option value="NOCTURNO">Nocturno</option>
              <option value="MIXTO">Mixto</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Domicilio</label>
            <input
              type="text"
              value={formData.domicilio || ''}
              onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
              placeholder="Ej: San Francisco de la Loma, San Felipe del Progreso"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Director</label>
            <input
              type="text"
              value={formData.director || ''}
              onChange={(e) => setFormData({ ...formData, director: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={formData.telefono || ''}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Correo</label>
            <input
              type="email"
              value={formData.correo || ''}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Matrícula</label>
            <input
              type="number"
              value={formData.matricula ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  matricula: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Año de ejecución
            </label>
            <input
              type="number"
              value={formData.año_ejecucion ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  año_ejecucion: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ciclo escolar
            </label>
            <input
              type="text"
              value={formData.ciclo_escolar || ''}
              onChange={(e) => setFormData({ ...formData, ciclo_escolar: e.target.value })}
              placeholder="2025-2026"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Zona escolar / Municipio
            </label>
            <input
              type="text"
              value={formData.zona_escolar || ''}
              onChange={(e) => setFormData({ ...formData, zona_escolar: e.target.value })}
              placeholder="Ej: San Felipe del Progreso"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Presidente de asociación
            </label>
            <input
              type="text"
              value={formData.presidente_asociacion || ''}
              onChange={(e) =>
                setFormData({ ...formData, presidente_asociacion: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teléfono asociación
            </label>
            <input
              type="text"
              value={formData.telefono_asociacion || ''}
              onChange={(e) =>
                setFormData({ ...formData, telefono_asociacion: e.target.value })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {puedeCambiarEstado && (
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estado de vinculación
              </label>
              <select
                value={formData.estado_vinculacion || 'no_vinculada'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    estado_vinculacion: e.target.value as EstadoVinculacion,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="no_vinculada">No vinculada</option>
                <option value="en_proceso">En proceso</option>
                <option value="vinculada">Vinculada</option>
                <option value="rechazada">Rechazada</option>
              </select>
            </div>
          )}

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Notas</label>
            <textarea
              value={formData.notas || ''}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Ubicación */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-slate-700">
              Ubicación en el mapa
            </label>
          </div>

          <MapaConArrastre
            posicion={posicion}
            setPosicion={setPosicion}
            setCoordenadas={(lat: number, lng: number) => {
              setLat(lat.toString())
              setLng(lng.toString())
            }}
            direccion={formData.domicilio || ''}
            municipio={formData.zona_escolar || ''}
          />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                <FontAwesomeIcon icon={faGlobe} className="text-slate-400 mr-1" />
                Latitud
              </label>
              <input
                type="text"
                value={lat}
                onChange={(e) => handleCoordenadasChange(e.target.value, lng)}
                placeholder="19.666611"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                <FontAwesomeIcon icon={faGlobe} className="text-slate-400 mr-1" />
                Longitud
              </label>
              <input
                type="text"
                value={lng}
                onChange={(e) => handleCoordenadasChange(lat, e.target.value)}
                placeholder="-100.142917"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs font-mono"
              />
            </div>
          </div>

          {posicion && (
            <div className="mt-2 text-[11px] text-emerald-600 flex items-center gap-2">
              <FontAwesomeIcon icon={faMapPin} />
              Ubicación: {posicion.lat.toFixed(6)}, {posicion.lng.toFixed(6)}
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={guardando}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
          >
            <FontAwesomeIcon icon={faSave} />
            {guardando ? 'Guardando...' : institucion ? 'Actualizar' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
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
// PÁGINA PRINCIPAL
// ============================================================
export default function AdminInstituciones() {
  const router = useRouter()
  const [instituciones, setInstituciones] = useState<Institucion[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [seleccionada, setSeleccionada] = useState<Institucion | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [posicion, setPosicion] = useState<{ lat: number; lng: number } | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<EstadoVinculacion | 'todas'>('todas')
  const [pagina, setPagina] = useState(1)
  const porPagina = 10

  useEffect(() => {
    cargarTodo()
  }, [])

  async function cargarTodo() {
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
        .from('instituciones')
        .select('*')
        .order('nombre', { ascending: true })

      if (error) throw error
      setInstituciones(data || [])
    } catch (error) {
      console.error(error)
      alert('Error al cargar las instituciones')
    } finally {
      setLoading(false)
    }
  }

  async function guardar(data: Partial<Institucion>) {
    try {
      if (seleccionada) {
        const { error } = await supabase
          .from('instituciones')
          .update(data)
          .eq('id', seleccionada.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('instituciones').insert([data])
        if (error) throw error
      }
      await cargarTodo()
      cerrarFormulario()
    } catch (error: any) {
      console.error(error)
      alert('Error al guardar: ' + (error.message || 'desconocido'))
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar esta institución? Esta acción no se puede deshacer.')) return
    try {
      const { error } = await supabase.from('instituciones').delete().eq('id', id)
      if (error) throw error
      await cargarTodo()
    } catch (error) {
      console.error(error)
      alert('Error al eliminar')
    }
  }

  function editar(inst: Institucion) {
    setSeleccionada(inst)
    setPosicion(
      inst.latitude && inst.longitude ? { lat: inst.latitude, lng: inst.longitude } : null
    )
    setMostrarFormulario(true)
  }

  function nueva() {
    setSeleccionada(null)
    setPosicion(null)
    setMostrarFormulario(true)
  }

  function cerrarFormulario() {
    setSeleccionada(null)
    setPosicion(null)
    setMostrarFormulario(false)
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

  const puedeCambiarEstado = profile?.role === 'admin' || profile?.role === 'tecnico'

  const filtradas = useMemo(() => {
    return instituciones.filter((i) => {
      const q = busqueda.toLowerCase()
      const coincide =
        i.nombre.toLowerCase().includes(q) ||
        (i.domicilio && i.domicilio.toLowerCase().includes(q)) ||
        (i.cct && i.cct.toLowerCase().includes(q)) ||
        (i.director && i.director.toLowerCase().includes(q))
      const estadoOk = filtroEstado === 'todas' || i.estado_vinculacion === filtroEstado
      return coincide && estadoOk
    })
  }, [instituciones, busqueda, filtroEstado])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const inicio = (paginaActual - 1) * porPagina
  const paginadas = filtradas.slice(inicio, inicio + porPagina)

  useEffect(() => {
    setPagina(1)
  }, [busqueda, filtroEstado])

  const conteos = {
    todas: instituciones.length,
    no_vinculada: instituciones.filter((i) => i.estado_vinculacion === 'no_vinculada').length,
    en_proceso: instituciones.filter((i) => i.estado_vinculacion === 'en_proceso').length,
    vinculada: instituciones.filter((i) => i.estado_vinculacion === 'vinculada').length,
    rechazada: instituciones.filter((i) => i.estado_vinculacion === 'rechazada').length,
  }

  const conUbicacion = instituciones.filter((i) => i.latitude && i.longitude).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-slate-500 text-sm">Cargando instituciones...</p>
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
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-sky-50 text-blue-600 font-semibold border border-sky-100 transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Instituciones
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800">
                  {conteos.todas}
                </span>
              </a>
              <a
                href="/admin/mapa"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <FontAwesomeIcon icon={faMap} className="w-4 h-4 text-slate-400" />
                  Mapa
                </span>
              </a>
              <a
                href="/admin/solicitudes"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Solicitudes
                </span>
              </a>
            </div>

            <div className="flex flex-col gap-1">
              <span className="px-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Soporte
              </span>
              <a
                href="/admin/tickets"
                className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium transition-all"
              >
                <span className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                  Tickets
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
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre, CCT o domicilio..."
                className="w-full pl-3.5 pr-14 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={nueva}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:scale-[0.99] transition-all shadow-sm"
            >
              + Nueva institución
            </button>
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                Instituciones Educativas
              </h1>
              <p className="text-xs md:text-sm text-slate-500">
                Padrón y monitoreo operativo de enlaces GPON en planteles educativos de la Zona Norte del Estado de México.
              </p>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <a
                href="/admin/mapa"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
              >
                <FontAwesomeIcon icon={faMap} className="text-blue-600" />
                Ver Mapa
              </a>
              <button
                onClick={() => alert('Función de exportar lista (pendiente)')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-sm transition-all"
              >
                <FontAwesomeIcon icon={faDownload} className="text-slate-500" />
                Exportar Listado
              </button>
            </div>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total en padrón</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                  Registro
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-1">
                  {conteos.todas}
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                  Planteles registrados
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Vinculadas</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Activas
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700 tracking-tight leading-none mb-1">
                  {conteos.vinculada}
                </div>
                <div className="text-[11px] font-medium text-emerald-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Con cuenta asignada
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">En proceso</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                  Pendientes
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-700 tracking-tight leading-none mb-1">
                  {conteos.en_proceso}
                </div>
                <div className="text-[11px] font-normal text-slate-500">
                  Solicitudes por aprobar
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/70 p-4 shadow-sm flex flex-col justify-between gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Con ubicación</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Georreferenciadas
                </span>
              </div>
              <div>
                <div className="text-2xl font-bold text-indigo-700 tracking-tight leading-none mb-1">
                  {conUbicacion}
                </div>
                <div className="text-[11px] font-normal text-slate-500">
                  de {conteos.todas} en el padrón
                </div>
              </div>
            </div>
          </section>

          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 flex flex-col gap-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 overflow-x-auto select-none pb-1">
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
                <button
                  onClick={() => setFiltroEstado('vinculada')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'vinculada'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  Vinculadas ({conteos.vinculada})
                </button>
                <button
                  onClick={() => setFiltroEstado('en_proceso')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'en_proceso'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  En proceso ({conteos.en_proceso})
                </button>
                <button
                  onClick={() => setFiltroEstado('no_vinculada')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    filtroEstado === 'no_vinculada'
                      ? 'bg-slate-600 text-white'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  No vinculadas ({conteos.no_vinculada})
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
                    <th className="py-3 px-4 font-medium">Nombre de la Institución</th>
                    <th className="py-3 px-4 font-medium">Domicilio</th>
                    <th className="py-3 px-4 font-medium">Contacto</th>
                    <th className="py-3 px-4 font-medium">Estado</th>
                    <th className="py-3 px-4 font-medium">Ubicación</th>
                    <th className="py-3 px-4 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {paginadas.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-sky-800">
                        {inst.cct ? (
                          <span className="bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                            {inst.cct}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-[280px]">
                        <div className="font-semibold text-slate-900 text-xs line-clamp-2">
                          {inst.nombre}
                        </div>
                        {inst.turno && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Turno: {inst.turno}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {inst.domicilio ? (
                          <div className="text-slate-700 line-clamp-2">{inst.domicilio}</div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        {inst.director && (
                          <div className="text-slate-800 font-medium truncate">
                            {inst.director}
                          </div>
                        )}
                        {inst.telefono && (
                          <div className="text-[11px] text-slate-500 font-mono">
                            {inst.telefono}
                          </div>
                        )}
                        {!inst.director && !inst.telefono && (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <ChipEstado estado={inst.estado_vinculacion} />
                      </td>
                      <td className="py-3.5 px-4">
                        {inst.latitude && inst.longitude ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-600">
                            <FontAwesomeIcon icon={faMapPin} className="text-[10px]" />
                            {inst.latitude.toFixed(4)}, {inst.longitude.toFixed(4)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600">Sin ubicación</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => editar(inst)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Editar"
                          >
                            <FontAwesomeIcon icon={faEdit} className="text-xs" />
                          </button>
                          <button
                            onClick={() => eliminar(inst.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Eliminar"
                          >
                            <FontAwesomeIcon icon={faTrash} className="text-xs" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {paginadas.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <FontAwesomeIcon icon={faSchool} className="text-3xl text-slate-300 mb-2" />
                  <p className="text-sm font-medium">
                    {busqueda || filtroEstado !== 'todas'
                      ? 'No se encontraron instituciones con esos filtros'
                      : 'No hay instituciones registradas'}
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
                  de <strong className="text-slate-800">{filtradas.length}</strong> instituciones
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
            <span>v3.4.2-NOC-EDOMEX</span>
            <span>•</span>
            <span>Soporte 24/7: 800-4766-NOC</span>
          </div>
        </footer>
      </div>

      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-3 overflow-y-auto">
          <div className="w-full max-w-3xl my-8">
            <FormularioInstitucion
              institucion={seleccionada}
              onSave={guardar}
              onCancel={cerrarFormulario}
              posicion={posicion}
              setPosicion={setPosicion}
              puedeCambiarEstado={puedeCambiarEstado}
            />
          </div>
        </div>
      )}
    </div>
  )
}