import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { titulo, descripcion, categoria, prioridad } = body

    if (!titulo || titulo.trim() === '') {
      return NextResponse.json({ error: 'El título es obligatorio.' }, { status: 400 })
    }

    const { data, error } = await supabase.rpc('crear_incidencia', {
      p_titulo: titulo,
      p_descripcion: descripcion || null,
      p_categoria: categoria || null,
      p_prioridad: prioridad || 'media',
    })

    if (error) {
      console.error('[api/ticket POST] Error RPC:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, ticket: data }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno'
    console.error('[api/ticket POST] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}