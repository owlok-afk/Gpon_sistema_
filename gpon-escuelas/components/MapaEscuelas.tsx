'use client'

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
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
  faList, 
  faMap, 
  faSchool, 
  faUser, 
  faPhone, 
  faEnvelope, 
  faChevronRight, 
  faInfoCircle, 
  faExclamationTriangle,
  faChevronDown,
  faRoute
} from '@fortawesome/free-solid-svg-icons'

// Fix para los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// ====================== COMPONENTES ======================

function ControlesZoom() {
  const map = useMap()
  
  return (
    <div className="absolute bottom-20 right-3 z-[1000] flex flex-col gap-2 sm:bottom-4 sm:right-4">
      <button
        onClick={() => map.zoomIn()}
        className="bg-white w-11 h-11 sm:w-9 sm:h-9 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center border border-gray-200 active:bg-gray-100 transition-colors duration-150"
        title="Acercar"
      >
        <FontAwesomeIcon icon={faPlus} className="text-gray-700 text-sm" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="bg-white w-11 h-11 sm:w-9 sm:h-9 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center border border-gray-200 active:bg-gray-100 transition-colors duration-150"
        title="Alejar"
      >
        <FontAwesomeIcon icon={faMinus} className="text-gray-700 text-sm" />
      </button>
      <button
        onClick={() => map.setView([19.4326, -99.1332], 6)}
        className="bg-white w-11 h-11 sm:w-9 sm:h-9 rounded-lg shadow-md hover:bg-gray-50 flex items-center justify-center border border-gray-200 active:bg-gray-100 transition-colors duration-150"
        title="Centrar mapa"
      >
        <FontAwesomeIcon icon={faCrosshairs} className="text-gray-700 text-sm" />
      </button>
      <button
        onClick={() => {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                map.flyTo([pos.coords.latitude, pos.coords.longitude], 15)
              },
              () => alert('No se pudo obtener tu ubicación')
            )
          }
        }}
        className="bg-blue-600 w-11 h-11 sm:w-9 sm:h-9 rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center border border-blue-700 active:bg-blue-800 transition-colors duration-150"
        title="Mi ubicación"
      >
        <FontAwesomeIcon icon={faLocationDot} className="text-white text-sm" />
      </button>
    </div>
  )
}

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
      setResultados(filtradas.slice(0, 10))
      setMostrarResultados(true)
    } else {
      setResultados([])
      setMostrarResultados(false)
    }
  }, [busqueda, escuelas])

  return (
    <div className="relative w-full max-w-xs">
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
          className="w-full pl-9 pr-10 py-2.5 sm:py-2 text-sm rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-150 bg-white"
        />
        {busqueda && (
          <button
            onClick={() => {
              setBusqueda('')
              setResultados([])
              setMostrarResultados(false)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faXmark} className="text-sm" />
          </button>
        )}
      </div>
      
      {mostrarResultados && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto z-[1001]">
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
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors duration-150 flex items-center justify-between group"
              >
                <div>
                  <div className="font-medium text-sm text-gray-800">{escuela.nombre}</div>
                  {escuela.domicilio && (
                    <div className="text-xs text-gray-500">{escuela.domicilio}</div>
                  )}
                </div>
                <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 group-hover:text-gray-500 text-xs transition-colors" />
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

// ====================== FUNCIÓN PARA ABRIR GOOGLE MAPS ======================

function abrirGoogleMaps(lat: number, lng: number, nombre: string) {
  // URL para abrir Google Maps con la ubicación y ruta desde tu ubicación actual
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving`
  window.open(url, '_blank')
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
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<Escuela | null>(null)
  const [modoVista, setModoVista] = useState<'mapa' | 'lista'>('mapa')
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
  const escuelasSinUbicacion = instituciones.filter(e => !e.latitude || !e.longitude)

  function irAEscuela(escuela: Escuela) {
    if (escuela.latitude && escuela.longitude && mapRef.current) {
      mapRef.current.flyTo([escuela.latitude, escuela.longitude], 16, { duration: 1.2 })
      setEscuelaSeleccionada(escuela)
      if (window.innerWidth < 768) {
        setModoVista('mapa')
      }
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 text-sm">Cargando mapa...</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-gray-50">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 sm:p-4 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FontAwesomeIcon icon={faSchool} className="text-white text-sm" />
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800">
            Mapa de Escuelas
            <span className="text-sm font-normal text-gray-400 ml-2 hidden sm:inline">
              {escuelasConUbicacion.length} ubicadas
            </span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <BuscadorEscuelas escuelas={escuelasConUbicacion} onSelect={irAEscuela} />
          
          <button
            onClick={() => setModoVista(modoVista === 'mapa' ? 'lista' : 'mapa')}
            className="px-3 py-2.5 sm:px-4 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-150 text-sm text-gray-700 flex items-center gap-2 whitespace-nowrap"
          >
            <FontAwesomeIcon icon={modoVista === 'mapa' ? faList : faMap} />
            <span className="hidden sm:inline">{modoVista === 'mapa' ? 'Lista' : 'Mapa'}</span>
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* MAPA */}
        <div className={`${modoVista === 'mapa' ? 'flex-1' : 'hidden md:flex md:flex-1'} relative`}>
          <MapContainer
            center={[19.4326, -99.1332]}
            zoom={6}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            ref={mapRef as any}
            className="z-0"
          >
            <TileLayer
              url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              attribution=''
              maxZoom={19}
            />

            <ControlesZoom />

            {escuelasConUbicacion.map((escuela) => {
              const lat = escuela.latitude!
              const lng = escuela.longitude!

              return (
                <Marker 
                  key={escuela.id} 
                  position={[lat, lng]}
                  eventHandlers={{
                    click: () => setEscuelaSeleccionada(escuela)
                  }}
                >
                  <Popup className="custom-popup" minWidth={260} maxWidth={340}>
                    <div className="p-1">
                      <div className="font-semibold text-gray-800 border-b border-gray-100 pb-1.5 mb-1.5">
                        {escuela.nombre}
                      </div>
                      {escuela.domicilio && (
                        <div className="text-sm text-gray-600 flex items-start gap-1.5 mt-1">
                          <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 text-xs mt-0.5" />
                          <span>{escuela.domicilio}</span>
                        </div>
                      )}
                      {escuela.director && (
                        <div className="text-sm text-gray-700 flex items-center gap-1.5 mt-1">
                          <FontAwesomeIcon icon={faUser} className="text-gray-400 text-xs" />
                          <span>{escuela.director}</span>
                        </div>
                      )}
                      {escuela.telefono && (
                        <div className="text-sm text-gray-700 flex items-center gap-1.5 mt-1">
                          <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-xs" />
                          <span>{escuela.telefono}</span>
                        </div>
                      )}
                      {escuela.correo && (
                        <div className="text-sm text-blue-600 flex items-center gap-1.5 mt-1">
                          <FontAwesomeIcon icon={faEnvelope} className="text-blue-400 text-xs" />
                          <span>{escuela.correo}</span>
                        </div>
                      )}
                      
                      {/* BOTÓN CÓMO LLEGAR - NUEVO */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            if (escuela.latitude && escuela.longitude && mapRef.current) {
                              mapRef.current.flyTo([escuela.latitude, escuela.longitude], 17)
                            }
                          }}
                          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md transition-colors duration-150 flex items-center justify-center gap-1.5"
                        >
                          <FontAwesomeIcon icon={faCrosshairs} className="text-xs" />
                          Centrar
                        </button>
                        <button
                          onClick={() => {
                            if (escuela.latitude && escuela.longitude) {
                              abrirGoogleMaps(escuela.latitude, escuela.longitude, escuela.nombre)
                            }
                          }}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md transition-colors duration-150 flex items-center justify-center gap-1.5"
                        >
                          <FontAwesomeIcon icon={faRoute} className="text-xs" />
                          Cómo llegar
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>

          {/* Leyenda flotante */}
          <div className="absolute bottom-4 left-3 right-3 sm:left-4 sm:right-auto z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-200 flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faLocationDot} className="text-blue-500 text-xs" />
              {escuelasConUbicacion.length} escuelas
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faInfoCircle} className="text-gray-400 text-xs" />
              Click para info
            </span>
            <span className="hidden sm:inline text-gray-300">|</span>
            <span className="flex items-center gap-1.5 text-green-600">
              <FontAwesomeIcon icon={faRoute} className="text-xs" />
              Cómo llegar
            </span>
          </div>

          {/* Alerta de escuelas sin ubicación */}
          {escuelasSinUbicacion.length > 0 && (
            <div className="absolute top-4 left-3 right-3 z-[1000]">
              <div className="bg-amber-50 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg shadow-lg text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500" />
                  <span>{escuelasSinUbicacion.length} escuelas sin ubicación</span>
                </div>
                <button 
                  onClick={() => setModoVista('lista')}
                  className="text-xs text-amber-700 hover:text-amber-900 underline font-medium"
                >
                  Ver listado
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LISTA LATERAL */}
        <div className={`
          ${modoVista === 'lista' ? 'flex-1' : 'hidden md:flex'}
          md:flex md:w-80 lg:w-96 md:flex-shrink-0
          bg-white shadow-lg overflow-hidden flex-col
        `}>
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-medium text-gray-700 text-sm flex items-center gap-2">
              <FontAwesomeIcon icon={faList} className="text-gray-400" />
              Escuelas ({escuelasConUbicacion.length})
            </h2>
            <button
              onClick={() => setModoVista('mapa')}
              className="md:hidden text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-3">
            {escuelasConUbicacion.length === 0 ? (
              <div className="text-center text-gray-500 py-8 text-sm">
                No hay escuelas con ubicación
              </div>
            ) : (
              <div className="space-y-2">
                {escuelasConUbicacion.map((escuela) => (
                  <div
                    key={escuela.id}
                    onClick={() => irAEscuela(escuela)}
                    className={`
                      p-3 rounded-lg border cursor-pointer transition-all duration-150
                      ${escuelaSeleccionada?.id === escuela.id 
                        ? 'border-blue-500 bg-blue-50 shadow-sm' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="font-medium text-sm text-gray-800">{escuela.nombre}</div>
                    {escuela.domicilio && (
                      <div className="text-xs text-gray-500 mt-0.5 flex items-start gap-1.5">
                        <FontAwesomeIcon icon={faLocationDot} className="text-gray-400 text-xs mt-0.5" />
                        <span>{escuela.domicilio}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-1">
                      {escuela.director && (
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <FontAwesomeIcon icon={faUser} className="text-gray-400 text-[10px]" />
                          {escuela.director}
                        </span>
                      )}
                      {escuela.telefono && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-[10px]" />
                          {escuela.telefono}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <FontAwesomeIcon icon={faLocationDot} className="text-gray-300 text-[10px]" />
                        {escuela.latitude?.toFixed(4)}, {escuela.longitude?.toFixed(4)}
                      </div>
                      {escuela.latitude && escuela.longitude && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirGoogleMaps(escuela.latitude!, escuela.longitude!, escuela.nombre)
                          }}
                          className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors duration-150 flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faRoute} className="text-[10px]" />
                          Llegar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}