import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ticketId = parseInt(id, 10)
    if (isNaN(ticketId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }

    const supabase = await getSupabaseServer()

    const {
      data: { user },
    } = await supabase.auth.getUser()
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
    const message = err instanceof Error ? err.message : 'Error interno'
    console.error('[api/ticket comentario] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}