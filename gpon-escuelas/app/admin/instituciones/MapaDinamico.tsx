'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHome,
  faSearch,
  faMapPin,
  faExclamationTriangle,
  faCheckCircle,
  faSpinner,
  faLink,
  faCrosshairs,
} from '@fortawesome/free-solid-svg-icons'

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

type Props = {
  posicion: { lat: number; lng: number } | null
  setPosicion: (pos: { lat: number; lng: number } | null) => void
  setCoordenadas: (lat: number, lng: number) => void
  direccion?: string
  municipio?: string
}

type ResultadoGeo = {
  lat: number
  lng: number
  displayName: string
  tipo: string
  importancia: number
}

export default function MapaDinamico({
  posicion,
  setPosicion,
  setCoordenadas,
  direccion,
  municipio,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const [center, setCenter] = useState<LatLngExpression>([19.95, -99.65])

  // Campos de entrada
  const [terminoBusqueda, setTerminoBusqueda] = useState('')
  const [linkMaps, setLinkMaps] = useState('')

  // Estados
  const [buscandoPorDireccion, setBuscandoPorDireccion] = useState(false)
  const [extrayendoLink, setExtrayendoLink] = useState(false)
  const [resultados, setResultados] = useState<ResultadoGeo[] | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [exitoMsg, setExitoMsg] = useState<string | null>(null)

  useEffect(() => {
    if (posicion) {
      setCenter([posicion.lat, posicion.lng])
      if (mapRef.current) {
        mapRef.current.setView([posicion.lat, posicion.lng], 16)
      }
    }
  }, [posicion])

  useEffect(() => {
    if (direccion && !terminoBusqueda) {
      const contexto = municipio ? `${direccion}, ${municipio}` : direccion
      setTerminoBusqueda(contexto)
    }
  }, [direccion, municipio, terminoBusqueda])

  // ============================================================
  // BÚSQUEDA POR DIRECCIÓN (Nominatim)
  // ============================================================
  async function buscarPorDireccion() {
    setErrorMsg(null)
    setExitoMsg(null)
    setResultados(null)

    if (!terminoBusqueda || terminoBusqueda.trim() === '') {
      setErrorMsg('Escribe una dirección, colonia o municipio para buscar.')
      return
    }

    setBuscandoPorDireccion(true)
    try {
      const res = await fetch('/api/geocodificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direccion: terminoBusqueda.trim() }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudo encontrar la ubicación')

      const encontrados: ResultadoGeo[] = json.resultados

      if (encontrados.length === 1) {
        aplicarResultado(encontrados[0])
        setExitoMsg('Ubicación encontrada correctamente.')
        return
      }

      setResultados(encontrados)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al buscar la ubicación')
    } finally {
      setBuscandoPorDireccion(false)
    }
  }

  // ============================================================
  // EXTRAER COORDENADAS DE UN LINK DE GOOGLE MAPS
  // ============================================================
  async function extraerDeLink() {
    setErrorMsg(null)
    setExitoMsg(null)
    setResultados(null)

    if (!linkMaps || linkMaps.trim() === '') {
      setErrorMsg('Pega un link de Google Maps.')
      return
    }

    setExtrayendoLink(true)
    try {
      const res = await fetch('/api/parsear-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: linkMaps.trim() }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'No se pudieron extraer las coordenadas')

      const { lat, lng } = json
      setPosicion({ lat, lng })
      setCoordenadas(lat, lng)
      if (mapRef.current) {
        mapRef.current.flyTo([lat, lng], 17, { duration: 1 })
      }
      setLinkMaps('')
      setExitoMsg(`Coordenadas aplicadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al procesar el link')
    } finally {
      setExtrayendoLink(false)
    }
  }

  function aplicarResultado(r: ResultadoGeo) {
    setPosicion({ lat: r.lat, lng: r.lng })
    setCoordenadas(r.lat, r.lng)
    if (mapRef.current) {
      mapRef.current.flyTo([r.lat, r.lng], 16, { duration: 1 })
    }
    setResultados(null)
    setExitoMsg(`Ubicación aplicada: ${r.displayName.split(',').slice(0, 2).join(',')}`)
  }

  function MapEvents() {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng
        setPosicion({ lat, lng })
        setCoordenadas(lat, lng)
        setExitoMsg(null)
        setErrorMsg(null)
      },
    })
    return null
  }

  function DraggableMarker() {
    const map = useMap()

    useEffect(() => {
      if (!posicion) return

      const icon = new L.Icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        iconSize: [30, 45],
        iconAnchor: [15, 45],
        popupAnchor: [0, -35],
      })

      const marker = L.marker([posicion.lat, posicion.lng], {
        draggable: true,
        icon,
      }).addTo(map)

      marker.on('dragend', function () {
        const newPos = marker.getLatLng()
        setPosicion({ lat: newPos.lat, lng: newPos.lng })
        setCoordenadas(newPos.lat, newPos.lng)
        setExitoMsg(null)
      })

      markerRef.current = marker

      return () => {
        if (markerRef.current) map.removeLayer(markerRef.current)
      }
    }, [posicion, map, setPosicion, setCoordenadas])

    return null
  }

  return (
    <div className="space-y-3">
      {/* ============================================ */}
      {/* OPCIÓN 1: Pegar link de Google Maps */}
      {/* ============================================ */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
        <label className="block text-[11px] font-semibold text-emerald-900 mb-1.5 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faLink} className="text-emerald-600" />
          Opción 1: Pegar link de Google Maps (recomendado)
        </label>
        <p className="text-[10px] text-emerald-700 mb-2">
          Abre Google Maps, busca la escuela, toca "Compartir" → "Copiar vínculo" y pégalo aquí.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={linkMaps}
            onChange={(e) => setLinkMaps(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                extraerDeLink()
              }
            }}
            placeholder="https://maps.app.goo.gl/..."
            className="flex-1 px-3 py-2 border border-emerald-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
          />
          <button
            type="button"
            onClick={extraerDeLink}
            disabled={extrayendoLink || !linkMaps.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-semibold shadow-sm whitespace-nowrap"
          >
            {extrayendoLink ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                Extrayendo...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faCrosshairs} className="text-xs" />
                Ubicar
              </>
            )}
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* OPCIÓN 2: Buscar por dirección */}
      {/* ============================================ */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <label className="block text-[11px] font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faSearch} className="text-slate-500" />
          Opción 2: Buscar por dirección
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                buscarPorDireccion()
              }
            }}
            placeholder="Ej: San Felipe del Progreso, Estado de México"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          <button
            type="button"
            onClick={buscarPorDireccion}
            disabled={buscandoPorDireccion || !terminoBusqueda.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs font-semibold shadow-sm whitespace-nowrap"
          >
            {buscandoPorDireccion ? (
              <>
                <FontAwesomeIcon icon={faSpinner} spin className="text-xs" />
                Buscando...
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faSearch} className="text-xs" />
                Buscar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {errorMsg && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 flex items-start gap-2">
          <FontAwesomeIcon icon={faExclamationTriangle} className="mt-0.5 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {exitoMsg && !errorMsg && (
        <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-start gap-2">
          <FontAwesomeIcon icon={faCheckCircle} className="mt-0.5 text-emerald-600" />
          <span className="line-clamp-2">{exitoMsg}</span>
        </div>
      )}

      {/* Lista de resultados */}
      {resultados && resultados.length > 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-amber-800 mb-2">
            Se encontraron {resultados.length} ubicaciones. Selecciona la correcta:
          </p>
          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {resultados.map((r, i) => (
              <button
                key={i}
                type="button"
                onClick={() => aplicarResultado(r)}
                className="w-full text-left text-[11px] bg-white hover:bg-amber-100 border border-amber-200 rounded-md px-2.5 py-2 transition-colors flex items-start gap-2"
              >
                <FontAwesomeIcon icon={faMapPin} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-slate-700 leading-tight block">{r.displayName}</span>
                  <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">
                    {r.lat.toFixed(5)}, {r.lng.toFixed(5)}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setResultados(null)}
            className="mt-2 text-[10px] text-amber-700 hover:underline"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* MAPA (satelital con relieve) */}
      {/* ============================================ */}
      <div className="relative w-full h-[400px] rounded-xl overflow-hidden border-2 border-slate-300">
        <MapContainer
          center={center}
          zoom={posicion ? 16 : 10}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          ref={mapRef}
          className="z-0"
        >
          {/* Capa satelital con relieve (Esri World Imagery) */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri, Maxar, Earthstar Geographics'
            maxZoom={19}
          />
          {/* Capa de nombres de calles y lugares encima (para que se vean los textos) */}
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; Esri'
            maxZoom={19}
          />
          <MapEvents />
          <DraggableMarker />

          <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              className="bg-white w-9 h-9 rounded-full shadow-md hover:bg-gray-50 flex items-center justify-center border border-gray-200 text-lg font-bold"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              className="bg-white w-9 h-9 rounded-full shadow-md hover:bg-gray-50 flex items-center justify-center border border-gray-200 text-lg font-bold"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.setView([19.95, -99.65], 10)}
              className="bg-blue-600 w-9 h-9 rounded-full shadow-md hover:bg-blue-700 flex items-center justify-center text-white border border-blue-700"
            >
              <FontAwesomeIcon icon={faHome} className="text-xs" />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow text-xs text-gray-600 flex items-center gap-2">
            <FontAwesomeIcon icon={faMapPin} className="text-blue-500 text-[10px]" />
            <span>Click en el mapa o arrastra el marcador</span>
          </div>
        </MapContainer>
      </div>
    </div>
  )
}