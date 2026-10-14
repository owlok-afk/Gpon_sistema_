'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTimes,
  faFlagCheckered,
  faBuilding,
  faClock,
  faCheck,
  faSpinner,
  faCheckCircle,
  faWrench,
  faUserTie,
} from '@fortawesome/free-solid-svg-icons'

interface ModalFinalizarVisitaTecnicoProps {
  ticket: {
    id: number
    folio: string
    titulo: string
    institucion_id: number | null
  }
  institucion?: {
    nombre: string
    cct?: string | null
    domicilio?: string | null
  } | null
  onClose: () => void
  onFinalizado: (resultado: any) => void
}

export default function ModalFinalizarVisitaTecnico({
  ticket,
  institucion,
  onClose,
  onFinalizado,
}: ModalFinalizarVisitaTecnicoProps) {
  const [solucion, setSolucion] = useState('')
  const [recibidoPor, setRecibidoPor] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<any | null>(null)

  const horaActual = new Date().toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })

  async function handleFinalizar() {
    if (!solucion.trim()) {
      setError('Por favor describe brevemente el trabajo realizado o la solución aplicada.')
      return
    }

    if (!confirmado) {
      setError('Por favor marca la casilla confirmando que el servicio quedó operativo.')
      return
    }

    setGuardando(true)
    setError(null)

    try {
      const res = await fetch('/api/acceso-tecnico/finalizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          solucion: solucion.trim(),
          recibido_por: recibidoPor.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar la salida.')
      }

      setExito(data)
      try {
        onFinalizado(data)
      } catch (errCb) {
        console.error('Error en onFinalizado callback:', errCb)
      }
    } catch (err: any) {
      setError(err.message || 'Error al finalizar visita.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[2300] flex items-center justify-center p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <FontAwesomeIcon icon={faFlagCheckered} className="text-sm" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Finalizar Visita (Check-out)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Registro de Salida y Conclusión de Reporte
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {exito ? (
            /* Vista de Éxito al concluir */
            <div className="flex flex-col items-center text-center space-y-4 py-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center justify-center text-3xl shadow-sm animate-bounce">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 inline-block mb-1">
                  ✓ Servicio Resuelto
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¡Salida Registrada Correctamente!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  El ticket ha quedado marcado como resuelto en la bitácora escolar.
                </p>
              </div>

              <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Hora de salida:</span>
                  <span className="font-bold text-slate-900 dark:text-white font-mono">{exito.horaSalida || horaActual} hrs</span>
                </div>
                {exito.tiempoEnSitio && (
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">Tiempo laborado en sitio:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{exito.tiempoEnSitio}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Ticket:</span>
                  <span className="font-mono text-blue-600 font-bold">#{ticket.folio}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                Volver a mi panel de tickets
              </button>
            </div>
          ) : (
            /* Formulario de salida */
            <div className="space-y-4">
              {/* Resumen del Plantel y Ticket */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white truncate">
                    <FontAwesomeIcon icon={faBuilding} className="text-blue-600" />
                    <span>{institucion?.nombre || 'Plantel Escolar'}</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-800">
                    #{ticket.folio}
                  </span>
                </div>
                {institucion?.cct && (
                  <p className="text-[10px] text-slate-500 font-mono">CCT: {institucion.cct}</p>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <FontAwesomeIcon icon={faClock} className="text-emerald-600" />
                    Hora de salida: <strong className="text-slate-900 dark:text-white">{horaActual} hrs</strong>
                  </span>
                  <span className="text-emerald-600 font-bold">En Sitio (Activo)</span>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Solución técnica aplicada */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Trabajo realizado / Solución aplicada *
                </label>
                <textarea
                  rows={3}
                  value={solucion}
                  onChange={(e) => {
                    setSolucion(e.target.value)
                    if (error) setError(null)
                  }}
                  placeholder="Ej: Se reemplazó conector SC/APC dañado en roseta, se verificó potencia Rx a -19.4 dBm y se confirmó navegación de 100 Mbps con el personal escolar."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Recibido por */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Personal que recibió de conformidad (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FontAwesomeIcon icon={faUserTie} className="text-xs" />
                  </div>
                  <input
                    type="text"
                    value={recibidoPor}
                    onChange={(e) => setRecibidoPor(e.target.value)}
                    placeholder="Ej: Profr. Juan Hernández - Director escolar"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Checkbox de confirmación */}
              <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-200/80 dark:border-emerald-900/40">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={confirmado}
                    onChange={(e) => {
                      setConfirmado(e.target.checked)
                      if (error) setError(null)
                    }}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span>
                    Confirmo que el servicio quedó funcionando operativamente y notifiqué mi salida al personal del plantel.
                  </span>
                </label>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={guardando}
                  className="w-1/3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleFinalizar}
                  disabled={guardando}
                  className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {guardando ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      <span>Registrando Salida...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Confirmar Salida y Cerrar Ticket</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

