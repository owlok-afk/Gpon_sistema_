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

    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[usuarios] Error al obtener usuarios:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, data: profiles || [] })
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
    const { email, password, full_name, role, telefono, activo } = body

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

    // Crear en Supabase Auth
    const { data: authData, error: errAuth } = await supabaseAdmin.auth.admin.createUser({
      email: correoNormalizado,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: nombreNormalizado,
        role: rolValido,
      },
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
      // Si falla perfil, intentar limpiar auth user creado
      await supabaseAdmin.auth.admin.deleteUser(nuevoUserId)
      return NextResponse.json(
        { error: 'Error al registrar el perfil del usuario: ' + errProfile.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, data: nuevoPerfil })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor'
    console.error('[usuarios POST]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
