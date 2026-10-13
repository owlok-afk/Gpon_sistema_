'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  useEffect(() => {
    let cancel = false

    async function checkSession() {
      try {
        // Esperar a que Supabase procese el hash de la URL (recovery)
        const { data } = await supabase.auth.getSession()
        if (!cancel) {
          setHasSession(!!data.session)
          setChecking(false)
        }
      } catch {
        if (!cancel) {
          setHasSession(false)
          setChecking(false)
        }
      }
    }

    checkSession()

    // Escuchar cambios por si Supabase procesa la URL un poco después
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancel) setHasSession(!!session)
    })

    return () => {
      cancel = true
      sub.subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(null)

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error

      setOk('Contraseña actualizada correctamente. Redirigiendo al inicio de sesión...')
      setTimeout(async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
      }, 1800)
    } catch (err: any) {
      setError(err.message || 'No se pudo actualizar la contraseña.')
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

        <main className="min-h-screen flex items-center justify-center p-4 md:p-8 relative z-10">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-[26px] shadow-2xl overflow-hidden border border-white/20">
              <div className="px-8 sm:px-10 pt-10 pb-10">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-center shadow-sm">
                    <Image
                      src="/logo_gpon.png"
                      alt="GPON Telecom"
                      width={64}
                      height={64}
                      className="w-full h-full object-contain"
                      priority
                    />
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2 text-center">
                  Nueva contraseña
                </h1>
                <p className="text-gray-500 text-sm mb-8 text-center">
                  Define una contraseña segura para tu cuenta.
                </p>

                {checking && (
                  <div className="flex items-center justify-center py-10">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {!checking && !hasSession && (
                  <div className="text-center py-4">
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-3 mb-6">
                      El enlace es inválido o ya expiró. Solicita uno nuevo desde la pantalla de recuperación.
                    </div>
                    <Link
                      href="/recuperar-password"
                      className="inline-block px-5 py-2.5 bg-[#1848bb] hover:bg-[#133aa0] text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                      Solicitar nuevo enlace
                    </Link>
                  </div>
                )}

                {!checking && hasSession && (
                  <>
                    {error && (
                      <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {error}
                      </div>
                    )}
                    {ok && (
                      <div className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                        {ok}
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2" htmlFor="password">
                          Nueva contraseña
                        </label>
                        <input
                          id="password"
                          type="password"
                          required
                          minLength={6}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition duration-150 text-sm shadow-sm font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2" htmlFor="confirm">
                          Confirmar contraseña
                        </label>
                        <input
                          id="confirm"
                          type="password"
                          required
                          minLength={6}
                          value={confirm}
                          onChange={(e) => setConfirm(e.target.value)}
                          placeholder="Repite la contraseña"
                          className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition duration-150 text-sm shadow-sm font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#1848bb] hover:bg-[#133aa0] active:bg-[#0f2f82] disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-xl transition duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 text-center text-base"
                      >
                        {loading ? 'Actualizando...' : 'Actualizar contraseña'}
                      </button>
                    </form>
                  </>
                )}

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <Link
                    href="/login"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    ← Volver al inicio de sesión
                  </Link>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-blue-200/70 mt-6">
              GPON Telecom S.A. de C.V. — Soporte 24/7: 800-4766-NOC
            </p>
          </div>
        </main>
      </div>
    </>
  )
}