'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '@/lib/supabase'

// Font Awesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { 
  faPlus, 
  faMinus, 
  faLocationDot, 
  faSearch, 
  faXmark, 
  faSchool, 
  faUser, 
  faPhone, 
  faEnvelope, 
  faInfoCircle,
  faRoute,
  faEdit,
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

// ====================== COMPONENTES ======================

// Controles de zoom simples
function ControlesZoom() {
  const map = useMap()
  
  return (
    <div className="absolute bottom-20 right-3 sm:right-4 z-[1000] flex flex-col gap-1.5 sm:gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="bg-white/95 backdrop-blur-xs w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-md hover:bg-gray-50 flex items-center justify-center text-lg sm:text-xl font-bold border border-gray-200 active:bg-gray-100 touch-manipulation"
        title="Acercar"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="bg-white/95 backdrop-blur-xs w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-md hover:bg-gray-50 flex items-center justify-center text-lg sm:text-xl font-bold border border-gray-200 active:bg-gray-100 touch-manipulation"
        title="Alejar"
      >
        −
      </button>
      <button
        onClick={() => map.setView([19.95, -99.65], 10)}
        className="bg-blue-600 w-9 h-9 sm:w-10 sm:h-10 rounded-full shadow-md hover:bg-blue-700 flex items-center justify-center text-white border border-blue-700 active:bg-blue-800 touch-manipulation"
        title="Ver todo el Estado de México"
      >
        <FontAwesomeIcon icon={faHome} className="text-xs sm:text-sm" />
      </button>
    </div>
  )
}

// Buscador simplificado
function BuscadorEscuelas({ escuelas, onSelect }: { escuelas: Escuela[], onSelect: (escuela: Escuela) => void }) {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<Escuela[]>([])
  const [mostrarResultados, setMostrarResultados] = useState(false)

  useEffect(() => {
    if (busqueda.length > 1) {
      const filtradas = escuelas.filter(e => 
        e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        (e.domicilio && e.domicilio.toLowerCase().includes(busqueda.toLowerCase()))
      )
      setResultados(filtradas.slice(0, 8))
      setMostrarResultados(true)
    } else {
      setResultados([])
      setMostrarResultados(false)
    }
  }, [busqueda, escuelas])

  return (
    <div className="relative w-full max-w-sm">
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <FontAwesomeIcon icon={faSearch} className="text-sm" />
        </div>
        <input
          type="text"
          placeholder="Buscar escuela..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onFocus={() => busqueda.length > 1 && setMostrarResultados(true)}
          className="w-full pl-9 pr-10 py-2 text-sm rounded-full border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
        {busqueda && (
          <button
            onClick={() => {
              setBusqueda('')
              setResultados([])
              setMostrarResultados(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>
      
      {mostrarResultados && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 max-h-52 overflow-y-auto z-[1001]">
          {resultados.length > 0 ? (
            resultados.map((escuela) => (
              <button
                key={escuela.id}
                onClick={() => {
                  onSelect(escuela)
                  setBusqueda('')
                  setResultados([])
                  setMostrarResultados(false)
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
              >
                <div className="font-medium text-sm">{escuela.nombre}</div>
                {escuela.domicilio && (
                  <div className="text-xs text-gray-500">{escuela.domicilio}</div>
                )}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 text-sm">
              No se encontraron escuelas
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function abrirGoogleMaps(lat: number, lng: number) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    '_blank'
  )
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

// ====================== COMPONENTE PRINCIPAL ======================

export default function MapaEscuelas() {
  const [instituciones, setInstituciones] = useState<Escuela[]>([])
  const [loading, setLoading] = useState(true)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    cargarInstituciones()
  }, [])

  async function cargarInstituciones() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('instituciones')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInstituciones(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const escuelasConUbicacion = instituciones.filter(e => e.latitude && e.longitude)

  function irAEscuela(escuela: Escuela) {
    if (escuela.latitude && escuela.longitude && mapRef.current) {
      mapRef.current.flyTo([escuela.latitude, escuela.longitude], 15, { duration: 1 })
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">Cargando mapa...</p>
      </div>
    </div>
  )

  const center: LatLngExpression = [19.95, -99.65]
  const zoom = 10

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
            <FontAwesomeIcon icon={faSchool} className="text-white text-sm" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-800">
              Escuelas
              <span className="text-sm font-normal text-gray-400 ml-2">
                {escuelasConUbicacion.length}
              </span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <BuscadorEscuelas escuelas={escuelasConUbicacion} onSelect={irAEscuela} />
          
          <a
            href="/admin"
            className="px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm flex items-center gap-1.5 whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faEdit} className="text-xs" />
            <span className="hidden sm:inline">Administrar</span>
          </a>
        </div>
      </header>

      {/* MAPA CON CALLES */}
      <div className="flex-1 relative">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          ref={mapRef}
          className="z-0"
        >
          {/* Capa satelital con etiquetas integradas */}
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
          
          {/* Capa de nombres de calles y lugares - SUPERPUESTA MÁS NÍTIDA */}
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
            className="opacity-90"
          />

          <ControlesZoom />

          {escuelasConUbicacion.map((escuela) => {
            const lat = escuela.latitude!
            const lng = escuela.longitude!
            const position: LatLngExpression = [lat, lng]

            return (
              <Marker key={escuela.id} position={position}>
                <Popup minWidth={200} maxWidth={280}>
                  <div className="p-1">
                    <div className="font-semibold text-gray-800 text-sm border-b border-gray-100 pb-1 mb-1">
                      {escuela.nombre}
                    </div>
                    {escuela.domicilio && (
                      <div className="text-xs text-gray-600 flex items-start gap-1.5 mt-1">
                        <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 text-[10px] mt-0.5" />
                        <span>{escuela.domicilio}</span>
                      </div>
                    )}
                    {escuela.director && (
                      <div className="text-xs text-gray-700 flex items-center gap-1.5 mt-0.5">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400 text-[10px]" />
                        <span>{escuela.director}</span>
                      </div>
                    )}
                    {escuela.telefono && (
                      <div className="text-xs text-gray-700 flex items-center gap-1.5 mt-0.5">
                        <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-[10px]" />
                        <span>{escuela.telefono}</span>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (escuela.latitude && escuela.longitude) {
                          abrirGoogleMaps(escuela.latitude, escuela.longitude)
                        }
                      }}
                      className="mt-2 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full transition-colors w-full flex items-center justify-center gap-1.5"
                    >
                      <FontAwesomeIcon icon={faRoute} className="text-[10px]" />
                      Cómo llegar
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>

        {/* Leyenda flotante */}
        <div className="absolute bottom-4 left-3 right-3 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg text-xs text-gray-600 flex flex-wrap items-center justify-center gap-3">
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faLocationDot} className="text-blue-500 text-xs" />
            {escuelasConUbicacion.length} escuelas
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1.5">
            <FontAwesomeIcon icon={faInfoCircle} className="text-gray-400 text-xs" />
            Click para info
          </span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1 text-gray-400">
            + / − Zoom
          </span>
        </div>

        {/* Título del área */}
        <div className="absolute top-4 left-3 right-3 z-[1000] pointer-events-none">
          <p className="text-center text-xs text-gray-500 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full inline-block mx-auto w-auto">
            Norte del Estado de México
          </p>
        </div>
      </div>
    </div>
  )
}