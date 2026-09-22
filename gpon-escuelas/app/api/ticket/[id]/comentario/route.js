// app/api/ticket/[id]/comentario/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request, { params }) {
  try {
    const { id } = await params
    const ticketId = parseInt(id, 10)
    if (isNaN(ticketId)) {
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

    if (!perfil) {
      return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 403 })
    }

    const body = await request.json()
    const { contenido, es_interno } = body

    if (!contenido || contenido.trim() === '') {
      return NextResponse.json({ error: 'El comentario no puede estar vacío.' }, { status: 400 })
    }

    // Solo admin/técnico pueden crear comentarios internos
    const internoFinal = perfil.role === 'escuela' ? false : !!es_interno

    const { data, error } = await supabase
      .from('ticket_comentarios')
      .insert({
        ticket_id: ticketId,
        autor_id: user.id,
        autor_rol: perfil.role,
        contenido: contenido.trim(),
        es_interno: internoFinal,
      })
      .select()
      .single()

    if (error) {
      console.error('[api/ticket comentario] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, comentario: data }, { status: 201 })
  } catch (err) {
    console.error('[api/ticket comentario] Error:', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}