// app/api/parsear-maps/route.js
import { NextResponse } from 'next/server'

// Extrae lat/lng de una URL de Google Maps (larga)
function extraerCoordsDeUrl(url) {
  // Formato 1: /@19.666611,-100.142917,17z/
  let match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  }

  // Formato 2: ?q=19.666611,-100.142917
  match = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  }

  // Formato 3: !3d19.666611!4d-100.142917 (place data)
  match = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/)
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  }

  // Formato 4: /place/lat,lng/ o /search/lat,lng/
  match = url.match(/\/(?:place|search|dir)\/(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (match) {
    return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  }

  return null
}

export async function POST(request) {
  try {
    const { url } = await request.json()

    if (!url || url.trim() === '') {
      return NextResponse.json({ error: 'El link está vacío.' }, { status: 400 })
    }

    let urlTrim = url.trim()

    // Aceptar también URLs sin https://
    if (!urlTrim.startsWith('http')) {
      urlTrim = 'https://' + urlTrim
    }

    // Validar que sea de Google Maps
    if (!/google\.com\/maps|goo\.gl\/maps|maps\.app\.goo\.gl/i.test(urlTrim)) {
      return NextResponse.json(
        { error: 'El link no parece ser de Google Maps. Debe contener google.com/maps o maps.app.goo.gl' },
        { status: 400 }
      )
    }

    // 1. Intentar extraer coords directo de la URL larga
    let coords = extraerCoordsDeUrl(urlTrim)

    // 2. Si es link corto, resolver la redirección
    if (!coords) {
      try {
        const res = await fetch(urlTrim, {
          method: 'GET',
          redirect: 'manual', // No seguimos la redirección automáticamente
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
        })

        // Google devuelve un 301/302 con la URL final en el header Location
        const location = res.headers.get('location')
        if (location) {
          coords = extraerCoordsDeUrl(location)
        }

        // Si aún no, intentamos con la URL final completa
        if (!coords && res.url) {
          coords = extraerCoordsDeUrl(res.url)
        }
      } catch (err) {
        console.error('[parsear-maps] Error siguiendo redirect:', err)
      }
    }

    if (!coords) {
      return NextResponse.json(
        {
          error:
            'No se pudieron extraer coordenadas del link. Asegúrate de que sea un link de ubicación (no de búsqueda ni de ruta).',
        },
        { status: 422 }
      )
    }

    return NextResponse.json({
      ok: true,
      lat: coords.lat,
      lng: coords.lng,
    })
  } catch (err) {
    console.error('[parsear-maps] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Error interno del servidor' },
      { status: 500 }
    )
  }
}