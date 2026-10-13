import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabaseServer'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// GET: Obtener reportes de uso semestral
export async function GET(request: Request) {
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
      .select('role')
      .eq('id', user.id)
      .single()

    const url = new URL(request.url)
    const ciclo = url.searchParams.get('ciclo')
    const periodo = url.searchParams.get('periodo')

    let query = supabaseAdmin
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
      .order('created_at', { ascending: false })

    if (ciclo) query = query.eq('ciclo_escolar', ciclo)
    if (periodo) query = query.eq('periodo', periodo)

    if (perfil?.role === 'escuela') {
      // Buscar la institución asociada a la escuela
      const { data: inst } = await supabaseAdmin
        .from('instituciones')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (inst) {
        query = query.or(`created_by.eq.${user.id},institucion_id.eq.${inst.id}`)
      } else {
        query = query.eq('created_by', user.id)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Error al obtener reportes_uso:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reportes: data || [] })
  } catch (err: any) {
    console.error('Error inesperado en GET reportes_uso:', err)
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}

// POST: Crear nuevo reporte semestral de uso
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
      .select('role')
      .eq('id', user.id)
      .single()

    const body = await request.json()

    // Encontrar institución
    let institucionId = body.institucion_id

    if (!institucionId && perfil?.role === 'escuela') {
      const { data: inst } = await supabaseAdmin
        .from('instituciones')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()
      if (inst) {
        institucionId = inst.id
      }
    }

    if (!body.ciclo_escolar || !body.periodo || !body.responsable_nombre || !body.reporte_texto) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (ciclo escolar, periodo, nombre del responsable o redacción del reporte).' },
        { status: 400 }
      )
    }

    const nuevoReporte = {
      institucion_id: institucionId || null,
      created_by: user.id,
      ciclo_escolar: body.ciclo_escolar.trim(),
      periodo: body.periodo.trim(),
      reporte_texto: body.reporte_texto.trim(),
      fotos: Array.isArray(body.fotos) ? body.fotos : [],
      calidad_servicio: body.calidad_servicio || 'buena',
      estabilidad: body.estabilidad || 'sin_interrupciones',
      velocidad_suficiente: body.velocidad_suficiente || 'si',
      usuarios_concurrentes: Number(body.usuarios_concurrentes) || 0,
      dispositivos_laboratorio: Number(body.dispositivos_laboratorio) || 0,
      dispositivos_administrativos: Number(body.dispositivos_administrativos) || 0,
      dispositivos_aulas: Number(body.dispositivos_aulas) || 0,
      dispositivos_moviles: Number(body.dispositivos_moviles) || 0,
      ampliacion_cobertura: Boolean(body.ampliacion_cobertura),
      areas_mejora: body.areas_mejora?.trim() || null,
      observaciones: body.observaciones?.trim() || null,
      responsable_nombre: body.responsable_nombre.trim(),
      responsable_cargo: body.responsable_cargo?.trim() || 'Director(a) del Plantel',
      estado: body.estado || 'enviado',
    }

    const { data, error } = await supabaseAdmin
      .from('reportes_uso')
      .insert([nuevoReporte])
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
      console.error('Error al insertar reporte_uso:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reporte: data, ok: true })
  } catch (err: any) {
    console.error('Error inesperado en POST reportes_uso:', err)
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 })
  }
}

