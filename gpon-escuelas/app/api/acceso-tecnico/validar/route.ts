import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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
      .select('*')
      .eq('id', user.id)
      .single()

    if (!perfil || !['tecnico', 'admin'].includes(perfil.role)) {
      return NextResponse.json(
        { error: 'Solo personal técnico o administradores pueden validar códigos de acceso escolar.' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const rawCodigo = body.codigo ? String(body.codigo).trim() : ''

    // Limpiar código: quitar espacios y guiones
    const codigoLimpio = rawCodigo.replace(/[-\s]/g, '')

    if (!codigoLimpio || codigoLimpio.length < 6) {
      return NextResponse.json(
        { error: 'Por favor ingresa un código de 6 dígitos válido.' },
        { status: 400 }
      )
    }

    // Buscar código pendiente y no expirado
    const nowIso = new Date().toISOString()
    const { data: registro, error: searchError } = await supabaseAdmin
      .from('codigos_acceso_tecnico')
      .select(`
        *,
        institucion:instituciones (*),
        ticket:tickets (*)
      `)
      .eq('codigo', codigoLimpio)
      .eq('estado', 'pendiente')
      .gt('expira_en', nowIso)
      .maybeSingle()

    if (searchError) {
      console.error('Error buscando código:', searchError)
      return NextResponse.json({ error: searchError.message }, { status: 500 })
    }

    if (!registro) {
      // Verificar si ya fue utilizado antes
      const { data: yaUsado } = await supabaseAdmin
        .from('codigos_acceso_tecnico')
        .select(`
          *,
          institucion:instituciones (*),
          ticket:tickets (*)
        `)
        .eq('codigo', codigoLimpio)
        .maybeSingle()

      if (yaUsado && yaUsado.estado === 'validado') {
        const horaVal = yaUsado.validado_en
          ? new Date(yaUsado.validado_en).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
          : ''

        return NextResponse.json({
          ok: true,
          mensaje: `Este acceso ya se encuentra validado y activo para ${yaUsado.tecnico_nombre || 'el técnico'}${horaVal ? ` desde las ${horaVal} hrs` : ''}.`,
          codigo: yaUsado,
          institucion: yaUsado.institucion,
          ticket: yaUsado.ticket,
          yaEstabaValidado: true,
        })
      }

      return NextResponse.json(
        { error: 'Código inválido o expirado. Solicita a la escuela que genere un código de acceso nuevo.' },
        { status: 400 }
      )
    }

    const tecnicoNombre = perfil.full_name || perfil.email || 'Técnico GPON'

    // Actualizar código a 'validado'
    const { data: codigoActualizado, error: updateError } = await supabaseAdmin
      .from('codigos_acceso_tecnico')
      .update({
        estado: 'validado',
        tecnico_id: user.id,
        tecnico_nombre: tecnicoNombre,
        validado_en: nowIso,
        updated_at: nowIso,
      })
      .eq('id', registro.id)
      .select(`
        *,
        institucion:instituciones (*),
        ticket:tickets (*)
      `)
      .single()

    if (updateError) {
      console.error('Error actualizando código:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Determinar qué ticket actualizar
    let ticketIdParaActualizar = registro.ticket_id

    // Si el pase no tenía ticket asignado, buscar el ticket activo más reciente del plantel
    if (!ticketIdParaActualizar && registro.institucion_id) {
      const { data: ticketActivo } = await supabaseAdmin
        .from('tickets')
        .select('id, folio, titulo')
        .eq('institucion_id', registro.institucion_id)
        .in('estado', ['abierto', 'programado', 'en_camino', 'en_revision'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (ticketActivo) {
        ticketIdParaActualizar = ticketActivo.id
        // Vincular el ticket al registro del pase
        await supabaseAdmin
          .from('codigos_acceso_tecnico')
          .update({ ticket_id: ticketActivo.id })
          .eq('id', registro.id)
      }
    }

    let ticketFinal = registro.ticket

    // Si hay un ticket (específico o activo), pasarlo a 'en_proceso' con cuadrilla y bitácora
    if (ticketIdParaActualizar) {
      const { data: ticketUpd, error: errUpdateTicket } = await supabaseAdmin
        .from('tickets')
        .update({
          estado: 'en_proceso',
          cuadrilla: tecnicoNombre,
          updated_at: nowIso,
        })
        .eq('id', ticketIdParaActualizar)
        .select('*')
        .single()

      if (!errUpdateTicket && ticketUpd) {
        ticketFinal = ticketUpd
      }

      // Registrar auditoría en ticket_comentarios
      try {
        await supabaseAdmin
          .from('ticket_comentarios')
          .insert([
            {
              ticket_id: ticketIdParaActualizar,
              autor_id: user.id,
              autor_rol: perfil.role,
              contenido: `Acceso al plantel validado con código de seguridad OTP (${codigoLimpio.slice(0, 3)}-${codigoLimpio.slice(3)}). El técnico ${tecnicoNombre} se encuentra en sitio atendiendo el reporte.`,
              es_interno: false,
            },
          ])
      } catch (e) {
        console.error('Error insertando en ticket_comentarios:', e)
      }
    }

    return NextResponse.json({
      ok: true,
      mensaje: `¡Acceso concedido! Bienvenido al plantel ${registro.institucion?.nombre || ''}.`,
      codigo: codigoActualizado,
      institucion: registro.institucion,
      ticket: ticketFinal,
    })
  } catch (err: any) {
    console.error('Error inesperado validando código:', err)
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}
