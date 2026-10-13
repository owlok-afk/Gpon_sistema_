'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L, { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSearch,
  faBuilding,
  faCheckCircle,
  faHourglassHalf,
  faInfoCircle,
  faLocationDot,
  faRoute,
  faExpand,
  faCompress,
  faRotateRight,
  faList,
  faMapMarkedAlt,
  faTimes,
} from '@fortawesome/free-solid-svg-icons'

export type EstadoVinculacion = 'no_vinculada' | 'en_proceso' | 'vinculada' | 'rechazada'

export type InstitucionItem = {
  id: number
  nombre: string
  cct: string | null
  domicilio: string | null
  estado_vinculacion: EstadoVinculacion
  latitude?: number | null
  longitude?: number | null
}

// Coordenadas base de referencia para localidades de la zona norte de EDOMEX
const COORDENADAS_LOCALIDADES_EDOMEX: Record<string, [number, number]> = {
  'SAN FRANCISCO DE LA LOMA': [19.682, -99.985],
  'EL PUEBLITO': [19.664, -99.932],
  'SAN JOAQUIN DEL MONTE': [19.658, -100.012],
  'SAN ONOFRE': [19.695, -99.94],
  'LA MANZANA': [19.712, -99.965],
  'CONCEPCION CHICO': [19.725, -99.978],
  'LA CONCEPCION CHICO': [19.725, -99.978],
  'EJIDO CONCEPCION CHICO': [19.728, -99.982],
  'RIOYOS': [19.68, -100.04],
  'SAN JOSE': [19.645, -100.1345],
  'EJIDO SAN JOSE DEL RINCON': [19.65, -100.125],
  'LA SOLEDAD': [19.67, -99.96],
  'EJIDO LA SOLEDAD': [19.672, -99.958],
  'BARRIO EL TORIL LA SOLEDAD': [19.675, -99.955],
  'EL VALERIO': [19.673, -99.92],
  'SAN MIGUEL AGUA BENDITA': [19.66, -99.97],
  'MAYORAZGO': [19.74, -99.95],
  'LA PURISIMA CONCEPCION MAYORAZGO': [19.742, -99.948],
  'SAN FELIPE DEL PROGRESO': [19.713, -99.953],
  'CARMONA': [19.69, -100.06],
  'LOMA DEL CEDRO': [19.702, -99.925],
  'SAN JUAN COTE CENTRO': [19.735, -99.915],
  'SAN JUAN COTE EJIDO': [19.738, -99.91],
  'EL PINTADO PUEBLO NUEVO': [19.75, -99.93],
  'LAS ROSAS, SAN MIGUEL DEL CENTRO': [19.665, -99.965],
  'RINCON DE LIJADERO': [19.678, -100.02],
  'SAN ANTONIO DE LAS HUERTAS': [19.72, -100.03],
  'SANTA CRUZ DEL TEJOCOTE': [19.685, -99.91],
  'GUARDA DE SAN ANTONIO BUENAVISTA': [19.76, -99.94],
  'LAS PEÑITAS, EL ORO': [19.805, -100.12],
  'GUADALUPE DEL PEDREGAL LA PALMA': [19.715, -99.89],
  'EL GIGANTE': [19.705, -99.935],
  'LAS ANIMAS, EJIDO SAN PEDRO EL ALTO': [19.635, -99.99],
  'ROSA DE PALO AMARILLO': [19.728, -99.905],
  'EJIDO EL CONSUELO': [19.698, -100.015],
  'ROSA DE LA PALMA': [19.718, -99.895],
  'FABRICA PUEBLO NUEVO, MONTE ALTO': [19.755, -99.925],
  'LA TRAMPA CHICA': [19.652, -100.035],
  'POTRERO DE SAN DIEGO': [19.732, -99.885],
  'SAN MIGUEL DEL CENTRO': [19.662, -99.968],
  'FUNDEREJE': [19.692, -100.005],
  'PUNDEREJE': [19.692, -100.005],
  'ESTUTEMPAN': [19.684, -99.97],
  'SAN JUAN PALO SECO': [19.745, -99.92],
  'SAN NICOLAS GUADALUPE': [19.722, -99.91],
  'EJIDO DE SAN JUAN JALPA': [19.765, -99.915],
  'SALTO LA VENTA': [19.69, -99.93],
  'SAN NICOLAS BARRIO SANTA CRUZ': [19.725, -99.908],
  'LOMA DEL RANCHO': [19.708, -99.945],
  'SAN JOAQUIN LAMILLAS': [19.66, -100.018],
  'JOCOTITLAN': [19.708, -99.77],
  'ATLACOMULCO': [19.797, -99.874],
  'EL ORO': [19.802, -100.13],
}

