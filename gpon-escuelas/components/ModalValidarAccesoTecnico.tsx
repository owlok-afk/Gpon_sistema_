'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTimes,
  faKey,
  faCheckCircle,
  faBuilding,
  faTicketAlt,
  faShieldHalved,
  faSpinner,
  faArrowRight,
  faMapMarkerAlt,
} from '@fortawesome/free-solid-svg-icons'

interface ModalValidarAccesoTecnicoProps {
  onClose: () => void
  onValidado: (resultado: any) => void
  codigoInicial?: string
}

export default function ModalValidarAccesoTecnico({
  onClose,
  onValidado,
  codigoInicial = '',
}: ModalValidarAccesoTecnicoProps) {
  const [codigo, setCodigo] = useState<string>(codigoInicial)
  const [validando, setValidando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<any | null>(null)

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Solo permitir números y máximo 6 caracteres
    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
    setCodigo(val)
    if (error) setError(null)
  }

  async function handleValidar() {
    if (!codigo || codigo.length < 6) {
      setError('Por favor ingresa el código completo de 6 dígitos.')
      return
    }

    setValidando(true)
    setError(null)

    try {
      const res = await fetch('/api/acceso-tecnico/validar', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ codigo }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Código inválido o expirado.')
      }

      setExito(data)
      try {
        onValidado(data)
      } catch (errCallback) {
        console.error('Error en callback onValidado:', errCallback)
      }
    } catch (err: any) {
      setError(err.message || 'Error al validar el código.')
    } finally {
      setValidando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-[2200] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Cabecera */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FontAwesomeIcon icon={faShieldHalved} className="text-sm" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Validar Acceso al Plantel
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pase de Entrada y Control de Visita
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {exito ? (
            /* Vista de Éxito */
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-sm">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>

              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 inline-block mb-1">
                  Acceso Autorizado
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  ¡Bienvenido al Plantel Escolar!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  La dirección escolar ha autorizado tu ingreso a las instalaciones.
                </p>
              </div>

              {/* Ficha del Plantel y Ticket */}
              <div className="w-full bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <FontAwesomeIcon icon={faBuilding} className="text-blue-600 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {exito.institucion?.nombre || 'Escuela'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      CCT: {exito.institucion?.cct || 'S/N'}
                    </span>
                  </div>
                </div>

                {exito.institucion?.domicilio && (
                  <div className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-slate-400 mt-0.5" />
                    <span>{exito.institucion.domicilio}</span>
                  </div>
                )}

                {exito.ticket && (
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-blue-700 dark:text-blue-400 font-mono">
                      Folio: {exito.ticket.folio}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      Estado: En Proceso (En Sitio)
                    </span>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
              >
                Continuar con el servicio
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          ) : (
            /* Formulario para ingresar el código */
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Solicita al personal de la escuela el <strong>código de 6 dígitos</strong> o el <strong>código QR</strong> para acreditar tu visita:
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium text-center">
                  {error}
                </div>
              )}

              {/* Input grande para los 6 dígitos */}
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={codigo}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && codigo.length === 6 && !validando) {
                      e.preventDefault()
                      handleValidar()
                    }
                  }}
                  className="w-full max-w-[260px] py-3 text-center text-3xl font-black font-mono tracking-[0.35em] bg-blue-50/50 dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-500 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-inner"
                />
                <span className="text-[10px] text-slate-400 mt-1.5 font-medium">
                  Ingresa los 6 dígitos proporcionados por la escuela
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  ¿Cómo funciona la validación?
                </span>
                <p>
                  1. La escuela genera el código en su portal cuando llegas a la puerta.<br />
                  2. Al escribirlo aquí, el sistema acredita tu identidad como técnico autorizado.<br />
                  3. El ticket cambia automáticamente a <strong>"En proceso (En sitio)"</strong> y registra tu hora de llegada.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/2 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleValidar}
                  disabled={validando || codigo.length < 6}
                  className="w-1/2 py-2.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {validando ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                      Validando...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faKey} />
                      Validar Acceso
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

