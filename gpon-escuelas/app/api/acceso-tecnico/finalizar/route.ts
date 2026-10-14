import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function formatearDuracion(minutos: number): string {
  if (minutos < 1) return 'Menos de 1 minuto'
  if (minutos < 60) return `${minutos} min`
  const hrs = Math.floor(minutos / 60)
  const mins = minutos % 60
  return mins > 0 ? `${hrs} h ${mins} min` : `${hrs} h`
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
      .select('id, full_name, email, role')
      .eq('id', user.id)
      .single()

    if (!perfil || !['tecnico', 'admin'].includes(perfil.role)) {
      return NextResponse.json(
        { error: 'Solo personal técnico o administradores pueden registrar la conclusión de la visita.' },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const ticketId = body.ticket_id ? Number(body.ticket_id) : null
    const solucion = body.solucion ? String(body.solucion).trim() : ''
    const recibidoPor = body.recibido_por ? String(body.recibido_por).trim() : ''

    if (!ticketId) {
      return NextResponse.json({ error: 'Falta el ID del ticket.' }, { status: 400 })
    }

    if (!solucion) {
      return NextResponse.json({ error: 'Por favor ingresa la solución o trabajo técnico realizado.' }, { status: 400 })
    }

    const now = new Date()
    const nowIso = now.toISOString()
    const horaSalida = now.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

    // Obtener ticket actual
    const { data: ticketActual, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select(`
        *,
        institucion:instituciones (id, nombre, cct)
      `)
      .eq('id', ticketId)
      .single()

    if (ticketError || !ticketActual) {
      return NextResponse.json({ error: 'Ticket no encontrado.' }, { status: 404 })
    }

    // Buscar código de acceso correspondiente a la visita
    const { data: paseActivo } = await supabaseAdmin
      .from('codigos_acceso_tecnico')
      .select('*')
      .or(`ticket_id.eq.${ticketId},institucion_id.eq.${ticketActual.institucion_id}`)
      .eq('estado', 'validado')
      .order('validado_en', { ascending: false })
      .limit(1)
      .maybeSingle()

    let tiempoTexto = 'No registrado'
    let horaLlegada = ''

    if (paseActivo && paseActivo.validado_en) {
      const llegada = new Date(paseActivo.validado_en)
      horaLlegada = llegada.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
      const diffMs = now.getTime() - llegada.getTime()
      const diffMins = Math.max(1, Math.round(diffMs / (1000 * 60)))
      tiempoTexto = formatearDuracion(diffMins)

      // Marcar pase como finalizado con bitácora de salida
      const notaSalida = `Salida: ${horaSalida} hrs | Tiempo en sitio: ${tiempoTexto} | Recibió: ${recibidoPor || 'Personal plantel'}`
      await supabaseAdmin
        .from('codigos_acceso_tecnico')
        .update({
          estado: 'finalizado',
          notas: paseActivo.notas ? `${paseActivo.notas} | ${notaSalida}` : notaSalida,
          updated_at: nowIso,
        })
        .eq('id', paseActivo.id)
    }

    const tecnicoNombre = perfil.full_name || perfil.email || 'Técnico GPON'

    // Actualizar ticket a 'resuelto'
    const { data: ticketResuelto, error: updError } = await supabaseAdmin
      .from('tickets')
      .update({
        estado: 'resuelto',
        cuadrilla: ticketActual.cuadrilla || tecnicoNombre,
        resuelto_en: nowIso,
        updated_at: nowIso,
      })
      .eq('id', ticketId)
      .select('*')
      .single()

    if (updError) {
      console.error('Error al resolver ticket:', updError)
      return NextResponse.json({ error: updError.message }, { status: 500 })
    }

    // Registrar bitácora detallada de check-out en ticket_comentarios
    const contenidoBitacora = [
      `🏁 VISITA TÉCNICA CONCLUIDA (CHECK-OUT)`,
      `• Hora de salida: ${horaSalida} hrs`,
      horaLlegada ? `• Hora de entrada: ${horaLlegada} hrs` : null,
      tiempoTexto !== 'No registrado' ? `• Tiempo laborado en sitio: ${tiempoTexto}` : null,
      `• Técnico: ${tecnicoNombre}`,
      `• Trabajo realizado / Solución: ${solucion}`,
      recibidoPor ? `• Recibido de conformidad por: ${recibidoPor}` : null,
      `• Estado del servicio: RESTABLECIDO Y VERIFICADO`,
    ]
      .filter(Boolean)
      .join('\n')

    try {
      await supabaseAdmin.from('ticket_comentarios').insert([
        {
          ticket_id: ticketId,
          autor_id: user.id,
          autor_rol: perfil.role,
          contenido: contenidoBitacora,
          es_interno: false,
        },
      ])
    } catch (e) {
      console.error('Error registrando comentario de check-out:', e)
    }

    return NextResponse.json({
      ok: true,
      mensaje: '¡Visita técnica concluida con éxito! Servicio marcado como resuelto.',
      ticket: ticketResuelto,
      horaSalida,
      tiempoEnSitio: tiempoTexto,
    })
  } catch (err: any) {
    console.error('Error inesperado finalizando visita:', err)
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}

