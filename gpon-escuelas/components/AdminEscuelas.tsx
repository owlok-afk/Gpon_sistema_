'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, Popup } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '@/lib/supabase'

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPlus, 
  faMinus, 
  faCrosshairs, 
  faLocationDot, 
  faSearch, 
  faXmark, 
  faEdit, 
  faTrash, 
  faSave, 
  faTimes, 
  faSchool,
  faUser,
  faPhone,
  faEnvelope,
  faInfoCircle,
  faExclamationTriangle,
  faHome
} from '@fortawesome/free-solid-svg-icons'

// Fix para los iconos de Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

type Escuela = {
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
  created_at: string
}

// ====================== COMPONENTE DE SELECCIÓN DE UBICACIÓN ======================

function SelectorUbicacion({ 
  posicion, 
  setPosicion, 
  modoEdicion 
}: { 
  posicion: { lat: number; lng: number } | null
  setPosicion: (pos: { lat: number; lng: number } | null) => void
  modoEdicion: boolean
}) {
  const mapRef = useRef<L.Map | null>(null)
  const [center, setCenter] = useState<LatLngExpression>([19.95, -99.65])

  useEffect(() => {
    if (posicion) {
      setCenter([posicion.lat, posicion.lng])
      if (mapRef.current) {
        mapRef.current.setView([posicion.lat, posicion.lng], 15)
      }
    }
  }, [posicion])

  function handleMapClick(e: L.LeafletMouseEvent) {
    if (modoEdicion) {
      const { lat, lng } = e.latlng
      setPosicion({ lat, lng })
    }
  }

  return (
    <div className="relative w-full h-[350px] rounded-xl overflow-hidden border border-gray-300">
      <MapContainer
        center={center}
        zoom={posicion ? 15 : 10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        ref={mapRef}
        className="z-0"
        whenReady={() => {
          if (mapRef.current) {
            mapRef.current.on('click', handleMapClick)
          }
        }}
      >
        {/* Capa satelital con etiquetas integradas */}
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
        
        {/* Capa de nombres de calles y lugares - MÁS NÍTIDA */}
        <TileLayer
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
          className="opacity-90"
        />

        {posicion && (
          <Marker position={[posicion.lat, posicion.lng]}>
            <Popup>
              <div className="text-sm font-medium">
                📍 Ubicación seleccionada
                <br />
                <span className="text-xs text-gray-500">
                  {posicion.lat.toFixed(6)}, {posicion.lng.toFixed(6)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Controles de zoom simples */}
        <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="bg-white w-9 h-9 rounded-full shadow-md hover:bg-gray-50 flex items-center justify-center border border-gray-200 text-lg font-bold"
          >
            +
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="bg-white w-9 h-9 rounded-full shadow-md hover:bg-gray-50 flex items-center justify-center border border-gray-200 text-lg font-bold"
          >
            −
          </button>
          <button
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.setView([19.95, -99.65], 10)
              }
            }}
            className="bg-blue-600 w-9 h-9 rounded-full shadow-md hover:bg-blue-700 flex items-center justify-center text-white border border-blue-700"
          >
            <FontAwesomeIcon icon={faHome} className="text-xs" />
          </button>
        </div>

        {/* Mensaje de ayuda */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow text-xs text-gray-600">
          {modoEdicion ? (
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCrosshairs} className="text-blue-500 text-xs" />
              Haz clic en el mapa para seleccionar ubicación
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-gray-400">
              <FontAwesomeIcon icon={faInfoCircle} className="text-xs" />
              Activa edición para seleccionar ubicación
            </span>
          )}
        </div>
      </MapContainer>
    </div>
  )
}

// ====================== COMPONENTE FORMULARIO (CORREGIDO) ======================

