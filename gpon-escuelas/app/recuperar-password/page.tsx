'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(null)
    setLoading(true)

    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/update-password`
          : undefined

      const res = await fetch('/api/recuperar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          redirectTo,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error || 'No se pudo procesar la solicitud.')
      }

      setOk(
        'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.'
      )
      setEmail('')
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar el correo de recuperación.')
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
                  Recuperar contraseña
                </h1>
                <p className="text-gray-500 text-sm mb-8 text-center">
                  Ingresa tu correo electrónico y te enviaremos un enlace para crear una nueva contraseña.
                </p>

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
                    <label className="block text-sm font-semibold text-gray-800 mb-2" htmlFor="email">
                      Correo electrónico
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="usuario@gpon.mx"
                      className="w-full px-4 py-3 text-gray-700 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none transition duration-150 text-sm shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#1848bb] hover:bg-[#133aa0] active:bg-[#0f2f82] disabled:opacity-60 text-white font-bold py-3.5 px-6 rounded-xl transition duration-150 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 text-center text-base"
                  >
                    {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                  </button>
                </form>

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