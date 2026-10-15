'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPrint,
  faTimes,
  faBuilding,
  faCheckCircle,
  faWifi,
  faDesktop,
  faUsers,
  faShieldHalved,
  faCalendarAlt,
  faCamera,
  faEye,
} from '@fortawesome/free-solid-svg-icons'

export type ReporteUsoCompleto = {
  id: number
  institucion_id: number | null
  created_by: string | null
  ciclo_escolar: string
  periodo: string
  reporte_texto?: string
  fotos?: string[]
  dispositivos_laboratorio?: number
  dispositivos_administrativos?: number
  dispositivos_aulas?: number
  dispositivos_moviles?: number
  usuarios_concurrentes?: number
  uso_pedagogico?: boolean
  uso_administrativo?: boolean
  uso_capacitacion?: boolean
  plataformas_utilizadas?: string | null
  horario_pico?: string | null
  calidad_servicio: 'excelente' | 'buena' | 'regular' | 'deficiente'
  estabilidad: 'sin_interrupciones' | 'interrupciones_leves' | 'frecuentes'
  velocidad_suficiente: 'si' | 'parcial' | 'no'
  ampliacion_cobertura: boolean
  areas_mejora: string | null
  observaciones: string | null
  responsable_nombre: string
  responsable_cargo: string
  estado: 'borrador' | 'enviado' | 'revisado'
  created_at: string
  institucion?: {
    nombre: string
    cct: string | null
    turno: string | null
    domicilio: string | null
    director: string | null
    telefono: string | null
  } | null
}

