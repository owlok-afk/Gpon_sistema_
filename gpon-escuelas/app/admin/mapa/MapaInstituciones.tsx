'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHome,
  faRoute,
  faSatellite,
  faMap,
  faExpand,
  faCompress,
  faCamera,
  faXmark,
} from '@fortawesome/free-solid-svg-icons'
import { StreetViewModal } from '@/app/components/StreetViewModal'

export type EstadoVinculacion = 'no_vinculada' | 'en_proceso' | 'vinculada' | 'rechazada'

export type InstitucionMapa = {
  id: number
  nombre: string
  cct: string | null
  domicilio: string | null
  director: string | null
  telefono: string | null
  estado_vinculacion: EstadoVinculacion
  latitude: number
  longitude: number
}

type Props = {
  instituciones: InstitucionMapa[]
  seleccionadaId: number | null
  onSelectDetalle: (inst: InstitucionMapa) => void
}

type LayerType = 'satellite_hd' | 'satellite' | 'streets'

function crearIcono(color: string) {
  return new L.DivIcon({
    className: 'custom-pin',
    html: `<div style="width: 28px; height: 28px; background: ${color}; border: 3px solid white; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 0 2px 6px rgba(0,0,0,0.3); position: relative;"><div style="width: 10px; height: 10px; background: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);"></div></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  })
}

const ICONOS = {
  vinculada: crearIcono('#10b981'),
  en_proceso: crearIcono('#f59e0b'),
  rechazada: crearIcono('#f43f5e'),
  no_vinculada: crearIcono('#64748b'),
}

function abrirGoogleMaps(lat: number, lng: number) {
  window.open(
    `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
    '_blank'
  )
}

function CentrarEnSeleccionada({
  instituciones,
  seleccionadaId,
}: {
  instituciones: InstitucionMapa[]
  seleccionadaId: number | null
}) {
  const map = useMap()
  useEffect(() => {
    if (seleccionadaId == null) return
    const inst = instituciones.find((i) => i.id === seleccionadaId)
    if (inst) {
      map.flyTo([inst.latitude, inst.longitude], 17, {
        duration: 1.2,
        easeLinearity: 0.25,
      })
    }
  }, [seleccionadaId, instituciones, map])
  return null
}

function InvalidarTamano() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(t)
  }, [map])
  return null
}

function MapInstanceCapture({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => {
    onReady(map)
  }, [map, onReady])
  return null
}

