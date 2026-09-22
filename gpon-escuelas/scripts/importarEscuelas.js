// scripts/importar.js
const path = require('path')
const fs = require('fs')
const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// ---------- Utilidades ----------
function str(v) {
  if (v === undefined || v === null) return null
  const s = String(v).replace(/\s+/g, ' ').trim()
  if (s === '' || s.toLowerCase() === 'nan' || s.toLowerCase() === 'null') return null
  return s
}

function num(v) {
  const s = str(v)
  if (!s) return null
  const n = parseInt(String(s).replace(/[^0-9]/g, ''), 10)
  return isNaN(n) ? null : n
}

function cctLimpio(v) {
  const s = str(v)
  if (!s) return null
  // Quitar espacios y sufijos tipo "MATUTINO"/"VESPERTINO" si están pegados
  const sinTurno = s.replace(/\s+(MATUTINO|VESPERTINO)/i, '').trim()
  return sinTurno.toUpperCase()
}

function turnoDeCCT(v) {
  const s = str(v)
  if (!s) return null
  if (/MATUTINO/i.test(s)) return 'MATUTINO'
  if (/VESPERTINO/i.test(s)) return 'VESPERTINO'
  return null
}

// ---------- Detección de encabezado ----------
function detectarHeader(hoja) {
  for (let i = 0; i < hoja.length; i++) {
    const fila = (hoja[i] || []).map((c) => (c ? String(c).toUpperCase() : ''))
    const tieneNombre = fila.some((c) => c.includes('NOMBRE'))
    const tieneDirector = fila.some((c) => c.includes('DIRECTOR'))
    const tieneMatricula = fila.some((c) => c.includes('MATRICULA'))
    if (tieneNombre && (tieneDirector || tieneMatricula)) return i
  }
  return -1
}

// ---------- Mapear una fila a un objeto institución ----------
function mapearFila(row, headers) {
  const get = (palabras) => {
    for (let c = 0; c < headers.length; c++) {
      const h = headers[c] || ''
      if (palabras.some((p) => h.includes(p))) return row[c]
    }
    return null
  }

  // Detectar segunda columna "NUMERO"/"TELEFONO" (la de la asociación)
  const indicesNumero = []
  headers.forEach((h, i) => {
    if (h.includes('NUMERO') || h.includes('TELEFONO')) indicesNumero.push(i)
  })
  const telDirector = indicesNumero.length > 0 ? row[indicesNumero[0]] : null
  const telAsociacion = indicesNumero.length > 1 ? row[indicesNumero[1]] : null

  const cctBruto = get(['CLAVE CCT', 'CCT', 'CLAVE'])
  const nombre = str(get(['NOMBRE']))
  if (!nombre) return null

  return {
    nombre,
    domicilio: str(get(['DOMICILIO', 'DIRECCION'])),
    matricula: num(get(['MATRICULA'])),
    cct: cctLimpio(cctBruto),
    director: str(get(['DIRECTOR'])),
    telefono: str(telDirector),
    correo: str(get(['CORREO'])),
    año_ejecucion: num(get(['AÑO', 'EJECUCION'])),
    presidente_asociacion: str(get(['PRESIDENTE', 'ASOCIACION'])),
    telefono_asociacion: str(telAsociacion),
    ciclo_escolar: str(get(['CICLO'])),
    zona_escolar: str(get(['ZONA ESCOLAR', 'ZONA'])),
    turno: turnoDeCCT(cctBruto),
  }
}

