'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

type Tab = 'login' | 'solicitud'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  // Login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Solicitud — datos principales
  const [solNombre, setSolNombre] = useState('')
  const [solCCT, setSolCCT] = useState('')
  const [solCorreo, setSolCorreo] = useState('')
  const [solDirector, setSolDirector] = useState('')
  const [solTelefono, setSolTelefono] = useState('')
  const [solDomicilio, setSolDomicilio] = useState('')
  const [solMatricula, setSolMatricula] = useState('')
  const [solAñoEjecucion, setSolAñoEjecucion] = useState('2026')
  const [solPresidente, setSolPresidente] = useState('')
  const [solTelefonoAsoc, setSolTelefonoAsoc] = useState('')
  const [solCiclo, setSolCiclo] = useState('')
  const [solZona, setSolZona] = useState('')
  const [solTurno, setSolTurno] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = profile?.role
      if (role === 'admin') {
        router.push('/admin')
      } else if (role === 'tecnico') {
        router.push('/tecnico')
      } else {
        router.push('/escuela')
      }
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  async function handleSolicitud(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(null)

    if (!solNombre || !solCCT || !solCorreo) {
      setError('Nombre, CCT y correo son obligatorios.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/solicitud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_institucion: solNombre,
          cct: solCCT,
          correo: solCorreo,
          director: solDirector || null,
          telefono: solTelefono || null,
          domicilio: solDomicilio || null,
          matricula: solMatricula ? parseInt(solMatricula) : null,
          año_ejecucion: solAñoEjecucion ? parseInt(solAñoEjecucion) : null,
          presidente_asociacion: solPresidente || null,
          telefono_asociacion: solTelefonoAsoc || null,
          ciclo_escolar: solCiclo || null,
          zona_escolar: solZona || null,
          turno: solTurno || null,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'Error al enviar la solicitud')
      }

      setOk(
        'Solicitud enviada correctamente. Recibirás un correo cuando sea revisada y aprobada.'
      )

      // Limpiar formulario
      setSolNombre('')
      setSolCCT('')
      setSolCorreo('')
      setSolDirector('')
      setSolTelefono('')
      setSolDomicilio('')
      setSolMatricula('')
      setSolAñoEjecucion('2026')
      setSolPresidente('')
      setSolTelefonoAsoc('')
      setSolCiclo('')
      setSolZona('')
      setSolTurno('')
    } catch (err: any) {
      setError(err.message || 'Error al enviar la solicitud')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .bg-gradient-custom {
          background: linear-gradient(135deg, #04123b 0%, #08296c 40%, #0b3d9c 100%);
        }
        .wave-line-1 {
          position: absolute;
          width: 1400px; height: 1400px;
          border-radius: 46%;
          border: 1px solid rgba(255,255,255,0.05);
          top: -300px; left: -500px;
          pointer-events: none;
        }
        .wave-line-2 {
          position: absolute;
          width: 1600px; height: 1600px;
          border-radius: 44%;
          border: 1px solid rgba(255,255,255,0.07);
          top: -450px; left: -400px;
          pointer-events: none;
        }
        .wave-glow {
          position: absolute;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(29,93,218,0.25) 0%, rgba(3,22,76,0) 70%);
          top: 20%; left: -10%;
          pointer-events: none;
        }
      `}</style>

      <div className="font-sans antialiased text-slate-800 bg-gradient-custom min-h-screen relative overflow-x-hidden select-none">
        <div aria-hidden="true" className="wave-line-1"></div>
        <div aria-hidden="true" className="wave-line-2"></div>
        <div aria-hidden="true" className="wave-glow"></div>

        <main className="min-h-screen flex items-center justify-center p-4 md:p-8 lg:p-12 relative z-10">
          <div className="w-full max-w-[1360px] flex flex-col lg:flex-row items-stretch justify-between gap-10 lg:gap-14">

            {/* LEFT */}
            <section className="flex-1 flex flex-col justify-between pt-6 lg:pt-10 pb-6 text-white">
              <div>
                {/* Logo institucional */}
                <div className="flex items-center gap-3.5 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-lg flex items-center justify-center shrink-0 border border-white/20">
                    <img
                      src="/logo_gpon.png"
                      alt="GPON Telecom"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold tracking-tight text-white leading-tight">
                      GPON Telecom
                    </span>
                    <span className="text-xs text-blue-200 font-medium tracking-wider">
                      S.A. DE C.V. · Conectividad Escolar
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-extrabold leading-[1.18] tracking-tight max-w-xl mb-6">
                  Sistema de Gestión de Servicios de Internet
                </h1>
                <p className="text-blue-100 text-base sm:text-lg leading-relaxed max-w-lg mb-9 opacity-90 font-normal">
                  Plataforma centralizada para la administracion y seguimiento de conectividad en instituciones educativas del Estado de Mexico.
                </p>

                <ul className="space-y-4 mb-12">
                  {[
                    'Gestion de instituciones educativas',
                    'Seguimiento de incidencias en tiempo real',
                    'Solicitudes de nuevas conexiones',
                    'Reportes y estadisticas del servicio',
                  ].map((t) => (
                    <li key={t} className="flex items-center space-x-3 text-sm sm:text-base font-normal text-white">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-700/60 border border-blue-400/40 text-blue-200 shrink-0 shadow-sm">
                        <svg className="w-3.5 h-3.5 stroke-current" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </span>
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full max-w-lg h-[1px] bg-blue-400/25 mb-8"></div>

              <div className="grid grid-cols-3 max-w-lg gap-6 pt-2">
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">248</div>
                  <div className="text-xs sm:text-sm text-blue-200/80 mt-1 font-normal">Instituciones</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">6</div>
                  <div className="text-xs sm:text-sm text-blue-200/80 mt-1 font-normal">Municipios</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">231</div>
                  <div className="text-xs sm:text-sm text-blue-200/80 mt-1 font-normal">Servicios activos</div>
                </div>
              </div>
            </section>

            {/* RIGHT */}
            <section className="w-full lg:w-[560px] shrink-0">
              <div className="bg-white rounded-[26px] shadow-2xl overflow-hidden flex flex-col justify-between border border-white/20">

                {/* Tabs */}
                <div className="grid grid-cols-2 border-b border-gray-100" role="tablist">
                  <button
                    aria-selected={tab === 'login'}
                    role="tab"
                    type="button"
                    onClick={() => { setTab('login'); setError(null); setOk(null) }}
                    className={`py-4 text-center text-sm sm:text-base transition-colors focus:outline-none ${
                      tab === 'login'
                        ? 'font-bold text-blue-600 border-b-[2.5px] border-blue-600'
                        : 'font-medium text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Iniciar sesion
                  </button>
                  <button
                    aria-selected={tab === 'solicitud'}
                    role="tab"
                    type="button"
                    onClick={() => { setTab('solicitud'); setError(null); setOk(null) }}
                    className={`py-4 text-center text-sm sm:text-base transition-colors focus:outline-none ${
                      tab === 'solicitud'
                        ? 'font-bold text-blue-600 border-b-[2.5px] border-blue-600'
                        : 'font-medium text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Registro de institucion
                  </button>
                </div>

                {/* Form Area */}
                <div className="px-8 sm:px-12 pt-10 pb-10">
                  {tab === 'login' ? (
                    <>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Bienvenido
                      </h2>
                      <p className="text-gray-500 text-sm sm:text-base mb-8">
                        Ingrese sus credenciales para acceder al sistema
                      </p>

                      {error && (
                        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {error}
                        </div>
                      )}

                      <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-gray-800 mb-2" htmlFor="email">
                            Correo electronico
                          </label>
                          <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@gpon.mx"
                            className="w-full px-4 py-3 text-gray-600 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition duration-150 text-sm sm:text-base shadow-sm"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-semibold text-gray-800" htmlFor="password">
                              Contrasena
                            </label>
                            <Link href="/recuperar-password" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                              ¿Olvidaste tu contraseña?
                            </Link>
                          </div>
                          <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition duration-150 text-sm sm:text-base shadow-sm tracking-widest"
                          />
                        </div>

                        <div className="pt-2">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1848bb] hover:bg-[#133aa0] active:bg-[#0f2f82] disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-xl transition duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 text-center text-base"
                          >
                            {loading ? 'Ingresando...' : 'Acceder al sistema'}
                          </button>
                        </div>
                      </form>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Solicita tu acceso
                      </h2>
                      <p className="text-gray-500 text-sm sm:text-base mb-6">
                        Llena el formulario. Un administrador revisara tu solicitud y te enviaremos las credenciales por correo.
                      </p>

                      {error && (
                        <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {error}
                        </div>
                      )}
                      {ok && (
                        <div className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                          {ok}
                        </div>
                      )}

                      <form onSubmit={handleSolicitud} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-800 mb-1">
                            Nombre de la institucion *
                          </label>
                          <input
                            type="text"
                            required
                            value={solNombre}
                            onChange={(e) => setSolNombre(e.target.value)}
                            placeholder="Escuela Primaria Benito Juarez"
                            className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">
                              CCT *
                            </label>
                            <input
                              type="text"
                              required
                              value={solCCT}
                              onChange={(e) => setSolCCT(e.target.value.toUpperCase())}
                              placeholder="15DST0182J"
                              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">
                              Turno
                            </label>
                            <select
                              value={solTurno}
                              onChange={(e) => setSolTurno(e.target.value)}
                              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                            >
                              <option value="">—</option>
                              <option value="MATUTINO">Matutino</option>
                              <option value="VESPERTINO">Vespertino</option>
                              <option value="NOCTURNO">Nocturno</option>
                              <option value="MIXTO">Mixto</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-800 mb-1">
                            Correo electronico (aqui recibiras tus credenciales) *
                          </label>
                          <input
                            type="email"
                            required
                            value={solCorreo}
                            onChange={(e) => setSolCorreo(e.target.value)}
                            placeholder="escuela@ejemplo.com"
                            className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">
                              Director
                            </label>
                            <input
                              type="text"
                              value={solDirector}
                              onChange={(e) => setSolDirector(e.target.value)}
                              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">
                              Telefono
                            </label>
                            <input
                              type="tel"
                              value={solTelefono}
                              onChange={(e) => setSolTelefono(e.target.value)}
                              placeholder="7121234567"
                              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-800 mb-1">
                            Domicilio
                          </label>
                          <input
                            type="text"
                            value={solDomicilio}
                            onChange={(e) => setSolDomicilio(e.target.value)}
                            className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">
                              Matricula
                            </label>
                            <input
                              type="number"
                              value={solMatricula}
                              onChange={(e) => setSolMatricula(e.target.value)}
                              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">
                              Año de ejecucion
                            </label>
                            <input
                              type="number"
                              value={solAñoEjecucion}
                              onChange={(e) => setSolAñoEjecucion(e.target.value)}
                              placeholder="2026"
                              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">
                              Presidente de asociacion
                            </label>
                            <input
                              type="text"
                              value={solPresidente}
                              onChange={(e) => setSolPresidente(e.target.value)}
                              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">
                              Telefono asociacion
                            </label>
                            <input
                              type="tel"
                              value={solTelefonoAsoc}
                              onChange={(e) => setSolTelefonoAsoc(e.target.value)}
                              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">
                              Ciclo escolar
                            </label>
                            <input
                              type="text"
                              value={solCiclo}
                              onChange={(e) => setSolCiclo(e.target.value)}
                              placeholder="2025-2026"
                              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-800 mb-1">
                              Zona escolar
                            </label>
                            <input
                              type="text"
                              value={solZona}
                              onChange={(e) => setSolZona(e.target.value)}
                              className="w-full px-3 py-2 text-gray-700 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none text-sm"
                            />
                          </div>
                        </div>

                        <div className="pt-2 sticky bottom-0 bg-white pt-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1848bb] hover:bg-[#133aa0] active:bg-[#0f2f82] disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-xl transition duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 text-center text-base"
                          >
                            {loading ? 'Enviando...' : 'Enviar solicitud'}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </main>

        <aside aria-label="Ayuda" className="fixed bottom-4 right-4 z-30">
          <button
            aria-label="Ayuda y soporte"
            type="button"
            className="w-9 h-9 rounded-full bg-white text-gray-700 shadow-lg border border-gray-100 flex items-center justify-center font-bold text-sm hover:bg-gray-50 transition transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ?
          </button>
        </aside>
      </div>
    </>
  )
}