// Captura clics en el mapa cuando el modo Street View está activo
function MapStreetViewListener({
  isActive,
  onSelect,
}: {
  isActive: boolean
  onSelect: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(e) {
      if (isActive) {
        onSelect(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

export default function MapaInstituciones({
  instituciones,
  seleccionadaId,
  onSelectDetalle,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [center] = useState<LatLngExpression>([19.95, -99.65])
  const [layer, setLayer] = useState<LayerType>('satellite_hd')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Modo Street View: cuando está activo, los clics en el mapa abren el Street View
  const [isStreetViewActive, setIsStreetViewActive] = useState(false)

  // Datos del modal de Street View
  const [streetViewData, setStreetViewData] = useState<{
    isOpen: boolean
    coordinates: { lat: number; lng: number } | null
  }>({ isOpen: false, coordinates: null })

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  // Cambia el cursor del mapa cuando el modo Street View está activo
  useEffect(() => {
    if (!mapRef.current) return
    const container = mapRef.current.getContainer()
    if (isStreetViewActive) {
      container.style.cursor = 'crosshair'
    } else {
      container.style.cursor = ''
    }
  }, [isStreetViewActive])

  function toggleFullscreen() {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.error('Error al entrar en pantalla completa:', err)
      })
    } else {
      document.exitFullscreen()
    }
  }

  function handleStreetViewSelect(lat: number, lng: number) {
    setStreetViewData({
      isOpen: true,
      coordinates: { lat, lng },
    })
    setIsStreetViewActive(false)
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', minHeight: 500 }}
      className="relative rounded-2xl overflow-hidden border border-slate-200 bg-[#f8fafc]"
    >
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%', minHeight: 500 }}
        zoomControl={false}
        ref={mapRef}
        className="z-0"
      >
        {/* ======================= */}
        {/* CAPAS CARTOGRÁFICAS     */}
        {/* ======================= */}

        {layer === 'satellite_hd' && (
          <TileLayer
            url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            attribution='&copy; Google Maps'
            maxZoom={21}
          />
        )}

        {layer === 'satellite' && (
          <>
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri, Maxar, Earthstar Geographics'
              maxZoom={19}
            />
            <TileLayer
              url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri'
              maxZoom={19}
            />
          </>
        )}

        {layer === 'streets' && (
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            maxZoom={19}
          />
        )}

        <MapInstanceCapture onReady={(m) => { mapRef.current = m }} />
        <InvalidarTamano />
        <CentrarEnSeleccionada instituciones={instituciones} seleccionadaId={seleccionadaId} />

        {/* Listener para clics en el mapa (solo cuando modo Street View está activo) */}
        <MapStreetViewListener
          isActive={isStreetViewActive}
          onSelect={handleStreetViewSelect}
        />

        {instituciones.map((inst) => (
          <Marker
            key={inst.id}
            position={[inst.latitude, inst.longitude]}
            icon={ICONOS[inst.estado_vinculacion]}
          >
            <Popup minWidth={260} maxWidth={320}>
              <div className="p-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {inst.cct && (
                    <span className="text-[10px] font-mono font-semibold text-sky-800 bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-md">
                      {inst.cct}
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      inst.estado_vinculacion === 'vinculada'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : inst.estado_vinculacion === 'en_proceso'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : inst.estado_vinculacion === 'rechazada'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {inst.estado_vinculacion.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-900 leading-snug mb-1">
                  {inst.nombre}
                </div>

                {inst.domicilio && (
                  <div className="text-[11px] text-slate-500 mb-2">{inst.domicilio}</div>
                )}

                {inst.director && (
                  <div className="text-[11px] text-slate-600 mb-2">
                    <strong>Director:</strong> {inst.director}
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => abrirGoogleMaps(inst.latitude, inst.longitude)}
                    className="flex-1 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1.5 rounded-md transition-colors flex items-center justify-center gap-1"
                  >
                    <FontAwesomeIcon icon={faRoute} className="text-[10px]" />
                    Cómo llegar
                  </button>
                  <button
                    onClick={() => onSelectDetalle(inst)}
                    className="flex-1 text-[11px] bg-slate-900 hover:bg-slate-800 text-white px-2 py-1.5 rounded-md transition-colors"
                  >
                    Ver detalle
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* ============================================ */}
        {/* PANEL DE CONTROLES FLOTANTES                  */}
        {/* ============================================ */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col items-end gap-2">

          {/* Selector de capa */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden flex">
            <button
              type="button"
              onClick={() => setLayer('satellite_hd')}
              className={`px-3 h-9 text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                layer === 'satellite_hd'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Satélite HD"
            >
              <FontAwesomeIcon icon={faSatellite} className="text-[11px]" />
              HD
            </button>
            <div className="w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => setLayer('satellite')}
              className={`px-3 h-9 text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                layer === 'satellite'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Satélite Esri"
            >
              <FontAwesomeIcon icon={faSatellite} className="text-[11px]" />
              Satélite
            </button>
            <div className="w-px bg-slate-200" />
            <button
              type="button"
              onClick={() => setLayer('streets')}
              className={`px-3 h-9 text-[11px] font-semibold flex items-center gap-1.5 transition-colors ${
                layer === 'streets'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              title="Calles"
            >
              <FontAwesomeIcon icon={faMap} className="text-[11px]" />
              Calles
            </button>
          </div>

          {/* Botón de modo Street View */}
          <button
            type="button"
            onClick={() => setIsStreetViewActive((v) => !v)}
            className={`h-10 px-3 rounded-lg shadow-md border flex items-center gap-2 text-[11px] font-bold transition-colors ${
              isStreetViewActive
                ? 'bg-amber-500 border-amber-600 text-slate-950 animate-pulse'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title="Activar modo Street View: luego haz click en el mapa"
          >
            <FontAwesomeIcon icon={faCamera} className="text-sm" />
            {isStreetViewActive ? 'Cancelar' : 'Street View'}
          </button>

          {/* Zoom + Home + Fullscreen */}
          <div className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden flex flex-col">
            <button
              type="button"
              onClick={() => mapRef.current?.zoomIn()}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors border-b border-slate-200"
              title="Acercar"
            >
              <span className="text-lg font-light leading-none">+</span>
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.zoomOut()}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors border-b border-slate-200"
              title="Alejar"
            >
              <span className="text-lg font-light leading-none">−</span>
            </button>
            <button
              type="button"
              onClick={() => mapRef.current?.setView([19.95, -99.65], 10)}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors border-b border-slate-200"
              title="Centrar en la región"
            >
              <FontAwesomeIcon icon={faHome} className="text-sm" />
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-100 transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} className="text-sm" />
            </button>
          </div>
        </div>

        {/* ============================================ */}
        {/* AVISO FLOTANTE cuando Street View está ON    */}
        {/* ============================================ */}
        {isStreetViewActive && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-amber-500 text-slate-950 px-4 py-2 rounded-full shadow-lg border border-amber-600 flex items-center gap-3 text-xs font-bold">
            <FontAwesomeIcon icon={faCamera} className="text-sm" />
            <span>Haz click en cualquier parte del mapa para abrir Street View</span>
            <button
              type="button"
              onClick={() => setIsStreetViewActive(false)}
              className="bg-slate-950 text-white w-5 h-5 rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors"
              title="Cancelar"
            >
              <FontAwesomeIcon icon={faXmark} className="text-[10px]" />
            </button>
          </div>
        )}

        {/* Leyenda */}
        <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow border border-slate-200">
          <p className="text-[10px] font-bold text-slate-700 mb-1.5">Estado</p>
          <div className="space-y-1 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow"></span>
              <span className="text-slate-600">Vinculada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow"></span>
              <span className="text-slate-600">En proceso</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow"></span>
              <span className="text-slate-600">Rechazada</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-500 border-2 border-white shadow"></span>
              <span className="text-slate-600">No vinculada</span>
            </div>
          </div>
        </div>
      </MapContainer>

      {/* ============================================ */}
      {/* MODAL DE STREET VIEW                          */}
      {/* ============================================ */}
      <StreetViewModal
        isOpen={streetViewData.isOpen}
        onClose={() => setStreetViewData({ isOpen: false, coordinates: null })}
        coordinates={streetViewData.coordinates}
        title="Inspección Street View 360°"
        subtitle={
          streetViewData.coordinates
            ? `${streetViewData.coordinates.lat.toFixed(6)}, ${streetViewData.coordinates.lng.toFixed(6)}`
            : undefined
        }
      />
    </div>
  )
}