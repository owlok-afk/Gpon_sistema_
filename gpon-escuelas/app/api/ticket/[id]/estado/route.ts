import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

const ESTADOS_VALIDOS = [
  'abierto',
  'en_revision',
  'programado',
  'en_camino',
  'en_proceso',
  'resuelto',
  'cancelado',
] as const

export async function PUT(
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

    if (!perfil || !['admin', 'tecnico'].includes(perfil.role)) {
      return NextResponse.json(
        { error: 'Solo admin o técnico pueden cambiar el estado.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { estado, cuadrilla, comentario } = body

    if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
      return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 })
    }

    const update: Record<string, unknown> = { estado }

    if (cuadrilla !== undefined) {
      update.cuadrilla = cuadrilla || null
    }

    if (estado === 'resuelto') {
      update.resuelto_en = new Date().toISOString()
    }

    const { data: ticketActual, error: errUpd } = await supabase
      .from('tickets')
      .update(update)
      .eq('id', ticketId)
      .select()
      .single()

    if (errUpd) {
      console.error('[api/ticket estado] Error update:', errUpd)
      return NextResponse.json({ error: errUpd.message }, { status: 400 })
    }

    if (comentario && comentario.trim() !== '') {
      await supabase.from('ticket_comentarios').insert({
        ticket_id: ticketId,
        autor_id: user.id,
        autor_rol: perfil.role,
        contenido: comentario.trim(),
        es_interno: false,
      })
    }

    await supabase.from('ticket_comentarios').insert({
      ticket_id: ticketId,
      autor_id: user.id,
      autor_rol: perfil.role,
      contenido: `Estado cambiado a "${estado}"`,
      es_interno: true,
    })

    return NextResponse.json({ ok: true, ticket: ticketActual })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    console.error('[api/ticket estado] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}