// ---------- Deduplicación ----------
function deduplicar(filas) {
  const porCCT = new Map()
  const sinCCT = []

  for (const f of filas) {
    if (f.cct) {
      if (!porCCT.has(f.cct)) {
        porCCT.set(f.cct, f)
      } else {
        // Si ya existe, combinar: preferir valores no nulos
        const prev = porCCT.get(f.cct)
        for (const k of Object.keys(f)) {
          if ((prev[k] === null || prev[k] === undefined) && f[k] != null) {
            prev[k] = f[k]
          }
        }
      }
    } else {
      sinCCT.push(f)
    }
  }

  // Deduplicar los sin CCT por nombre+domicilio (case-insensitive)
  const mapaSin = new Map()
  for (const f of sinCCT) {
    const key = `${f.nombre.toLowerCase()}|${(f.domicilio || '').toLowerCase()}`
    if (!mapaSin.has(key)) {
      mapaSin.set(key, f)
    } else {
      const prev = mapaSin.get(key)
      for (const k of Object.keys(f)) {
        if ((prev[k] === null || prev[k] === undefined) && f[k] != null) {
          prev[k] = f[k]
        }
      }
    }
  }

  return [...porCCT.values(), ...mapaSin.values()]
}

// ---------- Main ----------
async function main() {
  const archivo = process.argv[2] || 'ESCUELAS GPON-WIMAX.xlsx'
  if (!fs.existsSync(archivo)) {
    console.error('No encuentro el archivo:', archivo)
    process.exit(1)
  }

  console.log('Leyendo:', archivo)
  const wb = XLSX.readFile(archivo)
  console.log('Hojas:', wb.SheetNames)

  const todas = []

  for (const nombreHoja of wb.SheetNames) {
    const hoja = XLSX.utils.sheet_to_json(wb.Sheets[nombreHoja], {
      header: 1,
      defval: null,
      blankrows: false,
    })

    const idxHeader = detectarHeader(hoja)
    if (idxHeader === -1) {
      console.log(`  → Hoja "${nombreHoja}": sin encabezado reconocible, se omite.`)
      continue
    }

    const headers = hoja[idxHeader].map((h) => (h ? String(h).toUpperCase() : ''))
    console.log(`  → Hoja "${nombreHoja}": encabezado en fila ${idxHeader + 1}`)

    let contador = 0
    for (let i = idxHeader + 1; i < hoja.length; i++) {
      const row = hoja[i]
      if (!row || row.length === 0) continue
      const obj = mapearFila(row, headers)
      if (obj) {
        todas.push(obj)
        contador++
      }
    }
    console.log(`     ${contador} filas leídas`)
  }

  console.log(`\nTotal filas leídas (con posibles duplicados): ${todas.length}`)

  const limpias = deduplicar(todas)
  console.log(`Total filas tras deduplicar: ${limpias.length}`)

  // Escribir CSV de respaldo (para que lo revises antes)
  const out = path.join(process.cwd(), 'instituciones_import.csv')
  const header = [
    'nombre',
    'domicilio',
    'matricula',
    'cct',
    'director',
    'telefono',
    'correo',
    'año_ejecucion',
    'presidente_asociacion',
    'telefono_asociacion',
    'ciclo_escolar',
    'zona_escolar',
    'turno',
  ]

  const escapar = (v) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }

  const lineas = [header.join(',')]
  for (const f of limpias) {
    lineas.push(header.map((h) => escapar(f[h])).join(','))
  }
  fs.writeFileSync(out, lineas.join('\n'), 'utf8')
  console.log(`\nCSV de respaldo guardado en: ${out}`)

  // Insertar en Supabase
  console.log('\nInsertando en Supabase...')
  let insertadas = 0
  const errores = []
  for (let i = 0; i < limpias.length; i += 50) {
    const lote = limpias.slice(i, i + 50)
    const { error, count } = await supabase
      .from('instituciones')
      .insert(lote, { count: 'exact' })
    if (error) {
      console.error(`Error en lote ${i}:`, error.message)
      errores.push({ desde: i, hasta: i + lote.length, error: error.message })
    } else {
      insertadas += lote.length
      console.log(`  ✓ Insertadas ${insertadas}/${limpias.length}`)
    }
  }

  console.log('\n=== Resumen ===')
  console.log(`Filas leídas: ${todas.length}`)
  console.log(`Tras deduplicar: ${limpias.length}`)
  console.log(`Insertadas en Supabase: ${insertadas}`)
  if (errores.length) {
    console.log('Errores:')
    errores.forEach((e) => console.log(`  - Lote ${e.desde}-${e.hasta}: ${e.error}`))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})