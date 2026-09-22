// app/api/solicitud/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, anonKey)

export async function POST(request) {
  try {
    const body = await request.json()

    const {
      nombre_institucion,
      cct,
      correo,
      director,
      telefono,
      domicilio,
      matricula,
      año_ejecucion,
      presidente_asociacion,
      telefono_asociacion,
      ciclo_escolar,
      zona_escolar,
      turno,
    } = body

    if (!nombre_institucion || !cct || !correo) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios: nombre, CCT y correo.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase.rpc('crear_solicitud', {
      p_nombre_institucion: nombre_institucion,
      p_cct: cct,
      p_correo: correo,
      p_director: director || null,
      p_telefono: telefono || null,
      p_domicilio: domicilio || null,
      p_matricula: matricula ?? null,
      p_año_ejecucion: año_ejecucion ?? null,
      p_presidente_asociacion: presidente_asociacion || null,
      p_telefono_asociacion: telefono_asociacion || null,
      p_ciclo_escolar: ciclo_escolar || null,
      p_zona_escolar: zona_escolar || null,
      p_turno: turno || null,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true, solicitud: data }, { status: 201 })
  } catch (err) {
    console.error('[api/solicitud] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}