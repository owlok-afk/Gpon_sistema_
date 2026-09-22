import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    const cookiesSupabase = allCookies.filter((c) => c.name.startsWith('sb-'))

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

    const { data: { user }, error: errUser } = await supabase.auth.getUser()

    let perfil = null
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      perfil = data
    }

    return NextResponse.json({
      totalCookies: allCookies.length,
      nombresCookies: allCookies.map((c) => c.name),
      tieneCookiesSupabase: cookiesSupabase.length > 0,
      hayUsuario: !!user,
      errorUsuario: errUser?.message || null,
      email: user?.email || null,
      perfil: perfil,
    })
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
  }
}