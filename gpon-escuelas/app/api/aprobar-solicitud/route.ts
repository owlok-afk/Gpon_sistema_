import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { enviarCredenciales } from '@/lib/email'

function generarPasswordTemporal(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const numeros = '23456789'
  const simbolos = '!@#$%'
  let pwd = ''
  for (let i = 0; i < 4; i++) pwd += letras[Math.floor(Math.random() * letras.length)]
  for (let i = 0; i < 3; i++) pwd += numeros[Math.floor(Math.random() * numeros.length)]
  for (let i = 0; i < 3; i++) pwd += letras[Math.floor(Math.random() * letras.length)].toLowerCase()
  pwd += simbolos[Math.floor(Math.random() * simbolos.length)]
  pwd += numeros[Math.floor(Math.random() * numeros.length)]
  return pwd
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

    const { data: perfil } = await supabaseUser
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (perfil?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo un administrador puede aprobar solicitudes.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { solicitudId, nota } = body

    if (!solicitudId) {
      return NextResponse.json({ error: 'Falta solicitudId' }, { status: 400 })
    }

    const { data: solicitud, error: errSol } = await supabaseAdmin
      .from('solicitudes')
      .select('*')
      .eq('id', solicitudId)
      .single()

    if (errSol || !solicitud) {
      return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
    }

    if (solicitud.estado !== 'pendiente') {
      return NextResponse.json(
        { error: `Esta solicitud ya fue ${solicitud.estado}.` },
        { status: 400 }
      )
    }

    const { data: usuariosExistentes } = await supabaseAdmin.auth.admin.listUsers()
    const yaExiste = usuariosExistentes?.users?.find(
      (u) => u.email?.toLowerCase() === solicitud.correo.toLowerCase()
    )

    if (yaExiste) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese correo en el sistema.' },
        { status: 400 }
      )
    }

    const passwordTemporal = generarPasswordTemporal()

    const { data: authData, error: errAuth } = await supabaseAdmin.auth.admin.createUser({
      email: solicitud.correo,
      password: passwordTemporal,
      email_confirm: true,
      user_metadata: {
        full_name: solicitud.director || solicitud.nombre_institucion,
        role: 'escuela',
      },
    })

    if (errAuth) {
      console.error('[aprobar] Error creando usuario:', errAuth)
      return NextResponse.json(
        { error: 'Error al crear el usuario: ' + errAuth.message },
        { status: 500 }
      )
    }

    const nuevoUserId = authData.user.id

    const { data: perfilExistente } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', nuevoUserId)
      .single()

    if (!perfilExistente) {
      await supabaseAdmin.from('profiles').insert({
        id: nuevoUserId,
        email: solicitud.correo,
        full_name: solicitud.director || solicitud.nombre_institucion,
        role: 'escuela',
      })
    }

    const cctNormalizado = (solicitud.cct || '').toUpperCase().trim()

    const { data: instExistente } = await supabaseAdmin
      .from('instituciones')
      .select('*')
      .eq('cct', cctNormalizado)
      .maybeSingle()

    let institucionId: number

    if (instExistente) {
      const { error: errUpd } = await supabaseAdmin
        .from('instituciones')
        .update({
          profile_id: nuevoUserId,
          estado_vinculacion: 'vinculada',
          fecha_solicitud: solicitud.created_at,
          fecha_vinculacion: new Date().toISOString(),
        })
        .eq('id', instExistente.id)

      if (errUpd) {
        console.error('[aprobar] Error actualizando institución:', errUpd)
      }
      institucionId = instExistente.id
    } else {
      const { data: instNueva, error: errIns } = await supabaseAdmin
        .from('instituciones')
        .insert({
          nombre: solicitud.nombre_institucion,
          domicilio: solicitud.domicilio,
          matricula: solicitud.matricula,
          cct: cctNormalizado,
          director: solicitud.director,
          telefono: solicitud.telefono,
          correo: solicitud.correo,
          año_ejecucion: solicitud.año_ejecucion,
          presidente_asociacion: solicitud.presidente_asociacion,
          telefono_asociacion: solicitud.telefono_asociacion,
          ciclo_escolar: solicitud.ciclo_escolar,
          zona_escolar: solicitud.zona_escolar,
          turno: solicitud.turno,
          profile_id: nuevoUserId,
          estado_vinculacion: 'vinculada',
          fecha_solicitud: solicitud.created_at,
          fecha_vinculacion: new Date().toISOString(),
        })
        .select()
        .single()

      if (errIns) {
        console.error('[aprobar] Error creando institución:', errIns)
        await supabaseAdmin.auth.admin.deleteUser(nuevoUserId)
        return NextResponse.json(
          { error: 'Error al crear la institución: ' + errIns.message },
          { status: 500 }
        )
      }
      institucionId = instNueva.id
    }

    await supabaseAdmin
      .from('solicitudes')
      .update({
        estado: 'aprobada',
        notas_admin: nota || null,
        aprobada_por: user.id,
        aprobada_en: new Date().toISOString(),
        institucion_id: institucionId,
        profile_id_creado: nuevoUserId,
      })
      .eq('id', solicitudId)

    try {
      await enviarCredenciales({
        destinatario: solicitud.correo,
        nombreInstitucion: solicitud.nombre_institucion,
        correoAcceso: solicitud.correo,
        passwordTemporal,
      })
    } catch (errCorreo) {
      console.error('[aprobar] Error enviando correo:', errCorreo)
      return NextResponse.json({
        ok: true,
        aviso:
          'La solicitud fue aprobada, pero no se pudo enviar el correo. Revisa la configuración SMTP.',
        passwordTemporal,
        institucionId,
      })
    }

    return NextResponse.json({
      ok: true,
      passwordTemporal,
      institucionId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    console.error('[aprobar] Error general:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}