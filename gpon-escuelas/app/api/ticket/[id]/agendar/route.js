// app/api/ticket/[id]/agendar/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const incidenciaId = parseInt(id, 10)
    if (isNaN(incidenciaId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: perfil } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!perfil || !['admin', 'tecnico'].includes(perfil.role)) {
      return NextResponse.json(
        { error: 'Solo admin o técnico pueden agendar mantenimientos.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { titulo, descripcion, programado_para, cuadrilla } = body

    if (!titulo || titulo.trim() === '') {
      return NextResponse.json({ error: 'El título es obligatorio.' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('agendar_mantenimiento', {
      p_incidencia_id: incidenciaId,
      p_titulo: titulo,
      p_descripcion: descripcion || null,
      p_programado_para: programado_para || null,
      p_cuadrilla: cuadrilla || null,
    })

    if (error) {
      console.error('[api/ticket agendar] Error RPC:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Comentario automático en la incidencia origen
    await supabase.from('ticket_comentarios').insert({
      ticket_id: incidenciaId,
      autor_id: user.id,
      autor_rol: perfil.role,
      contenido: `Mantenimiento agendado: ${data.folio}`,
      es_interno: true,
    })

    return NextResponse.json({ ok: true, mantenimiento: data }, { status: 201 })
  } catch (err) {
    console.error('[api/ticket agendar] Error:', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}