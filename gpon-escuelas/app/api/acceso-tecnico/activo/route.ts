import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: Request) {
  try {
    const supabaseUser = await getSupabaseServer()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: perfil } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const url = new URL(request.url)
    const ticketIdParam = url.searchParams.get('ticket_id')
    const instIdParam = url.searchParams.get('institucion_id')

    let institucionId = instIdParam ? Number(instIdParam) : null
    const ticketId = ticketIdParam ? Number(ticketIdParam) : null

    if (!institucionId && perfil?.role === 'escuela') {
      const { data: inst } = await supabaseAdmin
        .from('instituciones')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (inst) institucionId = inst.id
    }

    if (!institucionId && ticketId) {
      const { data: tck } = await supabaseAdmin
        .from('tickets')
        .select('institucion_id')
        .eq('id', ticketId)
        .maybeSingle()

      if (tck && tck.institucion_id) institucionId = tck.institucion_id
    }

    let query = supabaseAdmin
      .from('codigos_acceso_tecnico')
      .select(`
        *,
        institucion:instituciones (id, nombre, cct),
        ticket:tickets (id, folio, titulo)
      `)
      .order('created_at', { ascending: false })
      .limit(1)

    if (ticketId) {
      query = query.eq('ticket_id', ticketId)
    } else if (institucionId) {
      query = query.eq('institucion_id', institucionId)
    } else {
      return NextResponse.json({ codigo: null, ok: true })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error buscando código activo:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const codigo = data && data.length > 0 ? data[0] : null

    return NextResponse.json({
      codigo,
      ok: true,
    })
  } catch (err: any) {
    console.error('Error en GET /api/acceso-tecnico/activo:', err)
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}

