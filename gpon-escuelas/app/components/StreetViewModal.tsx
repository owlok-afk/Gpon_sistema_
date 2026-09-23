'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faXmark,
  faExternalLink,
  faCopy,
  faCheck,
  faGlobe,
  faCamera,
  faMapPin,
  faSatellite,
} from '@fortawesome/free-solid-svg-icons'

interface StreetViewModalProps {
  isOpen: boolean
  onClose: () => void
  coordinates: { lat: number; lng: number } | null
  title?: string
  subtitle?: string
}

export const StreetViewModal = ({
  isOpen,
  onClose,
  coordinates,
  title = 'Inspección Street View 360°',
  subtitle,
}: StreetViewModalProps) => {
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<'streetview' | 'satellite'>('streetview')

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen) {
      setViewMode('streetview')
      setCopied(false)
    }
  }, [isOpen, coordinates])

  if (!isOpen || !coordinates) return null

  const { lat, lng } = coordinates
  const latFixed = lat.toFixed(6)
  const lngFixed = lng.toFixed(6)

  const officialStreetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`
  const googleEarthUrl = `https://earth.google.com/web/@${lat},${lng},2600a,1000d,35y,0h,45t,0r`
  const embedStreetViewUrl = `https://maps.google.com/maps?q=${lat},${lng}&layer=c&cbll=${lat},${lng}&cbp=11,0,0,0,0&output=svembed`
  const embedSatelliteUrl = `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=19&ie=UTF8&iwloc=&output=embed`

  const handleCopyGps = () => {
    navigator.clipboard.writeText(`${latFixed}, ${lngFixed}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white border border-slate-300 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Cabecera */}
        <div className="bg-slate-100 px-3.5 sm:px-6 py-3 border-b border-slate-300 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 sm:p-2.5 bg-amber-500 text-slate-950 font-black rounded-xl shadow-sm flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faCamera} className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  {title}
                </h2>
                <span className="text-[9px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-400 shrink-0 whitespace-nowrap">
                  360° Oficial
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
                {subtitle || 'Vista a nivel de calle de la infraestructura GPON / poste / fachada'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar vista Street View"
          >
            <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de coordenadas y modo */}
        <div className="bg-slate-50 px-3 sm:px-6 py-2 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-800 font-medium truncate">
            <FontAwesomeIcon icon={faMapPin} className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
            <span className="hidden sm:inline">GPS:</span>
            <code className="bg-slate-200 px-2 py-0.5 rounded font-mono font-bold text-slate-900 text-[11px] sm:text-xs">
              {latFixed}, {lngFixed}
            </code>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="bg-slate-200 p-0.5 rounded-lg flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setViewMode('streetview')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'streetview'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-700 hover:bg-slate-300'
                }`}
              >
                <FontAwesomeIcon icon={faCamera} className="w-3 h-3" />
                <span>360°</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('satellite')}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'satellite'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-300'
                }`}
              >
                <FontAwesomeIcon icon={faSatellite} className="w-3 h-3" />
                <span>Satélite HD</span>
              </button>
            </div>

            <button
              onClick={handleCopyGps}
              className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">¡Copiado!</span>
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faCopy} className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Copiar GPS</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Visor embebido */}
        <div className="relative flex-1 min-h-[300px] sm:min-h-[400px] bg-slate-950 flex flex-col items-center justify-center overflow-hidden">
          <iframe
            key={viewMode}
            title={viewMode === 'streetview' ? 'Street View 360' : 'Satélite HD'}
            src={viewMode === 'streetview' ? embedStreetViewUrl : embedSatelliteUrl}
            className="w-full h-full border-0 absolute inset-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* Pie */}
        <div className="bg-slate-100 px-3.5 sm:px-6 py-2.5 sm:py-3 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="text-[10px] sm:text-[11px] text-slate-700 font-medium hidden sm:block">
            <span>Vista oficial: </span>
            <strong className="text-slate-900">Google Maps</strong>
          </div>

          <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
            <a
              href={googleEarthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 transition-colors"
            >
              <FontAwesomeIcon icon={faGlobe} className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>Google Earth 3D</span>
            </a>

            <a
              href={officialStreetViewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-600 shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <FontAwesomeIcon icon={faCamera} className="w-4 h-4 text-slate-950 shrink-0" />
              <span>Abrir en Google Maps</span>
              <FontAwesomeIcon icon={faExternalLink} className="w-3.5 h-3.5 text-slate-900 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null
}