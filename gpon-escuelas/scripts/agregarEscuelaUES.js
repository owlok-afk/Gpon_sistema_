const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Leer .env.local
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const lines = envContent.split('\n')
  for (const line of lines) {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const match = trimmedLine.match(/^([^=]+)=(.*)$/)
      if (match) {
        process.env[match[1].trim()] = match[2].trim()
      }
    }
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function agregarEscuela() {
  // Coordenadas exactas de Google Maps
  const lat = 19.666611
  const lng = -100.142917
  
  const escuela = {
    nombre: 'Unidad de Estudios Superiores, San José del Rincón',
    domicilio: 'AVENIDA UNIVERSIDAD SN, 50660 Colonia Las Tinajas, Méx.',
    director: null,
    telefono: '+52 17221099680',
    correo: 'umb.mx',
    matricula: null,
    cct: null,
    latitude: lat,
    longitude: lng,
    año_ejecucion: null,
    presidente_asociacion: null,
    telefono_asociacion: null,
    ciclo_escolar: null,
    zona_escolar: null
  }

  console.log('📚 Agregando escuela:', escuela.nombre)
  console.log(`📍 Latitud: ${lat}`)
  console.log(`📍 Longitud: ${lng}`)

  const { data, error } = await supabase
    .from('instituciones')
    .insert([escuela])
    .select()

  if (error) {
    console.error('❌ Error:', error)
  } else {
    console.log('✅ Escuela agregada correctamente')
    console.log('📊 Datos:', data)
  }
}

agregarEscuela()