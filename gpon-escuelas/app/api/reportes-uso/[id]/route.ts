import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// GET: Detalle de un reporte específico
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabaseUser = await getSupabaseServer()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from('reportes_uso')
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre,
          cct,
          turno,
          domicilio,
          director,
          telefono
        )
      `)
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Reporte no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ reporte: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}

// PATCH: Actualizar estado de un reporte (ej. 'revisado')
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    if (perfil?.role !== 'admin' && perfil?.role !== 'tecnico') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 })
    }

    const body = await request.json()
    const { estado } = body

    const { data, error } = await supabaseAdmin
      .from('reportes_uso')
      .update({ estado, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        institucion:instituciones (
          id,
          nombre,
          cct,
          turno,
          domicilio,
          director,
          telefono
        )
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reporte: data, ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}