export default function ReporteUsoImpresionModal({
  reporte,
  onClose,
}: {
  reporte: ReporteUsoCompleto
  onClose: () => void
}) {
  const [fotoZoom, setFotoZoom] = useState<string | null>(null)

  const handlePrint = () => {
    window.print()
  }

  const inst = reporte.institucion

  const calidadMap: Record<string, string> = {
    excelente: 'Excelente (Conexión óptima y veloz)',
    buena: 'Buena (Adecuada para operaciones escolares)',
    regular: 'Regular (Presenta saturación ocasional)',
    deficiente: 'Deficiente (Requiere mantenimiento o revisión técnica)',
  }

  const estabilidadMap: Record<string, string> = {
    sin_interrupciones: 'Estable (Sin caídas de servicio registradas)',
    interrupciones_leves: 'Estable con micro-cortes esporádicos',
    frecuentes: 'Inestable (Caídas frecuentes que afectan clases)',
  }

  const velocidadMap: Record<string, string> = {
    si: 'Sí, cubre completamente las necesidades escolares',
    parcial: 'Parcialmente suficiente (lenta en horas pico de laboratorio)',
    no: 'Insuficiente para la matrícula actual de equipos',
  }

  const fotosList = Array.isArray(reporte.fotos) ? reporte.fotos : []

  return (
    <div className="fixed inset-0 bg-black/60 z-[2500] flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #hoja-reporte-oficial, #hoja-reporte-oficial * {
            visibility: visible;
          }
          #hoja-reporte-oficial {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 15mm 20mm;
            background: white !important;
            color: black !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-imprimir {
            display: none !important;
          }
          .salto-pagina {
            page-break-before: always;
          }
        }
      `}</style>

      <div className="w-full max-w-4xl my-6 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Barra superior de control */}
        <div className="no-imprimir p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Cédula Semestral #{reporte.id} — {reporte.periodo} ({reporte.ciclo_escolar})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
            >
              <FontAwesomeIcon icon={faPrint} />
              Imprimir / Guardar PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} className="text-base" />
            </button>
          </div>
        </div>

        {/* Documento Imprimible */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-100 dark:bg-slate-950/50 flex justify-center">
          <div
            id="hoja-reporte-oficial"
            className="w-full max-w-[820px] bg-white text-slate-900 p-8 sm:p-12 rounded-xl shadow-md border border-slate-200 flex flex-col gap-6"
            style={{ minHeight: '1050px' }}
          >
            {/* Encabezado Oficial */}
            <div className="flex items-center justify-between border-b-2 border-blue-900 pb-5">
              <div className="flex items-center gap-4">
                <img
                  src="/logo_gpon.png"
                  alt="GPON Telecom"
                  className="h-12 w-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div>
                  <h1 className="text-lg font-black text-[#08296c] tracking-tight leading-none uppercase">
                    GPON Telecom S.A. de C.V.
                  </h1>
                  <p className="text-[11px] font-bold text-slate-600 tracking-wide mt-1 uppercase">
                    Sistema de Monitoreo Escolar de Banda Ancha y Conectividad
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Infraestructura Digital de Educación Pública y Enlaces Ópticos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono font-bold bg-blue-50 text-blue-900 border border-blue-200 uppercase">
                  Folio: REP-{reporte.id.toString().padStart(5, '0')}
                </span>
                <p className="text-[10px] text-slate-500 mt-1">
                  Fecha: {new Date(reporte.created_at).toLocaleDateString('es-MX', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Título de la Cédula */}
            <div className="text-center py-2 bg-slate-50 border border-slate-200 rounded-lg">
              <h2 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                Cédula Semestral de Uso y Aprovechamiento de Internet Escolar
              </h2>
              <p className="text-[11px] text-blue-900 font-semibold mt-0.5">
                Ciclo Escolar: {reporte.ciclo_escolar} • Periodo: {reporte.periodo}
              </p>
            </div>

            {/* 1. Datos del Plantel */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                1. Datos Generales de la Institución Educativa
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Plantel:</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {inst?.nombre || 'Plantel Escolar'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Clave CCT:</span>
                  <span className="font-mono font-bold text-blue-800 bg-blue-100/60 px-2 py-0.5 rounded text-xs">
                    {inst?.cct || 'S/N'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Turno:</span>
                  <span className="font-medium text-slate-800">{inst?.turno || 'Matutino'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Director Responsable:</span>
                  <span className="font-medium text-slate-800">{inst?.director || reporte.responsable_nombre}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Teléfono / Contacto:</span>
                  <span className="font-mono font-medium text-slate-800">{inst?.telefono || 'N/A'}</span>
                </div>
                {inst?.domicilio && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Ubicación / Domicilio:</span>
                    <span className="text-slate-700">{inst.domicilio}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. INFORME ESCRITO NARRATIVO DEL REPORTE (El campo en blanco) */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                2. Reporte Escrito y Justificación Pedagógica del Uso de Internet
              </h3>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-sans">
                {reporte.reporte_texto || 'No se incluyó descripción escrita.'}
              </div>
            </div>

            {/* 3. EVIDENCIAS FOTOGRÁFICAS */}
            {fotosList.length > 0 && (
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 pb-1 mb-2">
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                    3. Evidencias Fotográficas Adjuntas ({fotosList.length} Fotografías)
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Actividades y Aulas del Plantel
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {fotosList.map((fotoUrl, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 aspect-video flex flex-col group relative"
                    >
                      <img
                        src={fotoUrl}
                        alt={`Evidencia ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setFotoZoom(fotoUrl)}
                        className="no-imprimir absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5"
                      >
                        <FontAwesomeIcon icon={faEye} />
                        Ampliar
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        Evidencia {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Evaluación Técnica y Calidad Percibida por el Plantel */}
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 border-b border-slate-200 pb-1">
                {fotosList.length > 0 ? '4' : '3'}. Evaluación Técnica y Calidad Percibida
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Calidad del Servicio:</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {calidadMap[reporte.calidad_servicio] || reporte.calidad_servicio}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Estabilidad del Enlace:</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {estabilidadMap[reporte.estabilidad] || reporte.estabilidad}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Suficiencia de Ancho de Banda:</span>
                  <span className="font-bold text-slate-900 text-xs">
                    {velocidadMap[reporte.velocidad_suficiente] || reporte.velocidad_suficiente}
                  </span>
                </div>
              </div>

              {(reporte.usuarios_concurrentes || reporte.dispositivos_laboratorio) ? (
                <div className="p-2 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-blue-900">
                    Alumnos y docentes concurrentes: <strong>{reporte.usuarios_concurrentes || 0}</strong>
                  </span>
                  <span className="font-semibold text-blue-900">
                    Equipos conectados aprox.: <strong>{reporte.dispositivos_laboratorio || 0}</strong>
                  </span>
                </div>
              ) : null}

              {reporte.areas_mejora && (
                <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Zonas prioritarias para ampliación de cobertura:</span>
                  <p className="text-slate-700 mt-0.5">{reporte.areas_mejora}</p>
                </div>
              )}

              {reporte.observaciones && (
                <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Observaciones adicionales de la escuela:</span>
                  <p className="text-slate-700 mt-0.5">{reporte.observaciones}</p>
                </div>
              )}
            </div>

            {/* Firmas de Conformidad */}
            <div className="mt-6 pt-6 border-t-2 border-slate-300 grid grid-cols-2 gap-10 text-center text-xs">
              <div className="flex flex-col items-center">
                <div className="w-52 border-b border-slate-700 mb-2"></div>
                <span className="font-bold text-slate-900">{reporte.responsable_nombre}</span>
                <span className="text-[10px] text-slate-600">{reporte.responsable_cargo}</span>
                <span className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">
                  Firma y Sello de la Escuela
                </span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-52 border-b border-slate-700 mb-2"></div>
                <span className="font-bold text-slate-900">Ing. Control y Operaciones NOC</span>
                <span className="text-[10px] text-slate-600">GPON Telecom S.A. de C.V.</span>
                <span className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">
                  Recepción y Validación Técnica
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Zoom Foto */}
      {fotoZoom && (
        <div
          onClick={() => setFotoZoom(null)}
          className="no-imprimir fixed inset-0 z-[3000] bg-black/80 flex items-center justify-center p-4 cursor-pointer"
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