// Crea iconos SVG vectoriales sin relieve
function crearIconoEdomex(estado: EstadoVinculacion, seleccionado = false) {
  let color = '#0066cc' // Azul primario por defecto
  if (estado === 'vinculada') color = '#10b981' // Verde esmeralda activa
  else if (estado === 'en_proceso') color = '#f59e0b' // Ámbar
  else if (estado === 'rechazada') color = '#ef4444' // Rojo peligro

  const size = seleccionado ? 36 : 28
  const pinSize = size
  const ring = seleccionado ? 'stroke="#ffffff" stroke-width="2.5"' : 'stroke="#ffffff" stroke-width="1.8"'

  return new L.DivIcon({
    className: 'custom-edomex-pin',
    html: `
      <div style="width: ${pinSize}px; height: ${pinSize}px; position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25)); transform: ${seleccionado ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.2s ease;">
        <svg viewBox="0 0 24 24" width="${pinSize}" height="${pinSize}" fill="${color}" ${ring}>
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="3.2" fill="#ffffff" />
        </svg>
      </div>
    `,
    iconSize: [pinSize, pinSize],
    iconAnchor: [pinSize / 2, pinSize],
    popupAnchor: [0, -pinSize],
  })
}

// Centrador animado del mapa
function ControladorCentro({
  coords,
  zoom,
}: {
  coords: [number, number] | null
  zoom?: number
}) {
  const map = useMap()
  useEffect(() => {
    if (coords) {
      map.flyTo(coords, zoom || 14, { duration: 0.9 })
    }
  }, [coords, zoom, map])
  return null
}

