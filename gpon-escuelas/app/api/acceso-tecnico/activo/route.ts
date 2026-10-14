import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
}

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

    if (!institucionId && !ticketId) {
      return NextResponse.json({ codigo: null, ok: true })
    }

    // Buscar el código más reciente de la institución que esté pendiente o validado en las últimas 24 hrs
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
      // Buscar primero por ticket, y si no, por institucion
      const { data: dataTicket } = await supabaseAdmin
        .from('codigos_acceso_tecnico')
        .select(`
          *,
          institucion:instituciones (id, nombre, cct),
          ticket:tickets (id, folio, titulo)
        `)
        .eq('ticket_id', ticketId)
        .in('estado', ['pendiente', 'validado', 'finalizado'])
        .order('created_at', { ascending: false })
        .limit(1)

      if (dataTicket && dataTicket.length > 0) {
        return NextResponse.json({ codigo: dataTicket[0], ok: true }, { headers: NO_CACHE_HEADERS })
      }
    }

    if (institucionId) {
      query = query
        .eq('institucion_id', institucionId)
        .in('estado', ['pendiente', 'validado', 'finalizado'])
    }

    const { data, error } = await query

    if (error) {
      console.error('Error buscando código activo:', error)
      return NextResponse.json({ error: error.message }, { status: 500, headers: NO_CACHE_HEADERS })
    }

    const codigo = data && data.length > 0 ? data[0] : null

    return NextResponse.json(
      {
        codigo,
        ok: true,
      },
      { headers: NO_CACHE_HEADERS }
    )
  } catch (err: any) {
    console.error('Error en GET /api/acceso-tecnico/activo:', err)
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500, headers: NO_CACHE_HEADERS })
  }
}
