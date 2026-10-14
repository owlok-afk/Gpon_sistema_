'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTimes,
  faQrcode,
  faKey,
  faCopy,
  faCheck,
  faRotate,
  faShieldHalved,
  faUserTie,
  faClock,
  faBuilding,
  faTicketAlt,
  faLink,
} from '@fortawesome/free-solid-svg-icons'

interface ModalCodigoAccesoEscuelaProps {
  onClose: () => void
  institucionId?: number
  institucionNombre?: string
  institucionCCT?: string
  ticketId?: number
  ticketFolio?: string
  ticketTitulo?: string
  onValidado?: () => void
}

export default function ModalCodigoAccesoEscuela({
  onClose,
  institucionId,
  institucionNombre,
  institucionCCT,
  ticketId,
  ticketFolio,
  ticketTitulo,
  onValidado,
}: ModalCodigoAccesoEscuelaProps) {
  const [codigoInfo, setCodigoInfo] = useState<any | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [cargando, setCargando] = useState<boolean>(true)
  const [generando, setGenerando] = useState<boolean>(false)
  const [copiado, setCopiado] = useState<boolean>(false)
  const [copiadoLink, setCopiadoLink] = useState<boolean>(false)
  const [urlAccesoDirecto, setUrlAccesoDirecto] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarCodigoActivo()
  }, [ticketId, institucionId])

  // Polling cada 3.5 segundos si el código está pendiente para detectar en vivo cuando el técnico lo valide
  useEffect(() => {
    if (!codigoInfo || codigoInfo.estado !== 'pendiente') return

    const interval = setInterval(() => {
      cargarCodigoActivo(true)
    }, 3500)

    return () => clearInterval(interval)
  }, [codigoInfo?.estado, codigoInfo?.id])

  async function generarQr(codigoNum: string) {
    try {
      // El QR almacena el enlace directo para que el escáner del celular lo abra automáticamente
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const urlDirecta = `${origin}/validar-acceso?codigo=${encodeURIComponent(codigoNum)}`
      setUrlAccesoDirecto(urlDirecta)

      const url = await QRCode.toDataURL(urlDirecta, {
        width: 280,
        margin: 2,
        color: {
          dark: '#08296c',
          light: '#ffffff',
        },
      })
      setQrDataUrl(url)
    } catch (e) {
      console.error('Error generando QR:', e)
    }
  }

  function copiarLinkAlPortapapeles() {
    if (!urlAccesoDirecto) return
    navigator.clipboard.writeText(urlAccesoDirecto)
    setCopiadoLink(true)
    setTimeout(() => setCopiadoLink(false), 2500)
  }

  async function cargarCodigoActivo(silencioso = false) {
    if (!silencioso) setCargando(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (ticketId) params.set('ticket_id', ticketId.toString())
      if (institucionId) params.set('institucion_id', institucionId.toString())

      params.set('_t', Date.now().toString())
      const res = await fetch(`/api/acceso-tecnico/activo?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      })
      const data = await res.json()
      if (res.ok && data.codigo) {
        if (data.codigo.estado === 'validado' && codigoInfo?.estado === 'pendiente') {
          onValidado?.()
        }
        setCodigoInfo(data.codigo)
        if (data.codigo.codigo) {
          await generarQr(data.codigo.codigo)
        }
      } else {
        setCodigoInfo(null)
      }
    } catch (err: any) {
      if (!silencioso) setError(err.message || 'Error al consultar código de acceso')
    } finally {
      if (!silencioso) setCargando(false)
    }
  }

  async function generarNuevoCodigo() {
    setGenerando(true)
    setError(null)
    try {
      const res = await fetch('/api/acceso-tecnico/generar', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticketId || undefined,
          institucion_id: institucionId || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al generar el código')
      }

      setCodigoInfo(data.codigo)
      if (data.codigo?.codigo) {
        await generarQr(data.codigo.codigo)
      }
    } catch (err: any) {
      setError(err.message || 'No se pudo generar el código')
    } finally {
      setGenerando(false)
    }
  }

  function copiarAlPortapapeles() {
    if (!codigoInfo?.codigo) return
    navigator.clipboard.writeText(codigoInfo.codigo)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  const codigoFormateado = codigoInfo?.codigo
    ? `${codigoInfo.codigo.slice(0, 3)} - ${codigoInfo.codigo.slice(3)}`
    : ''

  const esValidado = codigoInfo?.estado === 'validado'

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
                Pase de Acceso para Técnico
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Control y Seguridad de Visitas Escolares
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
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          {/* Identificación de la institución / ticket */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
              <FontAwesomeIcon icon={faBuilding} className="text-blue-600 text-xs" />
              <span className="truncate">{institucionNombre || 'Plantel Escolar'}</span>
            </div>
            {institucionCCT && (
              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                CCT: {institucionCCT}
              </span>
            )}
            {ticketFolio && (
              <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-blue-700 dark:text-blue-400 font-mono">
                  Ticket #{ticketFolio}
                </span>
                <span className="text-slate-500 truncate max-w-[200px]">
                  {ticketTitulo || 'Atención técnica'}
                </span>
              </div>
            )}
          </div>

          {error && (
            <div className="w-full p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium text-left">
              {error}
            </div>
          )}

          {cargando ? (
            <div className="py-12 flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-slate-400">Verificando pase de acceso...</span>
            </div>
          ) : !codigoInfo || codigoInfo.estado === 'cancelado' || codigoInfo.estado === 'expirado' ? (
            /* Estado: Sin código activo */
            <div className="py-6 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl">
                <FontAwesomeIcon icon={faQrcode} />
              </div>
              <div className="max-w-xs">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Genera el código de autorización
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Al llegar el técnico de GPON a tu plantel, deberás proporcionarle este código de 6 dígitos o mostrarle el QR para permitir su ingreso.
                </p>
              </div>
              <button
                onClick={generarNuevoCodigo}
                disabled={generando}
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {generando ? (
                  <FontAwesomeIcon icon={faRotate} className="animate-spin" />
                ) : (
                  <FontAwesomeIcon icon={faKey} />
                )}
                Generar Código de Acceso
              </button>
            </div>
          ) : esValidado ? (
            /* Estado: VALIDADO - Técnico ya en sitio */
            <div className="w-full py-4 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-sm animate-bounce">
                <FontAwesomeIcon icon={faCheck} />
              </div>

              <div className="w-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 p-4 rounded-2xl text-center space-y-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 inline-block">
                  Acceso Autorizado
                </span>
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-100">
                  Técnico en Sitio Atendiendo
                </h3>
                <div className="pt-2 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 font-medium">
                  <FontAwesomeIcon icon={faUserTie} className="text-emerald-600" />
                  <span>{codigoInfo.tecnico_nombre || 'Técnico GPON Telecom'}</span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
                  <FontAwesomeIcon icon={faClock} className="text-[10px]" />
                  <span>
                    Validado hoy a las{' '}
                    {new Date(codigoInfo.validado_en).toLocaleTimeString('es-MX', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    hrs
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">
                El técnico ha acreditado su identidad y se encuentra laborando en las instalaciones del plantel.
              </p>

              <button
                onClick={generarNuevoCodigo}
                disabled={generando}
                className="mt-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
              >
                <FontAwesomeIcon icon={faRotate} />
                Generar nuevo código para otra visita
              </button>
            </div>
          ) : (
            /* Estado: PENDIENTE - Mostrando Código OTP y QR */
            <div className="w-full flex flex-col items-center space-y-4">
              {/* Código OTP de 6 dígitos tipo repartidor */}
              <div className="w-full">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Código de Entrada (OTP)
                </span>
                <div className="flex items-center justify-center gap-2">
                  {codigoInfo.codigo?.split('').map((digito: string, i: number) => (
                    <div
                      key={i}
                      className={`w-10 h-13 sm:w-11 sm:h-14 rounded-xl flex items-center justify-center text-2xl font-black font-mono border-2 shadow-xs transition-all ${
                        i === 3 ? 'ml-2' : ''
                      } bg-blue-50/60 dark:bg-blue-950/40 border-blue-500/60 text-blue-900 dark:text-blue-100`}
                    >
                      {digito}
                    </div>
                  ))}
                </div>

                <div className="mt-2.5 flex items-center justify-center gap-2">
                  <button
                    onClick={copiarAlPortapapeles}
                    className="text-xs text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium"
                  >
                    <FontAwesomeIcon icon={copiado ? faCheck : faCopy} className={copiado ? 'text-emerald-500' : ''} />
                    {copiado ? '¡Copiado!' : 'Copiar código'}
                  </button>
                </div>
              </div>

              {/* Código QR con link directo para escaneo con cámara */}
              {qrDataUrl && (
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border-2 border-blue-200 dark:border-blue-900/60 shadow-md flex flex-col items-center">
                  <div className="bg-white p-2 rounded-xl">
                    <img
                      src={qrDataUrl}
                      alt="Código QR de Acceso"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    />
                  </div>
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 mt-2.5 flex items-center gap-1.5">
                    <span>📱 Escanear con cámara del celular</span>
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 text-center max-w-[240px] mt-0.5">
                    Abre el enlace directo para validar la entrada al instante.
                  </span>

                  {urlAccesoDirecto && (
                    <button
                      type="button"
                      onClick={copiarLinkAlPortapapeles}
                      className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
                    >
                      <FontAwesomeIcon icon={copiadoLink ? faCheck : faLink} className={copiadoLink ? 'text-emerald-500' : ''} />
                      <span>{copiadoLink ? '¡Enlace copiado!' : 'Copiar enlace directo'}</span>
                    </button>
                  )}
                </div>
              )}

              {/* Instrucción y detector de llegada */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 rounded-xl text-left text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  Esperando llegada del técnico...
                </p>
                <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90">
                  Dicta el código <strong>{codigoFormateado}</strong> al técnico cuando esté en la puerta del plantel. Esta pantalla se actualizará automáticamente cuando él lo ingrese.
                </p>
              </div>

              <div className="flex items-center justify-between w-full text-xs text-slate-400 pt-1">
                <span className="text-[11px]">
                  Válido por 12 horas
                </span>
                <button
                  onClick={generarNuevoCodigo}
                  disabled={generando}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faRotate} className={generando ? 'animate-spin' : ''} />
                  Generar otro código
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-semibold transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