function FormularioEscuela({ 
  escuela, 
  onSave, 
  onCancel,
  posicion,
  setPosicion,
  modoEdicion,
  setModoEdicion
}: {
  escuela: Escuela | null
  onSave: (data: Partial<Escuela>) => void
  onCancel: () => void
  posicion: { lat: number; lng: number } | null
  setPosicion: (pos: { lat: number; lng: number } | null) => void
  modoEdicion: boolean
  setModoEdicion: (modo: boolean) => void
}) {
  const [formData, setFormData] = useState<Partial<Escuela>>({
    nombre: '',
    domicilio: '',
    director: '',
    telefono: '',
    correo: '',
    matricula: null,
    cct: '',
  })

  useEffect(() => {
    if (escuela) {
      setFormData({
        nombre: escuela.nombre || '',
        domicilio: escuela.domicilio || '',
        director: escuela.director || '',
        telefono: escuela.telefono || '',
        correo: escuela.correo || '',
        matricula: escuela.matricula || null,
        cct: escuela.cct || '',
      })
      if (escuela.latitude && escuela.longitude) {
        setPosicion({ lat: escuela.latitude, lng: escuela.longitude })
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
      })
    }
  }, [escuela, setPosicion])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.nombre) {
      alert('El nombre es obligatorio')
      return
    }

    if (!posicion) {
      alert('Debes seleccionar una ubicación en el mapa')
      return
    }

    onSave({
      ...formData,
      latitude: posicion.lat,
      longitude: posicion.lng,
    })
  }

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden max-h-[90vh] overflow-y-auto">
      <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between sticky top-0 bg-gray-50 z-10">
        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FontAwesomeIcon icon={faSchool} className="text-blue-600" />
          {escuela ? 'Editar escuela' : 'Nueva escuela'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la escuela *
            </label>
            <input
              type="text"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Domicilio
            </label>
            <input
              type="text"
              value={formData.domicilio || ''}
              onChange={(e) => setFormData({ ...formData, domicilio: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Director
            </label>
            <input
              type="text"
              value={formData.director || ''}
              onChange={(e) => setFormData({ ...formData, director: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              value={formData.telefono || ''}
              onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={formData.correo || ''}
              onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Matrícula
            </label>
            <input
              type="number"
              value={formData.matricula || ''}
              onChange={(e) => setFormData({ ...formData, matricula: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CCT
            </label>
            <input
              type="text"
              value={formData.cct || ''}
              onChange={(e) => setFormData({ ...formData, cct: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Selector de ubicación */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Ubicación en el mapa *
            </label>
            <button
              type="button"
              onClick={() => setModoEdicion(!modoEdicion)}
              className={`text-xs px-3 py-1 rounded-full transition-colors ${
                modoEdicion 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {modoEdicion ? 'Edición activa' : 'Activar edición'}
            </button>
          </div>
          <SelectorUbicacion 
            posicion={posicion} 
            setPosicion={setPosicion}
            modoEdicion={modoEdicion}
          />
          {posicion && (
            <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
              <FontAwesomeIcon icon={faLocationDot} className="text-blue-500" />
              Coordenadas: {posicion.lat.toFixed(6)}, {posicion.lng.toFixed(6)}
            </div>
          )}
        </div>

        {/* Botones */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <FontAwesomeIcon icon={faSave} />
            {escuela ? 'Actualizar' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

// ====================== COMPONENTE PRINCIPAL ADMIN ======================

export default function AdminEscuelas() {
  const [escuelas, setEscuelas] = useState<Escuela[]>([])
  const [loading, setLoading] = useState(true)
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<Escuela | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [posicion, setPosicion] = useState<{ lat: number; lng: number } | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    cargarEscuelas()
  }, [])

  async function cargarEscuelas() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('instituciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setEscuelas(data || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar las escuelas')
    } finally {
      setLoading(false)
    }
  }

  async function guardarEscuela(data: Partial<Escuela>) {
    try {
      if (escuelaSeleccionada) {
        // Editar
        const { error } = await supabase
          .from('instituciones')
          .update(data)
          .eq('id', escuelaSeleccionada.id)

        if (error) throw error
        alert('Escuela actualizada correctamente')
      } else {
        // Crear
        const { error } = await supabase
          .from('instituciones')
          .insert([data])

        if (error) throw error
        alert('Escuela creada correctamente')
      }

      await cargarEscuelas()
      cancelarFormulario()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al guardar la escuela')
    }
  }

  async function eliminarEscuela(id: number) {
    if (!confirm('¿Estás seguro de eliminar esta escuela?')) return

    try {
      const { error } = await supabase
        .from('instituciones')
        .delete()
        .eq('id', id)

      if (error) throw error
      alert('Escuela eliminada correctamente')
      await cargarEscuelas()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar la escuela')
    }
  }

  function editarEscuela(escuela: Escuela) {
    setEscuelaSeleccionada(escuela)
    setPosicion(escuela.latitude && escuela.longitude ? { lat: escuela.latitude, lng: escuela.longitude } : null)
    setMostrarFormulario(true)
    setModoEdicion(true)
  }

  function nuevaEscuela() {
    setEscuelaSeleccionada(null)
    setPosicion(null)
    setMostrarFormulario(true)
    setModoEdicion(true)
  }

  function cancelarFormulario() {
    setEscuelaSeleccionada(null)
    setPosicion(null)
    setMostrarFormulario(false)
    setModoEdicion(false)
  }

  const escuelasFiltradas = escuelas.filter(e => 
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.domicilio && e.domicilio.toLowerCase().includes(busqueda.toLowerCase()))
  )

  const escuelasConUbicacion = escuelas.filter(e => e.latitude && e.longitude)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Cargando escuelas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faSchool} className="text-blue-600" />
              Administrar Escuelas
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({escuelasConUbicacion.length} ubicadas)
              </span>
            </h1>
          </div>
          <button
            onClick={nuevaEscuela}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <FontAwesomeIcon icon={faPlus} />
            Nueva escuela
          </button>
        </div>

        {/* Buscador */}
        <div className="mb-4">
          <div className="relative max-w-sm">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <FontAwesomeIcon icon={faSearch} className="text-sm" />
            </div>
            <input
              type="text"
              placeholder="Buscar escuelas..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Grid de escuelas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {escuelasFiltradas.map((escuela) => (
            <div
              key={escuela.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 text-sm truncate">
                      {escuela.nombre}
                    </h3>
                    {escuela.domicilio && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 mr-1 text-[10px]" />
                        {escuela.domicilio}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => editarEscuela(escuela)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-full hover:bg-blue-50"
                      title="Editar"
                    >
                      <FontAwesomeIcon icon={faEdit} className="text-sm" />
                    </button>
                    <button
                      onClick={() => eliminarEscuela(escuela.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50"
                      title="Eliminar"
                    >
                      <FontAwesomeIcon icon={faTrash} className="text-sm" />
                    </button>
                  </div>
                </div>

                <div className="mt-1.5 space-y-0.5 text-xs text-gray-500">
                  {escuela.director && (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faUser} className="text-gray-400 text-[10px]" />
                      {escuela.director}
                    </div>
                  )}
                  {escuela.telefono && (
                    <div className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-[10px]" />
                      {escuela.telefono}
                    </div>
                  )}
                  {escuela.correo && (
                    <div className="flex items-center gap-1 truncate">
                      <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-[10px]" />
                      <span className="truncate">{escuela.correo}</span>
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                  {escuela.latitude && escuela.longitude ? (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <FontAwesomeIcon icon={faLocationDot} className="text-[10px]" />
                      Ubicada
                    </span>
                  ) : (
                    <span className="text-xs text-amber-600 flex items-center gap-1">
                      <FontAwesomeIcon icon={faExclamationTriangle} className="text-[10px]" />
                      Sin ubicación
                    </span>
                  )}
                  <span className="text-xs text-gray-400">
                    {escuela.cct || 'Sin CCT'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {escuelasFiltradas.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {busqueda ? 'No se encontraron escuelas' : 'No hay escuelas registradas'}
          </div>
        )}

        {/* Modal de formulario */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[2000] p-3 overflow-y-auto">
            <div className="w-full max-w-3xl max-h-[95vh] overflow-y-auto">
              <FormularioEscuela
                escuela={escuelaSeleccionada}
                onSave={guardarEscuela}
                onCancel={cancelarFormulario}
                posicion={posicion}
                setPosicion={setPosicion}
                modoEdicion={modoEdicion}
                setModoEdicion={setModoEdicion}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}