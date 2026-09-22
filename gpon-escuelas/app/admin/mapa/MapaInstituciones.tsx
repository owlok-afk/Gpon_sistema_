'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHome, faRoute } from '@fortawesome/free-solid-svg-icons'

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
      map.flyTo([inst.latitude, inst.longitude], 15, { duration: 1 })
    }
  }, [seleccionadaId, instituciones, map])
  return null
}

// Fuerza a Leaflet a recalcular tamaño cuando cambia el contenedor
function InvalidarTamano() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(t)
  }, [map])
  return null
}

export default function MapaInstituciones({
  instituciones,
  seleccionadaId,
  onSelectDetalle,
}: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const [center] = useState<LatLngExpression>([19.95, -99.65])

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 500 }} className="relative rounded-2xl overflow-hidden border border-slate-200 bg-[#f8fafc]">
      <MapContainer
        center={center}
        zoom={10}
        style={{ height: '100%', width: '100%', minHeight: 500 }}
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
{/* Capa de nombres de calles y lugares encima */}
<TileLayer
  url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
  attribution='&copy; Esri'
  maxZoom={19}
/>

        <InvalidarTamano />
        <CentrarEnSeleccionada instituciones={instituciones} seleccionadaId={seleccionadaId} />

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
    </div>
  )
}