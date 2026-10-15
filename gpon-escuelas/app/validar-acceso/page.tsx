'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCheckCircle,
  faShieldHalved,
  faBuilding,
  faTicketAlt,
  faKey,
  faSpinner,
  faArrowRight,
  faUser,
  faLock,
  faExclamationTriangle,
  faClock,
  faMapMarkerAlt,
  faWrench,
  faSignInAlt,
  faFlagCheckered,
} from '@fortawesome/free-solid-svg-icons'
import ModalFinalizarVisitaTecnico from '@/components/ModalFinalizarVisitaTecnico'

function ValidarAccesoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const codigoParam = searchParams.get('codigo') || ''

  const [codigo, setCodigo] = useState(codigoParam.replace(/\D/g, '').slice(0, 6))
  const [loadingUser, setLoadingUser] = useState(true)
  const [user, setUser] = useState<any | null>(null)
  const [perfil, setPerfil] = useState<any | null>(null)
  const [mostrarModalFinalizar, setMostrarModalFinalizar] = useState(false)

  // Estados de validación
  const [validando, setValidando] = useState(false)
  const [resultado, setResultado] = useState<any | null>(null)
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null)

  // Estados para inicio de sesión en caso de no estar autenticado
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [iniciandoSesion, setIniciandoSesion] = useState(false)
  const [errorLogin, setErrorLogin] = useState<string | null>(null)

  // 1. Verificar sesión actual al cargar
  useEffect(() => {
    async function verificarSesion() {
      try {
        setLoadingUser(true)
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (currentUser) {
          setUser(currentUser)
          const { data: prof } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single()

          setPerfil(prof)

          // Si ya tiene código en URL y es técnico/admin, ejecutar validación automática
          if (codigoParam && codigoParam.length === 6 && prof && ['tecnico', 'admin'].includes(prof.role)) {
            ejecutarValidacion(codigoParam)
          }
        }
      } catch (err) {
        console.error('Error verificando sesión:', err)
      } finally {
        setLoadingUser(false)
      }
    }

    verificarSesion()
  }, [codigoParam])

  // 2. Función para ejecutar la validación del código
  async function ejecutarValidacion(codigoAValidar: string) {
    const codLimpio = codigoAValidar.replace(/\D/g, '').slice(0, 6)
    if (!codLimpio || codLimpio.length < 6) {
      setErrorValidacion('Por favor ingresa un código de 6 dígitos completo.')
      return
    }

    setValidando(true)
    setErrorValidacion(null)

    try {
      const res = await fetch('/api/acceso-tecnico/validar', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        body: JSON.stringify({ codigo: codLimpio }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Código inválido o expirado.')
      }

      setResultado(data)
    } catch (err: any) {
      setErrorValidacion(err.message || 'Error al validar el código.')
    } finally {
      setValidando(false)
    }
  }

  // 3. Función para iniciar sesión y validar de inmediato
  async function handleLoginYValidar(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) {
      setErrorLogin('Por favor completa correo y contraseña.')
      return
    }

    setIniciandoSesion(true)
    setErrorLogin(null)

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError || !authData.user) {
        throw new Error(authError?.message || 'Credenciales incorrectas.')
      }

      setUser(authData.user)

      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (!prof || !['tecnico', 'admin'].includes(prof.role)) {
        throw new Error('Solo los técnicos o administradores pueden autorizar visitas escolares.')
      }

      setPerfil(prof)

      // Ejecutar la validación con el código disponible
      if (codigo.length === 6) {
        await ejecutarValidacion(codigo)
      }
    } catch (err: any) {
      setErrorLogin(err.message || 'Error al iniciar sesión.')
    } finally {
      setIniciandoSesion(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-blue-100 selection:text-blue-900 font-sans">
      <div className="w-full max-w-md">
        {/* Cabecera / Marca */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 mb-3">
            <FontAwesomeIcon icon={faShieldHalved} className="text-2xl" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            GPON Telecom Escuelas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Validación de Pase y Acceso Técnico a Plantel
          </p>
        </div>

        {/* Tarjeta Principal */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 overflow-hidden">
          {loadingUser || validando ? (
            /* Estado de carga */
            <div className="py-12 flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {validando ? 'Validando pase de seguridad...' : 'Cargando sesión...'}
              </p>
              <p className="text-xs text-slate-400">Por favor espera un momento</p>
            </div>
          ) : resultado ? (
            /* ======================================================== */
            /* VISTA DE ÉXITO: ACCESO VALIDADO                          */
            /* ======================================================== */
            <div className="flex flex-col items-center text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-4xl shadow-inner animate-bounce">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 inline-block mb-1.5">
                  Acceso Autorizado
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  ¡Entrada Registrada con Éxito!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tu llegada ha sido acreditada ante la dirección del plantel.
                </p>
              </div>

              {/* Ficha informativa del plantel y ticket */}
              <div className="w-full bg-slate-50 dark:bg-slate-800/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FontAwesomeIcon icon={faBuilding} className="text-xs" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white block truncate">
                      {resultado.institucion?.nombre || 'Plantel Escolar'}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      CCT: {resultado.institucion?.cct || 'S/N'}
                    </span>
                  </div>
                </div>

                {resultado.institucion?.domicilio && (
                  <div className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-300 pl-1">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-slate-400 mt-0.5 flex-shrink-0" />
                    <span>{resultado.institucion.domicilio}</span>
                  </div>
                )}

                {resultado.ticket && (
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                    <span className="font-bold text-blue-700 dark:text-blue-400 font-mono">
                      Ticket #{resultado.ticket.folio}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 text-[10px] font-bold">
                      Estado: En Proceso (En Sitio)
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Técnico: {perfil?.full_name || user?.email || 'Técnico GPON'}</span>
                  <span>{new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} hrs</span>
                </div>
              </div>

              {/* Acciones: Finalizar visita o ir al panel */}
              <div className="w-full space-y-2 pt-1">
                {resultado.ticket && resultado.ticket.estado !== 'resuelto' && (
                  <button
                    type="button"
                    onClick={() => setMostrarModalFinalizar(true)}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faFlagCheckered} />
                    <span>Finalizar Visita (Check-out)</span>
                  </button>
                )}

                <Link
                  href="/tecnico"
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <span>Ir a mi Panel de Atención Técnica</span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </Link>
              </div>
            </div>
          ) : !user ? (
            /* ======================================================== */
            /* CASO: TÉCNICO NO AUTENTICADO EN ESTE DISPOSITIVO         */
            /* ======================================================== */
            <form onSubmit={handleLoginYValidar} className="space-y-4">
              <div className="text-center space-y-1 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 inline-block">
                  Pase Escolar Detectado
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Acredita tu Identidad Técnica
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Inicia sesión con tu cuenta de GPON Telecom para validar el acceso al plantel:
                </p>
              </div>

              {/* Muestra del código a validar */}
              {codigo.length === 6 && (
                <div className="py-2.5 bg-blue-50/60 dark:bg-slate-800 rounded-xl border border-blue-200 dark:border-blue-900/60 text-center">
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                    Código de Autorización
                  </span>
                  <span className="text-2xl font-black font-mono tracking-[0.3em] text-blue-950 dark:text-blue-100">
                    {codigo.slice(0, 3)} - {codigo.slice(3)}
                  </span>
                </div>
              )}

              {errorLogin && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium text-center">
                  {errorLogin}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FontAwesomeIcon icon={faUser} className="text-xs" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tecnico@gpon.mx"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FontAwesomeIcon icon={faLock} className="text-xs" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={iniciandoSesion}
                className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {iniciandoSesion ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSignInAlt} />
                    <span>Ingresar y Validar Acceso</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* ======================================================== */
            /* CASO: TÉCNICO AUTENTICADO - FORMULARIO DE CÓDIGO         */
            /* ======================================================== */
            <div className="space-y-5">
              <div className="text-center space-y-1">
                <span className="text-xs text-slate-500">
                  Sesión activa como: <strong>{perfil?.full_name || user.email}</strong>
                </span>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Ingresa o Confirma el Código de la Escuela
                </h2>
              </div>

              {errorValidacion && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium text-center">
                  {errorValidacion}
                </div>
              )}

              {/* Entrada del código de 6 dígitos */}
              <div className="flex flex-col items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  autoFocus
                  placeholder="000000"
                  value={codigo}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setCodigo(val)
                    if (errorValidacion) setErrorValidacion(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && codigo.length === 6 && !validando) {
                      e.preventDefault()
                      ejecutarValidacion(codigo)
                    }
                  }}
                  className="w-full max-w-[260px] py-3 text-center text-3xl font-black font-mono tracking-[0.35em] bg-blue-50/50 dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-500 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 shadow-inner"
                />
                <span className="text-[10px] text-slate-400 mt-1.5 font-medium">
                  6 dígitos generados por la escuela
                </span>
              </div>

              <button
                type="button"
                onClick={() => ejecutarValidacion(codigo)}
                disabled={validando || codigo.length < 6}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                {validando ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    <span>Validando...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faKey} />
                    <span>Validar Entrada al Plantel</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <Link
                  href="/tecnico"
                  className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Regresar a mi panel técnico
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal para checkout / finalizar visita */}
      {mostrarModalFinalizar && resultado?.ticket && (
        <ModalFinalizarVisitaTecnico
          ticket={resultado.ticket}
          institucion={resultado.institucion}
          onClose={() => setMostrarModalFinalizar(false)}
          onFinalizado={(res) => {
            if (res?.ticket) {
              setResultado((prev: any) => ({
                ...prev,
                ticket: res.ticket,
              }))
            }
          }}
        />
      )}
    </div>
  )
}

export default function ValidarAccesoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ValidarAccesoContent />
    </Suspense>
  )
}

