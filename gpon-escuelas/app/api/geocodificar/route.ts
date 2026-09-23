import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { direccion } = body

    if (!direccion || direccion.trim() === '') {
      return NextResponse.json({ error: 'La dirección está vacía.' }, { status: 400 })
    }

    let query = direccion.trim()

    if (!/m[eé]xico/i.test(query)) {
      query += ', México'
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=6&addressdetails=1&countrycodes=mx&q=${encodeURIComponent(query)}`

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'GPON-Escuelas/1.0 (soporte@gpontelecom.mx)',
        'Accept-Language': 'es',
      },
      next: { revalidate: 3600 },
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Error al consultar el servicio de geocodificación.' },
        { status: 502 }
      )
    }

    const data = await res.json()

    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No se encontró la ubicación. Intenta agregar el municipio o el estado.' },
        { status: 404 }
      )
    }

    const resultados = data.map((r: any) => ({
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      displayName: r.display_name,
      tipo: r.type,
      importancia: r.importance,
    }))

    return NextResponse.json({ ok: true, resultados })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor'
    console.error('[geocodificar] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}