import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function generarCodigoAleatorio(): string {
  // Generar número de 6 dígitos (100000 - 999999)
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: Request) {
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

    const body = await request.json().catch(() => ({}))
    let institucionId = body.institucion_id ? Number(body.institucion_id) : null
    const ticketId = body.ticket_id ? Number(body.ticket_id) : null

    // Si es escuela, obtener su institución
    if (!institucionId && perfil?.role === 'escuela') {
      const { data: inst } = await supabaseAdmin
        .from('instituciones')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (inst) institucionId = inst.id
    }

    // Si viene ticketId pero no institucionId, obtenerlo del ticket
    if (!institucionId && ticketId) {
      const { data: tck } = await supabaseAdmin
        .from('tickets')
        .select('institucion_id')
        .eq('id', ticketId)
        .maybeSingle()

      if (tck && tck.institucion_id) institucionId = tck.institucion_id
    }

    if (!institucionId) {
      return NextResponse.json(
        { error: 'No se encontró la institución vinculada para generar el código.' },
        { status: 400 }
      )
    }

    // Cancelar códigos anteriores pendientes para este ticket o institución
    if (ticketId) {
      await supabaseAdmin
        .from('codigos_acceso_tecnico')
        .update({ estado: 'cancelado' })
        .eq('ticket_id', ticketId)
        .eq('estado', 'pendiente')
    } else {
      await supabaseAdmin
        .from('codigos_acceso_tecnico')
        .update({ estado: 'cancelado' })
        .eq('institucion_id', institucionId)
        .is('ticket_id', null)
        .eq('estado', 'pendiente')
    }

    // Generar nuevo código de 6 dígitos único
    let codigo = generarCodigoAleatorio()
    let intentos = 0
    while (intentos < 5) {
      const { data: existente } = await supabaseAdmin
        .from('codigos_acceso_tecnico')
        .select('id')
        .eq('codigo', codigo)
        .eq('estado', 'pendiente')
        .maybeSingle()

      if (!existente) break
      codigo = generarCodigoAleatorio()
      intentos++
    }

    // Vigencia: 12 horas desde ahora
    const expiraEn = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()

    const { data: nuevoCodigo, error: insertError } = await supabaseAdmin
      .from('codigos_acceso_tecnico')
      .insert([
        {
          codigo,
          institucion_id: institucionId,
          ticket_id: ticketId,
          creado_por: user.id,
          estado: 'pendiente',
          expira_en: expiraEn,
        },
      ])
      .select(`
        *,
        institucion:instituciones (id, nombre, cct),
        ticket:tickets (id, folio, titulo)
      `)
      .single()

    if (insertError) {
      console.error('Error insertando código de acceso:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      codigo: nuevoCodigo,
    })
  } catch (err: any) {
    console.error('Error inesperado en generar codigo acceso:', err)
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}

