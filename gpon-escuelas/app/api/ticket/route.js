// app/api/ticket/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
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
    console.error('[api/ticket POST] Error:', err)
    return NextResponse.json({ error: err.message || 'Error interno' }, { status: 500 })
  }
}