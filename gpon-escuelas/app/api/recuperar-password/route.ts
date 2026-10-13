import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { enviarRecuperacion } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, redirectTo } = body as {
      email?: string
      redirectTo?: string
    }

    if (!email || !email.trim()) {
      return NextResponse.json(
        { error: 'El correo electrónico es obligatorio.' },
        { status: 400 }
      )
    }

    const correo = email.trim().toLowerCase()

    // 1. Buscar el perfil para personalizar el correo
    const { data: perfil } = await supabaseAdmin
      .from('profiles')
      .select('full_name, email')
      .eq('email', correo)
      .maybeSingle()

    // 2. Generar el enlace de recuperación con Supabase
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: correo,
        options: {
          redirectTo: redirectTo || undefined,
        },
      })

    // Si el correo no existe, Supabase devuelve error.
    // Por seguridad, respondemos OK igual para no revelar qué correos existen.
    if (linkError || !linkData) {
      console.warn(
        '[recuperar-password] No se generó enlace:',
        linkError?.message || 'sin data'
      )
      return NextResponse.json({ ok: true })
    }

    const enlace = linkData.properties?.action_link
    if (!enlace) {
      console.warn('[recuperar-password] generateLink no devolvió action_link')
      return NextResponse.json({ ok: true })
    }

    // 3. Enviar por Gmail con la plantilla unificada
    try {
      await enviarRecuperacion({
        destinatario: correo,
        nombreUsuario:
          perfil?.full_name?.trim() ||
          correo.split('@')[0] ||
          'Usuario',
        enlaceRecuperacion: enlace,
      })
    } catch (errCorreo) {
      console.error(
        '[recuperar-password] Error enviando correo con Gmail:',
        errCorreo
      )
      return NextResponse.json(
        {
          error:
            'No se pudo enviar el correo de recuperación. Intenta de nuevo más tarde.',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error interno del servidor'
    console.error('[recuperar-password] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}