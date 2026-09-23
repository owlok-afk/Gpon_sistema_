import { NextResponse } from 'next/server'

type Coords = { lat: number; lng: number }

function extraerCoordsDeUrl(url: string): Coords | null {
  let match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  }

  match = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  }

  match = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  }

  match = url.match(/\/(?:place|search|dir)\/(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  }

  return null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url } = body

    if (!url || url.trim() === '') {
      return NextResponse.json({ error: 'El link está vacío.' }, { status: 400 })
    }

    let urlTrim = url.trim()

    if (!urlTrim.startsWith('http')) {
      urlTrim = 'https://' + urlTrim
    }

    if (!/google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/i.test(urlTrim)) {
      return NextResponse.json(
        { error: 'El link no parece ser de Google Maps. Debe contener google.com/maps o maps.app.goo.gl' },
        { status: 400 }
      )
    }

    let coords = extraerCoordsDeUrl(urlTrim)

    if (!coords) {
      try {
        const res = await fetch(urlTrim, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        })

        const location = res.headers.get('location')
        if (location) {
          coords = extraerCoordsDeUrl(location)
        }

        if (!coords && res.url) {
          coords = extraerCoordsDeUrl(res.url)
        }
      } catch (err) {
        console.error('[parsear-maps] Error siguiendo redirect:', err)
      }
    }

    if (!coords) {
      return NextResponse.json(
        { error: 'No se pudieron extraer coordenadas del link. Asegúrate de que sea un link de ubicación (no de búsqueda ni de ruta).' },
        { status: 422 }
      )
    }

    return NextResponse.json({
      ok: true,
      lat: coords.lat,
      lng: coords.lng,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor'
    console.error('[parsear-maps] Error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}