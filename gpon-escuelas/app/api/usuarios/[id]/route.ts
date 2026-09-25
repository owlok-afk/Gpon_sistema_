import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// PATCH / PUT: Actualizar usuario (rol, nombre, teléfono, activo, contraseña)
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 })
    }

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
        { error: 'Solo un administrador puede modificar usuarios.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { full_name, role, telefono, activo, password } = body

    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (full_name !== undefined) updateFields.full_name = full_name.trim()
    if (role !== undefined && ['admin', 'tecnico', 'escuela'].includes(role)) {
      updateFields.role = role
    }
    if (telefono !== undefined) {
      updateFields.telefono = telefono ? telefono.trim() : null
    }
    if (activo !== undefined) updateFields.activo = !!activo

    // Actualizar en tabla profiles
    const { data: updatedProfile, error: errUpdate } = await supabaseAdmin
      .from('profiles')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single()

    if (errUpdate) {
      console.error('[usuarios/[id] PATCH] Error actualizando perfil:', errUpdate)
      return NextResponse.json({ error: errUpdate.message }, { status: 500 })
    }

    // Actualizar metadata o contraseña en auth si aplica
    const authUpdatePayload: Record<string, unknown> = {}
    if (full_name !== undefined || role !== undefined) {
      authUpdatePayload.user_metadata = {
        full_name: updateFields.full_name ?? updatedProfile.full_name,
        role: updateFields.role ?? updatedProfile.role,
      }
    }
    if (password && password.trim().length >= 6) {
      authUpdatePayload.password = password.trim()
    }

    if (Object.keys(authUpdatePayload).length > 0) {
      const { error: errAuthUpd } = await supabaseAdmin.auth.admin.updateUserById(
        id,
        authUpdatePayload
      )
      if (errAuthUpd) {
        console.error('[usuarios/[id] PATCH] Error actualizando auth:', errAuthUpd)
      }
    }

    return NextResponse.json({ ok: true, data: updatedProfile })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor'
    console.error('[usuarios/[id] PATCH]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// DELETE: Eliminar usuario de Auth y de Profiles
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Falta ID de usuario' }, { status: 400 })
    }

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
        { error: 'Solo un administrador puede eliminar usuarios.' },
        { status: 403 }
      )
    }

    if (user.id === id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta de administrador.' },
        { status: 400 }
      )
    }

    // 1. Eliminar de profiles
    const { error: errProf } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id)

    if (errProf) {
      console.error('[usuarios/[id] DELETE] Error eliminando perfil:', errProf)
      return NextResponse.json({ error: errProf.message }, { status: 500 })
    }

    // 2. Eliminar de supabase auth
    const { error: errAuth } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (errAuth) {
      console.error('[usuarios/[id] DELETE] Error eliminando auth user:', errAuth)
      // Aun si falla auth, el perfil ya se eliminó
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor'
    console.error('[usuarios/[id] DELETE]', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
