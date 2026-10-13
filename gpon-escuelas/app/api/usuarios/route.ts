import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// GET: Listar todos los usuarios/perfiles (solo admin)
export async function GET() {
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
        { error: 'Solo un administrador puede ver la lista de usuarios.' },
        { status: 403 }
      )
    }

    const [profilesRes, instRes] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('instituciones')
        .select('id, nombre, cct, domicilio, director, telefono, estado_vinculacion, profile_id')
        .order('nombre', { ascending: true }),
    ])

    if (profilesRes.error) {
      console.error('[usuarios] Error al obtener usuarios:', profilesRes.error)
      return NextResponse.json({ error: profilesRes.error.message }, { status: 500 })
    }

    const instituciones = instRes.data || []
    const profilesWithInst = (profilesRes.data || []).map((p) => {
      const inst = instituciones.find((i) => i.profile_id === p.id)
      return {
        ...p,
        institucion: inst || null,
      }
    })

    return NextResponse.json({
      ok: true,
      data: profilesWithInst,
      institucionesDisponibles: instituciones,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor'
    console.error('[usuarios GET]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST: Crear nuevo usuario (auth + profile) (solo admin)
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
        { error: 'Solo un administrador puede crear nuevos usuarios.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      email,
      password,
      full_name,
      role,
      telefono,
      activo,
      // Datos específicos de escuela:
      tipoEscuela, // 'existente' | 'nueva'
      institucionId,
      nuevaEscuelaNombre,
      nuevaEscuelaCCT,
      nuevaEscuelaDomicilio,
      nuevaEscuelaDirector,
      nuevaEscuelaTurno,
      nuevaEscuelaMatricula,
      nuevaEscuelaCiclo,
      nuevaEscuelaTelefono,
      // Datos específicos de técnico:
      cuadrilla,
      especialidad,
    } = body

    if (!email || !email.trim()) {
      return NextResponse.json({ error: 'El correo electrónico es obligatorio.' }, { status: 400 })
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      )
    }

    const correoNormalizado = email.trim().toLowerCase()
    const nombreNormalizado = (full_name || '').trim() || correoNormalizado.split('@')[0]
    const rolValido = ['admin', 'tecnico', 'escuela'].includes(role) ? role : 'escuela'

    // Validaciones específicas para escuela
    if (rolValido === 'escuela') {
      if (tipoEscuela === 'existente' && !institucionId) {
        return NextResponse.json(
          { error: 'Debes seleccionar una institución educativa existente para vincular este usuario.' },
          { status: 400 }
        )
      }
      if (tipoEscuela === 'nueva' && (!nuevaEscuelaNombre || !nuevaEscuelaCCT)) {
        return NextResponse.json(
          { error: 'El nombre de la escuela y la Clave CCT son obligatorios para registrar una nueva institución.' },
          { status: 400 }
        )
      }
    }

    // Verificar si ya existe en auth
    const { data: listData } = await supabaseAdmin.auth.admin.listUsers()
    const yaExiste = listData?.users?.find(
      (u) => u.email?.toLowerCase() === correoNormalizado
    )

    if (yaExiste) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta con ese correo electrónico.' },
        { status: 400 }
      )
    }

    // Metadata según rol
    const userMeta: Record<string, unknown> = {
      full_name: nombreNormalizado,
      role: rolValido,
    }
    if (rolValido === 'tecnico' && (cuadrilla || especialidad)) {
      userMeta.cuadrilla = cuadrilla || null
      userMeta.especialidad = especialidad || null
    }

    // Crear en Supabase Auth
    const { data: authData, error: errAuth } = await supabaseAdmin.auth.admin.createUser({
      email: correoNormalizado,
      password: password,
      email_confirm: true,
      user_metadata: userMeta,
    })

    if (errAuth || !authData.user) {
      console.error('[usuarios POST] Error creando en auth:', errAuth)
      return NextResponse.json(
        { error: errAuth?.message || 'Error al crear la cuenta en el sistema de autenticación.' },
        { status: 400 }
      )
    }

    const nuevoUserId = authData.user.id

    // Upsert perfil
    const { data: nuevoPerfil, error: errProfile } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: nuevoUserId,
        email: correoNormalizado,
        full_name: nombreNormalizado,
        role: rolValido,
        telefono: telefono ? telefono.trim() : null,
        activo: activo !== false,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (errProfile) {
      console.error('[usuarios POST] Error creando perfil:', errProfile)
      await supabaseAdmin.auth.admin.deleteUser(nuevoUserId)
      return NextResponse.json(
        { error: 'Error al registrar el perfil del usuario: ' + errProfile.message },
        { status: 500 }
      )
    }

    // Vinculación / Creación en tabla instituciones si es Escuela
    let institucionVinculada = null
    if (rolValido === 'escuela') {
      if (tipoEscuela === 'existente' && institucionId) {
        const { data: updInst, error: errUpd } = await supabaseAdmin
          .from('instituciones')
          .update({
            profile_id: nuevoUserId,
            estado_vinculacion: 'vinculada',
            fecha_vinculacion: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', institucionId)
          .select()
          .single()

        if (!errUpd) {
          institucionVinculada = updInst
        }
      } else if (tipoEscuela === 'nueva' && nuevaEscuelaNombre) {
        const { data: insInst, error: errIns } = await supabaseAdmin
          .from('instituciones')
          .insert({
            nombre: nuevaEscuelaNombre.trim(),
            cct: nuevaEscuelaCCT ? nuevaEscuelaCCT.trim().toUpperCase() : null,
            domicilio: nuevaEscuelaDomicilio ? nuevaEscuelaDomicilio.trim() : null,
            director: nuevaEscuelaDirector ? nuevaEscuelaDirector.trim() : nombreNormalizado,
            turno: nuevaEscuelaTurno ? nuevaEscuelaTurno.trim() : null,
            matricula: nuevaEscuelaMatricula ? parseInt(nuevaEscuelaMatricula) : null,
            ciclo_escolar: nuevaEscuelaCiclo ? nuevaEscuelaCiclo.trim() : null,
            telefono: nuevaEscuelaTelefono ? nuevaEscuelaTelefono.trim() : (telefono ? telefono.trim() : null),
            correo: correoNormalizado,
            profile_id: nuevoUserId,
            estado_vinculacion: 'vinculada',
            fecha_vinculacion: new Date().toISOString(),
          })
          .select()
          .single()

        if (!errIns) {
          institucionVinculada = insInst
        }
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        ...nuevoPerfil,
        institucion: institucionVinculada,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor'
    console.error('[usuarios POST]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
