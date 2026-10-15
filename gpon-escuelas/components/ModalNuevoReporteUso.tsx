'use client'

import { useState, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faTimes,
  faCalendarAlt,
  faPenToSquare,
  faCamera,
  faTrash,
  faCheckCircle,
  faBuilding,
  faPaperPlane,
  faPlus,
  faImage,
  faEye,
  faSpinner,
} from '@fortawesome/free-solid-svg-icons'

interface ModalNuevoReporteUsoProps {
  onClose: () => void
  onCreated: () => void
  institucionNombre?: string
  institucionCCT?: string
  directorDefault?: string
}

export default function ModalNuevoReporteUso({
  onClose,
  onCreated,
  institucionNombre,
  institucionCCT,
  directorDefault,
}: ModalNuevoReporteUsoProps) {
  const [paso, setPaso] = useState<number>(1)
  const [guardando, setGuardando] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [procesandoFotos, setProcesandoFotos] = useState<boolean>(false)
  const [fotoZoom, setFotoZoom] = useState<string | null>(null)

  const inputFileRef = useRef<HTMLInputElement>(null)

  // 1. Periodo y Plantel
  const [cicloEscolar, setCicloEscolar] = useState('2024-2025')
  const [periodo, setPeriodo] = useState('Semestre 1 (Agosto – Enero)')
  const [responsableNombre, setResponsableNombre] = useState(directorDefault || '')
  const [responsableCargo, setResponsableCargo] = useState('Director(a) del Plantel')

  // 2. Redacción libre y Fotografías (El campo en blanco solicitado)
  const [reporteTexto, setReporteTexto] = useState('')
  const [fotos, setFotos] = useState<string[]>([])

  // 3. Calidad y Estimaciones opcionales
  const [calidadServicio, setCalidadServicio] = useState<'excelente' | 'buena' | 'regular' | 'deficiente'>('buena')
  const [estabilidad, setEstabilidad] = useState<'sin_interrupciones' | 'interrupciones_leves' | 'frecuentes'>('sin_interrupciones')
  const [velocidadSuficiente, setVelocidadSuficiente] = useState<'si' | 'parcial' | 'no'>('si')
  const [usuariosAprox, setUsuariosAprox] = useState<number>(120)
  const [equiposAprox, setEquiposAprox] = useState<number>(35)
  const [ampliacionCobertura, setAmpliacionCobertura] = useState(false)
  const [areasMejora, setAreasMejora] = useState('')
  const [observaciones, setObservaciones] = useState('')

  // Función para comprimir imágenes en el cliente a ~1200px máx y JPEG 0.75
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height
          const maxDim = 1200

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve(e.target?.result as string)
            return
          }
          ctx.drawImage(img, 0, 0, width, height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75)
          resolve(dataUrl)
        }
        img.onerror = reject
        img.src = e.target?.result as string
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  // Manejador de carga de fotos
  async function handleArchivosFotos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    setProcesandoFotos(true)
    setError(null)

    try {
      const arrayFiles = Array.from(files)
      // Límite de 8 fotos
      if (fotos.length + arrayFiles.length > 8) {
        setError('Puedes subir un máximo de 8 fotografías por reporte semestral.')
      }

      const fotosComprimidas: string[] = []
      for (const file of arrayFiles.slice(0, 8 - fotos.length)) {
        if (!file.type.startsWith('image/')) continue
        const dataUrl = await compressImage(file)
        fotosComprimidas.push(dataUrl)
      }

      setFotos((prev) => [...prev, ...fotosComprimidas])
    } catch (err) {
      console.error('Error procesando fotos:', err)
      setError('Hubo un problema al procesar las imágenes. Por favor intenta con fotos más ligeras.')
    } finally {
      setProcesandoFotos(false)
      if (inputFileRef.current) inputFileRef.current.value = ''
    }
  }

  function eliminarFoto(index: number) {
    setFotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!responsableNombre.trim()) {
      setError('Por favor indica el nombre del director o responsable del reporte.')
      setPaso(1)
      return
    }

    if (!reporteTexto.trim() || reporteTexto.trim().length < 20) {
      setError('Por favor escribe el reporte detallado en el Paso 2 (mínimo 20 caracteres describiendo el uso del internet).')
      setPaso(2)
      return
    }

    setGuardando(true)
    setError(null)

    try {
      const res = await fetch('/api/reportes-uso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciclo_escolar: cicloEscolar,
          periodo: periodo,
          reporte_texto: reporteTexto.trim(),
          fotos: fotos,
          calidad_servicio: calidadServicio,
          estabilidad: estabilidad,
          velocidad_suficiente: velocidadSuficiente,
          usuarios_concurrentes: usuariosAprox || 0,
          dispositivos_laboratorio: equiposAprox || 0,
          ampliacion_cobertura: ampliacionCobertura,
          areas_mejora: areasMejora.trim() || null,
          observaciones: observaciones.trim() || null,
          responsable_nombre: responsableNombre.trim(),
          responsable_cargo: responsableCargo.trim() || 'Director(a) del Plantel',
          estado: 'enviado',
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el reporte semestral.')
      }

      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al enviar el reporte semestral.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Encabezado */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cédula Semestral de Uso y Aprovechamiento de Internet
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {institucionNombre || 'Plantel Escolar'}{' '}
              {institucionCCT ? `(CCT: ${institucionCCT})` : ''} • Reporte oficial 2 veces al año
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Indicador de 3 Pasos */}
        <div className="grid grid-cols-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-center text-xs">
          {[
            { id: 1, label: '1. Periodo y Plantel', icon: faCalendarAlt },
            { id: 2, label: '2. Reporte Escrito y Fotos', icon: faPenToSquare },
            { id: 3, label: '3. Calidad y Envío', icon: faCheckCircle },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPaso(item.id)}
              className={`py-3 px-2 font-semibold transition-all border-b-2 flex items-center justify-center gap-2 ${
                paso === item.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <FontAwesomeIcon icon={item.icon} className="text-xs" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden">Paso {item.id}</span>
            </button>
          ))}
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          {/* PASO 1: Periodo y Plantel */}
          {paso === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                <p className="font-semibold mb-1">Cédula Oficial Semestral de Conectividad GPON</p>
                <p className="text-[11px] text-blue-700 dark:text-blue-300">
                  Las escuelas beneficiarias con el servicio GPON deben emitir este reporte 2 veces al año (al cierre de cada semestre escolar) para respaldar y justificar el aprovechamiento del ancho de banda y solicitar mejoras.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Ciclo Escolar *
                  </label>
                  <select
                    value={cicloEscolar}
                    onChange={(e) => setCicloEscolar(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="2023-2024">Ciclo 2023-2024</option>
                    <option value="2024-2025">Ciclo 2024-2025</option>
                    <option value="2025-2026">Ciclo 2025-2026</option>
                    <option value="2026-2027">Ciclo 2026-2027</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Periodo del Semestre *
                  </label>
                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Semestre 1 (Agosto – Enero)">
                      Semestre 1: Agosto – Enero (1er Periodo)
                    </option>
                    <option value="Semestre 2 (Febrero – Julio)">
                      Semestre 2: Febrero – Julio (2do Periodo)
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Director(a) o Responsable del Reporte *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo del director"
                    value={responsableNombre}
                    onChange={(e) => setResponsableNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cargo o Función *
                  </label>
                  <input
                    type="text"
                    value={responsableCargo}
                    onChange={(e) => setResponsableCargo(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-500 dark:text-slate-400 block mb-1 font-semibold">
                  Plantel registrado:
                </span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {institucionNombre || 'Institución Educativa vinculada'}
                </span>
                {institucionCCT && (
                  <span className="ml-2 font-mono text-[11px] text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                    CCT: {institucionCCT}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* PASO 2: Redacción del Reporte y Subida de Fotos (CAMPO EN BLANCO) */}
          {paso === 2 && (
            <div className="space-y-5">
              {/* Campo en blanco de redacción */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faPenToSquare} className="text-blue-600" />
                    Redacción del Reporte de Uso de Internet *
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {reporteTexto.length} caracteres ({reporteTexto.trim() ? reporteTexto.trim().split(/\s+/).length : 0} palabras)
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Escribe libremente y a detalle cómo se utilizó la conectividad durante este periodo semestral:
                </p>
                <textarea
                  rows={8}
                  required
                  value={reporteTexto}
                  onChange={(e) => setReporteTexto(e.target.value)}
                  placeholder="Ejemplo: Durante el presente semestre escolar, el servicio de internet GPON benefició a un total de 180 alumnos y 12 docentes del plantel. Se utilizó principalmente en el aula de medios para clases interactivas de ciencias y matemáticas, consultas bibliográficas y proyectos de investigación. Asimismo, en el área administrativa se llevaron a cabo los trámites de control escolar, captura de calificaciones en el portal estatal y las sesiones del Consejo Técnico Escolar..."
                  className="w-full p-3.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs focus:ring-2 focus:ring-blue-500 leading-relaxed font-sans placeholder-slate-400 shadow-inner"
                />
              </div>

              {/* Guía temática de apoyo */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">
                  Sugerencias para enriquecer tu reporte:
                </span>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                  <li>Actividades académicas y materias que usaron internet (computación, ciencias, etc.).</li>
                  <li>Uso del aula de medios o proyectores en salones de clase.</li>
                  <li>Trámites administrativos, calificaciones y Consejo Técnico Escolar (CTE).</li>
                  <li>Plataformas educativas utilizadas (Classroom, Teams, Khan Academy, SEIEM).</li>
                </ul>
              </div>

              {/* Sección de subida de fotos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faCamera} className="text-blue-600" />
                      Evidencias Fotográficas del Uso de Internet
                    </label>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Adjunta fotografías de alumnos en el laboratorio, clases digitales, eventos o equipamiento escolar (máximo 8 fotos).
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    {fotos.length} / 8 fotos
                  </span>
                </div>

                {/* Botón / dropzone para adjuntar fotos */}
                <input
                  type="file"
                  ref={inputFileRef}
                  accept="image/*"
                  multiple
                  onChange={handleArchivosFotos}
                  className="hidden"
                />

                <div
                  onClick={() => !procesandoFotos && inputFileRef.current?.click()}
                  className={`border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-5 text-center cursor-pointer transition-all bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/30 ${
                    procesandoFotos ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {procesandoFotos ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-blue-600">
                      <FontAwesomeIcon icon={faSpinner} className="animate-spin text-xl" />
                      <span className="text-xs font-medium">Optimizando y preparando imágenes...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <FontAwesomeIcon icon={faImage} className="text-base" />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Haz clic aquí para seleccionar fotografías
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Formatos JPG, PNG, WebP (se optimizan automáticamente para no saturar tu red)
                      </span>
                    </div>
                  )}
                </div>

                {/* Cuadrícula de fotos subidas */}
                {fotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3.5">
                    {fotos.map((imgSrc, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 aspect-video shadow-xs"
                      >
                        <img
                          src={imgSrc}
                          alt={`Evidencia ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setFotoZoom(imgSrc)}
                            className="p-1.5 rounded-lg bg-white/90 text-slate-800 hover:bg-white text-xs shadow"
                            title="Ver en grande"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            type="button"
                            onClick={() => eliminarFoto(idx)}
                            className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs shadow"
                            title="Eliminar foto"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                        <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                          Foto {idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PASO 3: Calidad del servicio y Conclusiones */}
          {paso === 3 && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evalúa el comportamiento de la red de fibra óptica GPON durante el semestre para el reporte ante el NOC central:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Calificación General de la Conexión GPON *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'excelente', label: 'Excelente', color: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
                    { id: 'buena', label: 'Buena', color: 'border-blue-500 bg-blue-50 text-blue-800' },
                    { id: 'regular', label: 'Regular', color: 'border-amber-500 bg-amber-50 text-amber-800' },
                    { id: 'deficiente', label: 'Deficiente', color: 'border-rose-500 bg-rose-50 text-rose-800' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCalidadServicio(opt.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold transition-all text-center ${
                        calidadServicio === opt.id
                          ? opt.color + ' ring-2 ring-blue-500 shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Estabilidad del Enlace
                  </label>
                  <select
                    value={estabilidad}
                    onChange={(e) => setEstabilidad(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                  >
                    <option value="sin_interrupciones">Sin caídas de servicio (Estable)</option>
                    <option value="interrupciones_leves">Micro-cortes esporádicos</option>
                    <option value="frecuentes">Interrupciones frecuentes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    ¿La velocidad fue suficiente para las clases?
                  </label>
                  <select
                    value={velocidadSuficiente}
                    onChange={(e) => setVelocidadSuficiente(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                  >
                    <option value="si">Sí, cubrió las necesidades</option>
                    <option value="parcial">Parcialmente (lento en horas pico)</option>
                    <option value="no">No, insuficiente para los equipos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Usuarios concurrentes aproximados
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={usuariosAprox}
                    onChange={(e) => setUsuariosAprox(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                  />
                  <span className="text-[10px] text-slate-400">Alumnos y maestros conectados simultáneamente</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Equipos utilizados (estimado)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={equiposAprox}
                    onChange={(e) => setEquiposAprox(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                  />
                  <span className="text-[10px] text-slate-400">Computadoras de cómputo, laptops y pantallas</span>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ampliacionCobertura}
                    onChange={(e) => setAmpliacionCobertura(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>¿El plantel requiere ampliación de cobertura Wi-Fi en otras áreas?</span>
                </label>
                {ampliacionCobertura && (
                  <input
                    type="text"
                    placeholder="Indica qué áreas (ej. Patio cívico, edificio B, biblioteca)"
                    value={areasMejora}
                    onChange={(e) => setAreasMejora(e.target.value)}
                    className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Observaciones Generales o Peticiones al NOC (opcional)
                </label>
                <textarea
                  rows={2}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Comentarios adicionales para la mesa de ayuda técnica..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl text-xs"
                />
              </div>
            </div>
          )}

          {/* Botones de navegación entre pasos */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            {paso > 1 ? (
              <button
                type="button"
                onClick={() => setPaso(paso - 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                ← Anterior
              </button>
            ) : (
              <div></div>
            )}

            {paso < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (paso === 1 && !responsableNombre.trim()) {
                    setError('Por favor indica el nombre del director o responsable.')
                    return
                  }
                  if (paso === 2 && (!reporteTexto.trim() || reporteTexto.trim().length < 20)) {
                    setError('Por favor escribe el reporte de uso en el campo de texto (mínimo 20 caracteres).')
                    return
                  }
                  setError(null)
                  setPaso(paso + 1)
                }}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm"
              >
                Siguiente →
              </button>
            ) : (
              <button
                type="submit"
                disabled={guardando}
                className="px-6 py-2.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-blue-700 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                {guardando ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    Enviando reporte...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} />
                    Firmar y Enviar Reporte Oficial
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Modal Zoom Foto */}
      {fotoZoom && (
        <div
          onClick={() => setFotoZoom(null)}
          className="fixed inset-0 z-[3000] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={fotoZoom} alt="Zoom" className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" />
            <button
              onClick={() => setFotoZoom(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white text-slate-800 flex items-center justify-center shadow-lg font-bold"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