export default function MapaDashboardEdomex({
  instituciones,
}: {
  instituciones: InstitucionItem[]
}) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [busqueda, setBusqueda] = useState('')
  const [escuelaSeleccionada, setEscuelaSeleccionada] = useState<InstitucionItem | null>(null)
  const [centerTarget, setCenterTarget] = useState<[number, number] | null>(null)
  const [mostrarLista, setMostrarLista] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Centro regional EDOMEX Norte (San Felipe del Progreso / Atlacomulco)
  const centroDefault: LatLngExpression = [19.713, -99.953]

  // Enriquecer escuelas con coordenadas dentro de EDOMEX
  const escuelasConCoords = useMemo(() => {
    const contadorPorLoc: Record<string, number> = {}

    return instituciones.map((inst) => {
      // Si ya tiene coordenadas exactas válidas de BD
      if (inst.latitude && inst.longitude && inst.latitude > 18 && inst.latitude < 21) {
        return {
          ...inst,
          lat: inst.latitude,
          lng: inst.longitude,
          esExacta: true,
        }
      }

      // Si no, resolver por localidad de EDOMEX
      const dom = (inst.domicilio || '').trim().toUpperCase()
      let baseCoord = COORDENADAS_LOCALIDADES_EDOMEX[dom]

      if (!baseCoord) {
        // Búsqueda parcial si coincide algún municipio
        const match = Object.keys(COORDENADAS_LOCALIDADES_EDOMEX).find((k) =>
          dom.includes(k)
        )
        baseCoord = match ? COORDENADAS_LOCALIDADES_EDOMEX[match] : [19.713, -99.953]
      }

      // Desplazamiento mínimo (jitter) para que múltiples escuelas en la misma localidad no se encimen exactamente
      const idx = contadorPorLoc[dom] || 0
      contadorPorLoc[dom] = idx + 1

      const angle = (idx * 137.5 * Math.PI) / 180 // Golden angle distribution
      const radius = idx === 0 ? 0 : 0.0035 + (idx * 0.0012) // ~300m - 1km radio
      const jitterLat = Math.sin(angle) * radius
      const jitterLng = Math.cos(angle) * radius

      return {
        ...inst,
        lat: baseCoord[0] + jitterLat,
        lng: baseCoord[1] + jitterLng,
        esExacta: false,
      }
    })
  }, [instituciones])

  // Filtrado reactivo
  const escuelasFiltradas = useMemo(() => {
    return escuelasConCoords.filter((inst) => {
      // Filtro por estado
      if (filtroEstado !== 'todos' && inst.estado_vinculacion !== filtroEstado) {
        return false
      }

      // Filtro por búsqueda de texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase()
        const matchNombre = inst.nombre.toLowerCase().includes(q)
        const matchCCT = (inst.cct || '').toLowerCase().includes(q)
        const matchDom = (inst.domicilio || '').toLowerCase().includes(q)
        return matchNombre || matchCCT || matchDom
      }

      return true
    })
  }, [escuelasConCoords, filtroEstado, busqueda])

  // Conteo de estados
  const stats = useMemo(() => {
    const vinculadas = instituciones.filter((i) => i.estado_vinculacion === 'vinculada').length
    const enProceso = instituciones.filter((i) => i.estado_vinculacion === 'en_proceso').length
    const noVinculadas = instituciones.filter((i) => i.estado_vinculacion === 'no_vinculada').length
    return { vinculadas, enProceso, noVinculadas, total: instituciones.length }
  }, [instituciones])

  function handleSeleccionarEscuela(inst: any) {
    setEscuelaSeleccionada(inst)
    setCenterTarget([inst.lat, inst.lng])
  }

  function toggleFullscreen() {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  function resetVista() {
    setCenterTarget([19.713, -99.953])
    setEscuelaSeleccionada(null)
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Barra Superior de Control y Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Mapa de Cobertura Escolar · Estado de México
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#0066cc] dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {escuelasFiltradas.length} en pantalla
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cartografía limpia y sin relieve de instituciones en San Felipe del Progreso, Jocotitlán, Atlacomulco, El Oro y San José del Rincón.
          </p>
        </div>

        {/* Buscador Rápido y Botones de Acción */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar escuela o CCT..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]"
            />
            {busqueda && (
              <button
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>

          <button
            onClick={() => setMostrarLista(!mostrarLista)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              mostrarLista
                ? 'bg-blue-50 dark:bg-blue-950/50 text-[#0066cc] border-blue-300 dark:border-blue-700'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
            title="Alternar lista de escuelas"
          >
            <FontAwesomeIcon icon={faList} />
            <span className="hidden sm:inline">Directorio</span>
          </button>

          <button
            onClick={resetVista}
            className="p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all"
            title="Centrar mapa en la región norte de Edomex"
          >
            <FontAwesomeIcon icon={faRotateRight} />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all"
            title="Pantalla completa"
          >
            <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
          </button>
        </div>
      </div>

      {/* Pills de Filtrado Rápido */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 select-none">
        <span className="text-[11px] font-medium text-slate-400 shrink-0">Filtrar:</span>
        <button
          onClick={() => setFiltroEstado('todos')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            filtroEstado === 'todos'
              ? 'bg-[#0066cc] text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Todas ({stats.total})
        </button>

        <button
          onClick={() => setFiltroEstado('vinculada')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            filtroEstado === 'vinculada'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 hover:bg-emerald-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Vinculadas ({stats.vinculadas})
        </button>

        <button
          onClick={() => setFiltroEstado('en_proceso')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            filtroEstado === 'en_proceso'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 hover:bg-amber-100'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          En proceso ({stats.enProceso})
        </button>

        <button
          onClick={() => setFiltroEstado('no_vinculada')}
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            filtroEstado === 'no_vinculada'
              ? 'bg-slate-600 text-white shadow-xs'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
          Sin vincular ({stats.noVinculadas})
        </button>
      </div>

      {/* Contenedor Principal del Mapa y Sidebar Opcional */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 min-h-[500px] h-[520px] flex shadow-xs"
      >
        {/* Mapa Leaflet Limpio (Sin Relieve, Modo Callejero Limpio) */}
        <div className="flex-1 h-full w-full relative z-0">
          <MapContainer
            center={centroDefault}
            zoom={10}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
            ref={mapRef}
            className="z-0"
          >
            {/* Capa de Calles Planas Vectorial (Google Maps 2D Streets - Sin Relieve, Sin API Key) */}
            <TileLayer
              url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
              attribution='&copy; Google Maps'
              maxZoom={20}
            />

            {/* Controlador de Centro Animado */}
            <ControladorCentro coords={centerTarget} zoom={15} />

            {/* Marcadores de Escuelas en EDOMEX */}
            {escuelasFiltradas.map((inst: any) => {
              const esSeleccionada = escuelaSeleccionada?.id === inst.id
              const icono = crearIconoEdomex(inst.estado_vinculacion, esSeleccionada)

              return (
                <Marker
                  key={inst.id}
                  position={[inst.lat, inst.lng]}
                  icon={icono}
                  eventHandlers={{
                    click: () => handleSeleccionarEscuela(inst),
                  }}
                >
                  <Popup className="custom-school-popup">
                    <div className="p-1 min-w-[220px] max-w-xs font-sans text-slate-800">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0066cc] border border-blue-200">
                          CCT: {inst.cct || 'En trámite'}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            inst.estado_vinculacion === 'vinculada'
                              ? 'bg-emerald-50 text-emerald-700'
                              : inst.estado_vinculacion === 'en_proceso'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {inst.estado_vinculacion === 'vinculada'
                            ? 'Activa'
                            : inst.estado_vinculacion === 'en_proceso'
                            ? 'En proceso'
                            : 'Sin vincular'}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                        {inst.nombre}
                      </h4>

                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <FontAwesomeIcon icon={faLocationDot} className="text-[9px] text-[#0066cc]" />
                        <span>{inst.domicilio || 'San Felipe del Progreso, EDOMEX'}</span>
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${inst.lat},${inst.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-[#0066cc] hover:underline flex items-center gap-1"
                        >
                          <FontAwesomeIcon icon={faRoute} className="text-[10px]" />
                          Cómo llegar
                        </a>

                        <a
                          href="/admin/instituciones"
                          className="px-2 py-1 rounded-md bg-slate-900 text-white text-[10px] font-semibold hover:bg-slate-800 transition-colors"
                        >
                          Ver ficha →
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>

        {/* Panel Lateral Desplegable: Directorio de Escuelas con Búsqueda */}
        {mostrarLista && (
          <div className="w-80 h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-l border-slate-200 dark:border-slate-700 flex flex-col z-20 shadow-xl transition-all">
            <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Escuelas en EDOMEX ({escuelasFiltradas.length})
              </span>
              <button
                onClick={() => setMostrarLista(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-xs"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {escuelasFiltradas.map((inst: any) => {
                const esActiva = escuelaSeleccionada?.id === inst.id
                return (
                  <button
                    key={inst.id}
                    onClick={() => handleSeleccionarEscuela(inst)}
                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                      esActiva
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-400 text-[#0066cc] shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] font-bold text-slate-500">
                        {inst.cct || 'Sin CCT'}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full ${
                          inst.estado_vinculacion === 'vinculada'
                            ? 'bg-emerald-500'
                            : inst.estado_vinculacion === 'en_proceso'
                            ? 'bg-amber-400'
                            : 'bg-slate-300'
                        }`}
                      ></span>
                    </div>
                    <div className="font-semibold text-slate-900 dark:text-white truncate">
                      {inst.nombre}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {inst.domicilio || 'Estado de México'}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Tarjeta Flotante Inferior Izquierda: Leyenda Rápida */}
        <div className="absolute left-3.5 bottom-3.5 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md rounded-xl p-3 border border-slate-200/80 dark:border-slate-700 shadow-md flex items-center gap-4 text-xs select-none">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">Vinculada ({stats.vinculadas})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">En Proceso ({stats.enProceso})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0066cc]"></span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">Sin Vincular ({stats.noVinculadas})</span>
          </div>
        </div>
      </div>
    </div>
  )
}
