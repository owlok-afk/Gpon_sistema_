const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

console.log('📂 Leyendo archivo .env.local...')

// Leer el archivo .env.local directamente
const envPath = path.join(__dirname, '..', '.env.local')
console.log('📁 Ruta del .env.local:', envPath)

if (!fs.existsSync(envPath)) {
  console.error('❌ No se encuentra el archivo .env.local')
  console.error('📁 Ruta buscada:', envPath)
  process.exit(1)
}

// Leer y parsear el archivo
const envContent = fs.readFileSync(envPath, 'utf-8')
console.log('📄 Contenido del .env.local:')
console.log(envContent)

const lines = envContent.split('\n')
for (const line of lines) {
  const trimmedLine = line.trim()
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const match = trimmedLine.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      process.env[key] = value
      console.log(`✅ Cargada variable: ${key}=${value.substring(0, 20)}...`)
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Verificando variables:')
console.log('  URL:', supabaseUrl ? '✅ Presente' : '❌ Faltante')
console.log('  KEY:', supabaseKey ? '✅ Presente' : '❌ Faltante')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan variables de entorno')
  process.exit(1)
}

console.log('✅ Conectando a Supabase...')
const supabase = createClient(supabaseUrl, supabaseKey)

function parseCSVLine(line) {
  const values = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  values.push(current.trim())
  return values
}

async function importarEscuelas() {
  try {
    console.log('📚 Importando escuelas...')
    
    const csvPath = path.join(__dirname, '..', 'escuelas.csv')
    console.log('📁 Buscando CSV en:', csvPath)
    
    if (!fs.existsSync(csvPath)) {
      console.error('❌ No se encuentra escuelas.csv')
      console.log('💡 Coloca tu archivo CSV en la raíz del proyecto')
      return
    }
    
    const content = fs.readFileSync(csvPath, 'utf-8')
    const lines = content.split('\n').filter(line => line.trim() !== '')
    
    console.log(`📄 ${lines.length} líneas encontradas`)
    
    let importados = 0
    let errores = 0
    
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i])
        if (values.length < 1 || !values[0]) continue
        
        const escuela = {
          nombre: values[0]?.trim() || null,
          domicilio: values[1]?.trim() || null,
          matricula: values[2] ? parseInt(values[2]) : null,
          cct: values[3]?.trim() || null,
          director: values[4]?.trim() || null,
          telefono: values[5]?.trim() || null,
          correo: values[6]?.trim() || null,
          año_ejecucion: values[7] ? parseInt(values[7]) : null,
          presidente_asociacion: values[8]?.trim() || null,
          telefono_asociacion: values[9]?.trim() || null,
          ciclo_escolar: values[10]?.trim() || null,
          zona_escolar: values[11]?.trim() || null
        }
        
        if (!escuela.nombre) continue
        
        console.log(`  ➜ Importando: ${escuela.nombre}`)
        
        const { error } = await supabase
          .from('instituciones')
          .insert([escuela])
        
        if (error) {
          console.error(`  ❌ Error: ${error.message}`)
          errores++
        } else {
          importados++
          console.log(`  ✅ Importado correctamente`)
        }
      } catch (error) {
        console.error('  ❌ Error procesando línea:', error.message)
        errores++
      }
    }
    
    console.log(`\n📊 Resumen:`)
    console.log(`  ✅ Importados: ${importados}`)
    console.log(`  ❌ Errores: ${errores}`)
    
  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

importarEscuelas()