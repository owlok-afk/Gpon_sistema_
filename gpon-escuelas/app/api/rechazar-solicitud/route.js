// app/api/rechazar-solicitud/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { enviarRechazo } from '@/lib/email'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabaseUser = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseUser.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: perfil } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (perfil?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo un administrador puede rechazar solicitudes.' },
        { status: 403 }
      )
    }

    const { solicitudId, nota } = await request.json()
    if (!solicitudId) {
      return NextResponse.json({ error: 'Falta solicitudId' }, { status: 400 })
    }

    const { data: solicitud } = await supabaseAdmin
      .from('solicitudes')
      .select('*')
      .eq('id', solicitudId)
      .single()

    if (!solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (solicitud.estado !== 'pendiente') {
      return NextResponse.json(
        { error: `Esta solicitud ya fue ${solicitud.estado}.` },
        { status: 400 }
      )
    }

    await supabaseAdmin
      .from('solicitudes')
      .update({
        estado: 'rechazada',
        notas_admin: nota || null,
        aprobada_por: user.id,
        rechazada_en: new Date().toISOString(),
      })
      .eq('id', solicitudId)

    // Correo de rechazo (no bloqueante)
    try {
      await enviarRechazo({
        destinatario: solicitud.correo,
        nombreInstitucion: solicitud.nombre_institucion,
        motivo: nota,
      })
    } catch (errCorreo) {
      console.error('[rechazar] Error enviando correo:', errCorreo)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[rechazar] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno' },
      { status: 500 }
    )
  }
}